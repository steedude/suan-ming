import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { ANON_DAILY_LIMIT, PER_MINUTE_LIMIT } from '@/configs/quota'
import { env, isUpstashEnvConfigured } from '@/env'
import { todayTaipei } from '@/utils/date'

const minuteHits = new Map<string, number[]>()
const dayHits = new Map<string, { date: string; count: number }>()

const redis = isUpstashEnvConfigured()
  ? new Redis({
      url: env.UPSTASH_REDIS_REST_URL!,
      token: env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null

const minuteLimiter =
  redis &&
  new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(PER_MINUTE_LIMIT, '1 m'),
    prefix: 'suan-ming:minute',
  })

const anonDailyLimiter =
  redis &&
  new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(ANON_DAILY_LIMIT, '1 d'),
    prefix: 'suan-ming:anon-day',
  })

export async function isMinuteLimited(ip: string): Promise<boolean> {
  if (minuteLimiter) {
    const result = await minuteLimiter.limit(ip)
    return !result.success
  }

  const now = Date.now()
  const recent = (minuteHits.get(ip) ?? []).filter((t) => now - t < 60_000)
  recent.push(now)
  minuteHits.set(ip, recent)
  return recent.length > PER_MINUTE_LIMIT
}

export async function isAnonDailyLimited(ip: string): Promise<boolean> {
  const today = todayTaipei()
  if (anonDailyLimiter) {
    const result = await anonDailyLimiter.limit(`${ip}:${today}`)
    return !result.success
  }

  const entry = dayHits.get(ip)
  if (!entry || entry.date !== today) {
    dayHits.set(ip, { date: today, count: 1 })
    return false
  }
  entry.count++
  return entry.count > ANON_DAILY_LIMIT
}
