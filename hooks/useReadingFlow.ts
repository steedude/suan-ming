'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import type { QuestionCategory } from '@/configs/questions'
import type { Gender } from '@/types/bazi'
import type { Locale } from '@/types/i18n'
import type { BirthFormState, ReadingStep } from '@/types/reading'
import { computeBazi } from '@/lib/bazi'
import { useInterpretationStream } from '@/hooks/useInterpretationStream'

const DEFAULT_BIRTH_FORM: BirthFormState = {
  date: '',
  time: '12:00',
  gender: 'female',
}

/** 管理首頁「問題 → 生辰 → 解讀」流程與 API 串流。 */
export function useReadingFlow() {
  const locale = useLocale() as Locale
  const home = useTranslations('home')
  const birthMessages = useTranslations('birth')
  const startInterpretation = useInterpretationStream()

  const [step, setStep] = useState<ReadingStep>('question')
  const [question, setQuestion] = useState('')
  const [category, setCategory] = useState<QuestionCategory>('綜合運勢')
  const [birthForm, setBirthForm] = useState(DEFAULT_BIRTH_FORM)
  const [chart, setChart] = useState<ReturnType<typeof computeBazi> | null>(null)
  const [interpretation, setInterpretation] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    if (!birthForm.date) {
      setError(birthMessages('errNoDate'))
      return
    }

    const birth = parseBirthForm(birthForm)
    const nextChart = computeBazi(birth)

    setError('')
    setChart(nextChart)
    setInterpretation('')
    setStreaming(true)
    setStep('result')

    const result = await startInterpretation({
      payload: { question, category, locale, ...birth },
      fallbackError: home('errUnknown'),
      networkError: home('errNetwork'),
      onChunk: (chunk) => setInterpretation((prev) => prev + chunk),
    })

    if (!result.ok) setError(result.error ?? home('errUnknown'))
    setStreaming(false)
  }

  function reset() {
    setStep('question')
    setQuestion('')
    setChart(null)
    setInterpretation('')
    setError('')
  }

  function updateBirthForm(next: Partial<BirthFormState>) {
    setBirthForm((prev) => ({ ...prev, ...next }))
  }

  const stepIndex: 0 | 1 | 2 = step === 'question' ? 0 : step === 'birth' ? 1 : 2

  return {
    step,
    stepIndex,
    question,
    category,
    birthForm,
    chart,
    interpretation,
    streaming,
    error,
    setStep,
    setQuestion,
    setCategory,
    setDate: (date: string) => updateBirthForm({ date }),
    setTime: (time: string) => updateBirthForm({ time }),
    setGender: (gender: Gender) => updateBirthForm({ gender }),
    submit,
    reset,
  }
}

function parseBirthForm({ date, time, gender }: BirthFormState) {
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  return { year, month, day, hour, minute, gender }
}
