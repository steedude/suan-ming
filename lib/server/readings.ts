import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { BaziChart } from '@/types/bazi'
import type { InterpretRequest } from '@/lib/validation/interpret'
import { reportServerError } from '@/lib/server/api-errors'
import { todayTaipei } from '@/utils/date'

export type AppSupabaseClient = SupabaseClient<Database>

export async function memberUsedToday(
  supabase: AppSupabaseClient,
  userId: string,
): Promise<number> {
  const startOfToday = `${todayTaipei()}T00:00:00+08:00`
  const { count, error } = await supabase
    .from('readings')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfToday)

  if (error) throw error

  return count ?? 0
}

export async function saveReading(
  supabase: AppSupabaseClient,
  user: User,
  body: InterpretRequest,
  chart: BaziChart,
  interpretation: string,
): Promise<void> {
  const { error } = await supabase.from('readings').insert({
    user_id: user.id,
    category: body.category,
    question: body.question,
    gender: body.gender,
    solar_date: chart.solarDate,
    chart,
    interpretation,
  })
  if (error) {
    reportServerError('READING_SAVE_FAILED', {
      cause: error,
      context: {
        tags: { source: 'supabase', operation: 'readings.insert' },
        user: { id: user.id },
        extra: {
          category: body.category,
          solarDate: chart.solarDate,
        },
      },
    })
  }
}
