import type { Database } from '@/types/database'
import { createBrowserClient } from '@supabase/ssr'
import { env, isSupabaseEnvConfigured } from '@/env'

/**
 * Supabase 瀏覽器端 client
 *
 * 會員功能為「可選配置」:兩個環境變數都設定後自動啟用;
 * 未設定時全站仍可正常使用(僅隱藏登入與紀錄功能)。
 */

export const isSupabaseConfigured = Boolean(isSupabaseEnvConfigured())

export function createClient() {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  )
}
