'use client'

import type { Database } from '@/types/database'
import type { Locale } from '@/types/i18n'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import BaziChartCard from '@/components/BaziChartCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useUser } from '@/hooks/useUser'
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client'

/** 我的紀錄:會員的歷史解讀,可展開回顧、可刪除 */

type Reading = Database['public']['Tables']['readings']['Row']

export default function HistoryPage() {
  const { user, loading: userLoading } = useUser()
  const locale = useLocale() as Locale
  const common = useTranslations('common')
  const history = useTranslations('historyPage')
  const [readings, setReadings] = useState<Reading[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await createClient()
      .from('readings')
      .select(
        'id, user_id, created_at, category, question, gender, solar_date, chart, interpretation',
      )
      .order('created_at', { ascending: false })
      .limit(50)
    setReadings(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    // 從 Supabase 載入外部資料是 effect 的合理用途；load 內部會管理 loading/readings 狀態。
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (user) load()
  }, [user, load])

  async function remove(id: string) {
    await createClient().from('readings').delete().eq('id', id)
    setReadings((rs) => rs.filter((r) => r.id !== id))
  }

  // ── 未設定 / 未登入的空狀態 ──
  if (!isSupabaseConfigured) {
    return <Empty text={history('notConfigured')} backHome={common('backHome')} />
  }
  if (userLoading) {
    return <Empty text={common('loading')} backHome={common('backHome')} />
  }
  if (!user) {
    return (
      <Empty
        text={history('needLogin')}
        backHome={common('backHome')}
        action={
          <Button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-auth'))}
            variant="brand"
            className="mt-4"
          >
            {common('login')}
          </Button>
        }
      />
    )
  }

  return (
    <main className="mx-auto max-w-2xl px-5 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-xl text-stone-800">{history('title')}</h1>
        <Link href="/" className="text-sm text-stone-500 transition hover:text-teal-700">
          {history('askAgain')}
        </Link>
      </div>

      {loading ? (
        <Empty text={common('loading')} bare />
      ) : readings.length === 0 ? (
        <Empty text={history('empty')} bare />
      ) : (
        <ul className="space-y-3">
          {readings.map((r) => {
            const expanded = expandedId === r.id
            return (
              <Card key={r.id} asChild className="animate-fade-up overflow-hidden">
                <li>
                  <Button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : r.id)}
                    variant="ghost"
                    className="h-auto w-full items-start justify-between gap-3 rounded-none p-5 text-left hover:bg-stone-50"
                  >
                    <div className="min-w-0">
                      <div className="mb-1 flex items-center gap-2 text-xs text-stone-500">
                        <span className="rounded-full border border-stone-300 px-2 py-0.5">
                          {r.category}
                        </span>
                        <span>
                          {new Date(r.created_at).toLocaleDateString(locale, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <p className="truncate text-stone-700">{r.question}</p>
                    </div>
                    <span className="mt-1 shrink-0 text-stone-400">
                      {expanded ? history('collapse') : history('expand')}
                    </span>
                  </Button>

                  {expanded && (
                    <CardContent className="space-y-4 border-t border-stone-200 p-5">
                      <BaziChartCard chart={r.chart} />
                      <div className="whitespace-pre-wrap text-[15px] leading-7 text-stone-700">
                        {r.interpretation}
                      </div>
                      <Button
                        type="button"
                        onClick={() => remove(r.id)}
                        variant="link"
                        className="h-auto p-0 text-xs text-red-600/80 hover:text-red-600"
                      >
                        {history('remove')}
                      </Button>
                    </CardContent>
                  )}
                </li>
              </Card>
            )
          })}
        </ul>
      )}
    </main>
  )
}

function Empty({
  text,
  action,
  bare,
  backHome,
}: {
  text: string
  action?: React.ReactNode
  bare?: boolean
  backHome?: string
}) {
  const inner = (
    <div className="flex flex-col items-center py-16 text-center">
      <p className="text-stone-500">{text}</p>
      {action}
      {!bare && backHome && (
        <Link
          href="/"
          className="mt-4 text-sm text-stone-500 underline-offset-4 transition hover:text-teal-700 hover:underline"
        >
          {backHome}
        </Link>
      )}
    </div>
  )
  return bare ? inner : <main className="mx-auto max-w-2xl px-5 py-10">{inner}</main>
}
