'use client'

import type { QuestionCategory } from '@/configs/questions'
import type { BaziChart, Gender } from '@/types/bazi'
import type { Locale } from '@/types/i18n'
import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import BaziChartCard from '@/components/BaziChartCard'
import BirthStep from '@/components/BirthStep'
import InterpretationCard from '@/components/InterpretationCard'
import QuestionStep from '@/components/QuestionStep'
import StepIndicator from '@/components/StepIndicator'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useUser } from '@/hooks/useUser'
import { computeBazi } from '@/lib/bazi'
import { isSupabaseConfigured } from '@/lib/supabase/client'

/**
 * 主頁面:三步驟流程的狀態編排
 *
 * 1. 問題  → 2. 生辰 → 3. 結果
 *
 * 送出時命盤先在瀏覽器端排出、立即顯示(lib/bazi.ts 為純函式,前後端共用),
 * AI 解讀則由 /api/interpret 以串流回傳,邊生成邊渲染。
 */

type Step = 'question' | 'birth' | 'result'

export default function ReadingWizard() {
  const { user } = useUser()
  const locale = useLocale() as Locale
  const home = useTranslations('home')
  const birthMessages = useTranslations('birth')

  // 流程與表單狀態
  const [step, setStep] = useState<Step>('question')
  const [question, setQuestion] = useState('')
  const [category, setCategory] = useState<QuestionCategory>('綜合運勢')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('12:00')
  const [gender, setGender] = useState<Gender>('female')

  // 結果狀態
  const [chart, setChart] = useState<BaziChart | null>(null)
  const [interpretation, setInterpretation] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    if (!date) {
      setError(birthMessages('errNoDate'))
      return
    }
    setError('')

    const [year, month, day] = date.split('-').map(Number)
    const [hour, minute] = time.split(':').map(Number)
    const birth = { year, month, day, hour, minute, gender }

    // 命盤在本機立即排出,不必等 AI
    setChart(computeBazi(birth))
    setInterpretation('')
    setStreaming(true)
    setStep('result')

    try {
      const res = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, category, locale, ...birth }),
      })

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null)
        setError(data?.message ?? data?.error ?? home('errUnknown'))
        return
      }

      // 逐塊讀取串流文字
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        setInterpretation((prev) => prev + decoder.decode(value, { stream: true }))
      }
    } catch {
      setError(home('errNetwork'))
    } finally {
      setStreaming(false)
    }
  }

  function reset() {
    setStep('question')
    setQuestion('')
    setChart(null)
    setInterpretation('')
    setError('')
  }

  const stepIndex = step === 'question' ? 0 : step === 'birth' ? 1 : 2

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-2xl px-5 py-12 sm:py-16">
        <header className="mb-8 text-center">
          <h1 className="font-display text-4xl font-semibold tracking-[0.3em] text-stone-800 sm:text-5xl">
            問 命
          </h1>
          <div className="mx-auto mt-4 flex items-center justify-center gap-3 text-teal-700/70">
            <span className="h-px w-12 bg-gradient-to-r from-transparent to-teal-700/50" />
            <span className="text-xs">✦</span>
            <span className="h-px w-12 bg-gradient-to-l from-transparent to-teal-700/50" />
          </div>
          <p className="mt-4 text-sm text-stone-500">{home('tagline')}</p>
        </header>

        <StepIndicator current={stepIndex} />

        {step === 'question' && (
          <QuestionStep
            question={question}
            category={category}
            onQuestionChange={setQuestion}
            onCategoryChange={setCategory}
            onNext={() => setStep('birth')}
          />
        )}

        {step === 'birth' && (
          <BirthStep
            date={date}
            time={time}
            gender={gender}
            error={error}
            loading={streaming}
            onDateChange={setDate}
            onTimeChange={setTime}
            onGenderChange={setGender}
            onBack={() => setStep('question')}
            onSubmit={submit}
          />
        )}

        {step === 'result' && chart && (
          <div className="space-y-6">
            <BaziChartCard chart={chart} />
            <InterpretationCard
              text={interpretation}
              streaming={streaming}
              error={error}
            />

            {/* 訪客轉會員的引導(變現流程的第一步) */}
            {!streaming && isSupabaseConfigured && !user && (
              <Card className="animate-fade-up flex flex-col items-center gap-3 border-teal-200 bg-gradient-to-b from-teal-50 to-transparent p-5 text-center sm:flex-row sm:justify-between sm:text-left">
                <p className="text-sm text-stone-600">{home('bannerText')}</p>
                <Button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('open-auth'))}
                  variant="brand"
                  className="shrink-0"
                >
                  {home('bannerCta')}
                </Button>
              </Card>
            )}

            {!streaming && (
              <Button
                type="button"
                onClick={reset}
                variant="outline"
                className="w-full border-stone-300 text-stone-500 hover:text-stone-700"
              >
                {home('askAgain')}
              </Button>
            )}
          </div>
        )}

        <footer className="mt-12 text-center text-xs text-stone-400">
          {home('footerLine1')}
          <br />
          {home('footerLine2')}
        </footer>
      </div>
    </main>
  )
}
