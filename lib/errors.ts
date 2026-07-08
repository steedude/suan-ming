import type { Locale } from '@/types/i18n'
import { ANON_DAILY_LIMIT, MEMBER_DAILY_LIMIT } from '@/configs/quota'

export const ERROR_MESSAGES = {
  BAD_REQUEST: {
    'zh-TW': '請確認問題與出生時間都已正確填寫。',
    en: 'Please check that the question and birth time are filled in correctly.',
  },
  CONFIG_MISSING_GEMINI_API_KEY: {
    'zh-TW': '伺服器尚未設定 GEMINI_API_KEY，請參考 README 完成設定。',
    en: 'GEMINI_API_KEY is not configured on the server. See README.',
  },
  RATE_LIMITED: {
    'zh-TW': '請稍微放慢一點，等一下再重新送出。',
    en: 'Too many requests. Please wait a moment and try again.',
  },
  MEMBER_QUOTA_EXCEEDED: {
    'zh-TW': `今日 ${MEMBER_DAILY_LIMIT} 次解讀額度已用完，明天再來吧。`,
    en: `You've used all ${MEMBER_DAILY_LIMIT} readings for today. Come back tomorrow.`,
  },
  ANON_QUOTA_EXCEEDED: {
    'zh-TW': `訪客每日可免費解讀 ${ANON_DAILY_LIMIT} 次，登入會員可提高至每日 ${MEMBER_DAILY_LIMIT} 次。`,
    en: `Guests get ${ANON_DAILY_LIMIT} free readings per day. Sign in to raise it to ${MEMBER_DAILY_LIMIT}.`,
  },
  AI_SERVICE_UNAVAILABLE: {
    'zh-TW': 'AI 解讀服務暫時無法使用，請稍後再試。',
    en: 'The AI reading service is temporarily unavailable. Please try again later.',
  },
  AI_STREAM_FAILED: {
    'zh-TW': 'AI 解讀傳輸中斷，請稍後再試。',
    en: 'The AI reading stream was interrupted. Please try again later.',
  },
  READING_SAVE_FAILED: {
    'zh-TW': '解讀已產生，但儲存紀錄失敗。',
    en: 'The reading was generated, but saving it failed.',
  },
  INTERNAL_SERVER_ERROR: {
    'zh-TW': '伺服器發生未知錯誤，請稍後再試。',
    en: 'An unexpected server error occurred. Please try again later.',
  },
} satisfies Record<string, Record<Locale, string>>

export type AppErrorCode = keyof typeof ERROR_MESSAGES

export interface ApiErrorBody {
  code: AppErrorCode
  message: string
  /** @deprecated Use `message`; kept to avoid breaking older client code. */
  error: string
}

export function getErrorMessage(code: AppErrorCode, locale: Locale): string {
  return ERROR_MESSAGES[code][locale]
}
