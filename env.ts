import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  server: {
    GEMINI_API_KEY: z.string().min(1).optional(),
    GEMINI_MODEL: z.string().min(1).default('gemini-2.5-flash'),
    ANON_DAILY_LIMIT: z.coerce.number().int().positive().default(3),
    MEMBER_DAILY_LIMIT: z.coerce.number().int().positive().default(10),
    PER_MINUTE_LIMIT: z.coerce.number().int().positive().default(6),
    UPSTASH_REDIS_REST_URL: z.url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  },
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.url().optional(),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  },
  runtimeEnv: {
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL,
    ANON_DAILY_LIMIT: process.env.ANON_DAILY_LIMIT,
    MEMBER_DAILY_LIMIT: process.env.MEMBER_DAILY_LIMIT,
    PER_MINUTE_LIMIT: process.env.PER_MINUTE_LIMIT,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
})

export function isSupabaseEnvConfigured(): boolean {
  return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
}

export function isUpstashEnvConfigured(): boolean {
  return Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN)
}
