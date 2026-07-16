'use client'

import { useTranslations } from 'next-intl'
import BaziChartCard from '@/components/BaziChartCard'
import BirthStep from '@/components/BirthStep'
import InterpretationCard from '@/components/InterpretationCard'
import QuestionStep from '@/components/QuestionStep'
import StepIndicator from '@/components/StepIndicator'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useReadingFlow } from '@/hooks/useReadingFlow'
import { useUser } from '@/hooks/useUser'
import { isSupabaseConfigured } from '@/lib/supabase/client'

/** 首頁流程容器：只負責把三個步驟與結果區塊組起來。 */
export default function ReadingWizard() {
  const { user } = useUser()
  const home = useTranslations('home')
  const flow = useReadingFlow()

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-2xl px-5 py-12 sm:py-16">
        <header className="mb-8 text-center">
          <h1 className="font-display text-4xl font-semibold tracking-[0.3em] text-stone-800 sm:text-5xl">
            指 南
          </h1>
          <div className="mx-auto mt-4 flex items-center justify-center gap-3 text-teal-700/70">
            <span className="h-px w-12 bg-gradient-to-r from-transparent to-teal-700/50" />
            <span className="text-xs">✦</span>
            <span className="h-px w-12 bg-gradient-to-l from-transparent to-teal-700/50" />
          </div>
          <p className="mt-4 text-sm text-stone-500">{home('tagline')}</p>
        </header>

        <StepIndicator current={flow.stepIndex} />

        {flow.step === 'question' && (
          <QuestionStep
            question={flow.question}
            category={flow.category}
            onQuestionChange={flow.setQuestion}
            onCategoryChange={flow.setCategory}
            onNext={() => flow.setStep('birth')}
          />
        )}

        {flow.step === 'birth' && (
          <BirthStep
            date={flow.birthForm.date}
            time={flow.birthForm.time}
            gender={flow.birthForm.gender}
            error={flow.error}
            loading={flow.streaming}
            onDateChange={flow.setDate}
            onTimeChange={flow.setTime}
            onGenderChange={flow.setGender}
            onBack={() => flow.setStep('question')}
            onSubmit={flow.submit}
          />
        )}

        {flow.step === 'result' && flow.chart && (
          <div className="space-y-6">
            <BaziChartCard chart={flow.chart} />
            <InterpretationCard
              text={flow.interpretation}
              streaming={flow.streaming}
              error={flow.error}
            />

            {!flow.streaming && isSupabaseConfigured && !user && (
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

            {!flow.streaming && (
              <Button
                type="button"
                onClick={flow.reset}
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
