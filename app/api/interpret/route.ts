import type { User } from '@supabase/supabase-js'
import { MEMBER_DAILY_LIMIT } from '@/configs/quota'
import { computeBazi } from '@/lib/bazi'
import { generateReadingStream, hasGeminiApiKey } from '@/lib/server/ai/gemini'
import { jsonError } from '@/lib/server/api-errors'
import { isAnonDailyLimited, isMinuteLimited } from '@/lib/server/rate-limit'
import {
  getClientIp,
  getRequestLocale,
  parseInterpretRequest,
} from '@/lib/server/request'
import {
  type AppSupabaseClient,
  memberUsedToday,
  saveReading,
} from '@/lib/server/readings'
import {
  createClient as createSupabase,
  isSupabaseConfiguredOnServer,
} from '@/lib/supabase/server'

/**
 * 解讀 API(串流)
 *
 * 流程:驗證輸入 → 額度檢查 → 伺服器端確定性排盤 → Gemini 串流回傳
 *      → (會員)解讀完成後自動存入 readings。
 *
 * 額度設計(變現基礎):
 *   訪客 每日 ANON_DAILY_LIMIT 次(記憶體計數,per IP)
 *   會員 每日 MEMBER_DAILY_LIMIT 次(以 readings 資料表計數,跨實例準確)
 */

export const maxDuration = 60 // Vercel:AI 生成可能超過預設函式逾時

export async function POST(request: Request): Promise<Response> {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return jsonError('badRequest', 'zh-TW', 400)
  }

  const locale = getRequestLocale(raw)

  if (!hasGeminiApiKey()) return jsonError('noApiKey', locale, 500)

  const ip = getClientIp(request)
  if (await isMinuteLimited(ip)) return jsonError('tooFrequent', locale, 429)

  const body = parseInterpretRequest(raw)
  if (!body) return jsonError('badRequest', locale, 400)

  // 取得登入狀態(未設定 Supabase 時視為訪客)
  let supabase: AppSupabaseClient | null = null
  let user: User | null = null
  if (isSupabaseConfiguredOnServer()) {
    supabase = await createSupabase()
    user = (await supabase.auth.getUser()).data.user
  }

  // 每日額度
  if (supabase && user) {
    const used = await memberUsedToday(supabase, user.id)
    if (used >= MEMBER_DAILY_LIMIT) return jsonError('memberQuota', locale, 429)
  } else if (await isAnonDailyLimited(ip)) {
    return jsonError('anonQuota', locale, 429)
  }

  // 確定性排盤(與前端顯示用的是同一套程式)
  const chart = computeBazi(body)

  try {
    const stream = await generateReadingStream(body, chart)

    // Gemini 串流 → HTTP 純文字串流;完成後(會員)保存全文
    const encoder = new TextEncoder()
    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        let fullText = ''
        try {
          for await (const chunk of stream) {
            if (chunk.text) {
              fullText += chunk.text
              controller.enqueue(encoder.encode(chunk.text))
            }
          }
          if (supabase && user && fullText) {
            await saveReading(supabase, user, body, chart, fullText)
          }
          controller.close()
        } catch (err) {
          console.error('Gemini stream error:', err)
          controller.error(err)
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    console.error('Gemini API error:', err)
    return jsonError('aiUnavailable', locale, 502)
  }
}
