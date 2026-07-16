import type { QuestionCategory } from '@/configs/questions'
import type { BaziChart, BirthInput, Gender } from '@/types/bazi'
import type { Locale } from '@/types/i18n'

/** 首頁三步驟流程。 */
export type ReadingStep = 'question' | 'birth' | 'result'

/** 使用者在第一步輸入的問題資訊。 */
export interface ReadingQuestion {
  question: string
  category: QuestionCategory
}

/** 表單層使用字串保存日期/時間，方便直接餵給 UI control。 */
export interface BirthFormState {
  date: string
  time: string
  gender: Gender
}

/** API 需要的完整解讀請求。 */
export type InterpretPayload = ReadingQuestion & BirthInput & { locale: Locale }

/** 前端 result step 需要呈現的狀態。 */
export interface ReadingResultState {
  chart: BaziChart | null
  interpretation: string
  streaming: boolean
  error: string
}
