import type { BaziChart } from '@/types/bazi'
import type { User } from '@supabase/supabase-js'
import { MEMBER_DAILY_LIMIT } from '@/configs/quota'
import { computeBazi } from '@/lib/bazi'
import { generateReadingStream, hasGeminiApiKey } from '@/lib/server/ai/gemini'
import { jsonError, reportServerError } from '@/lib/server/api-errors'
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

export const maxDuration = 60

export async function POST(request: Request): Promise<Response> {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return jsonError('BAD_REQUEST', 'zh-TW', 400)
  }

  const locale = getRequestLocale(raw)

  if (!hasGeminiApiKey()) {
    return jsonError('CONFIG_MISSING_GEMINI_API_KEY', locale, 500, {
      report: true,
      message: 'Missing GEMINI_API_KEY',
      context: {
        tags: { route: 'api.interpret' },
      },
    })
  }

  const ip = getClientIp(request)
  if (await isMinuteLimited(ip)) return jsonError('RATE_LIMITED', locale, 429)

  const body = parseInterpretRequest(raw)
  if (!body) return jsonError('BAD_REQUEST', locale, 400)

  let supabase: AppSupabaseClient | null = null
  let user: User | null = null
  try {
    if (isSupabaseConfiguredOnServer()) {
      supabase = await createSupabase()
      user = (await supabase.auth.getUser()).data.user
    }

    if (supabase && user) {
      const used = await memberUsedToday(supabase, user.id)
      if (used >= MEMBER_DAILY_LIMIT) {
        return jsonError('MEMBER_QUOTA_EXCEEDED', locale, 429)
      }
    } else if (await isAnonDailyLimited(ip)) {
      return jsonError('ANON_QUOTA_EXCEEDED', locale, 429)
    }
  } catch (err) {
    return jsonError('INTERNAL_SERVER_ERROR', locale, 500, {
      report: true,
      cause: err,
      context: {
        tags: { route: 'api.interpret', phase: 'quota' },
        user: user ? { id: user.id } : undefined,
      },
    })
  }

  let chart: BaziChart
  try {
    chart = computeBazi(body)
  } catch {
    return jsonError('BAD_REQUEST', locale, 400)
  }

  try {
    const stream = await generateReadingStream(body, chart)
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
          reportServerError('AI_STREAM_FAILED', {
            cause: err,
            context: {
              tags: { route: 'api.interpret', phase: 'stream' },
              user: user ? { id: user.id } : undefined,
            },
          })
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
    return jsonError('AI_SERVICE_UNAVAILABLE', locale, 502, {
      report: true,
      cause: err,
      context: {
        tags: { route: 'api.interpret', phase: 'generate' },
        user: user ? { id: user.id } : undefined,
      },
    })
  }
}
