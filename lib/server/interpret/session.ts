import type { User } from '@supabase/supabase-js'
import {
  createClient as createSupabase,
  isSupabaseConfiguredOnServer,
} from '@/lib/supabase/server'
import type { AppSupabaseClient } from '@/lib/server/readings'

export interface InterpretSession {
  supabase: AppSupabaseClient | null
  user: User | null
}

/** 取得目前 request 對應的會員 session；未設定 Supabase 時視為訪客。 */
export async function getInterpretSession(): Promise<InterpretSession> {
  if (!isSupabaseConfiguredOnServer()) {
    return { supabase: null, user: null }
  }

  const supabase = await createSupabase()
  const user = (await supabase.auth.getUser()).data.user

  return { supabase, user }
}
