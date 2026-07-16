import type { Locale } from '@/types/i18n'
import { MEMBER_DAILY_LIMIT } from '@/configs/quota'
import { jsonError } from '@/lib/server/api-errors'
import { isAnonDailyLimited, isMinuteLimited } from '@/lib/server/rate-limit'
import { memberUsedToday } from '@/lib/server/readings'
import type { InterpretSession } from '@/lib/server/interpret/session'

interface QuotaInput {
  ip: string
  locale: Locale
  session: InterpretSession
}

/**
 * 檢查成本保護：
 * 1. 所有人都套每分鐘 IP 限流。
 * 2. 會員每日額度用 Supabase readings 計算。
 * 3. 訪客每日額度用 Upstash Redis / memory fallback 計算。
 */
export async function checkInterpretQuota({
  ip,
  locale,
  session,
}: QuotaInput): Promise<Response | null> {
  if (await isMinuteLimited(ip)) return jsonError('RATE_LIMITED', locale, 429)

  if (session.supabase && session.user) {
    const used = await memberUsedToday(session.supabase, session.user.id)
    return used >= MEMBER_DAILY_LIMIT
      ? jsonError('MEMBER_QUOTA_EXCEEDED', locale, 429)
      : null
  }

  return (await isAnonDailyLimited(ip))
    ? jsonError('ANON_QUOTA_EXCEEDED', locale, 429)
    : null
}
