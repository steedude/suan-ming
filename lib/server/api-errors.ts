import type { Locale } from '@/types/i18n'
import { ANON_DAILY_LIMIT, MEMBER_DAILY_LIMIT } from '@/configs/quota'

export const API_MESSAGES = {
  noApiKey: {
    'zh-TW': '伺服器尚未設定 GEMINI_API_KEY,請參考 README 完成設定。',
    en: 'GEMINI_API_KEY is not configured on the server. See README.',
  },
  tooFrequent: {
    'zh-TW': '請求太頻繁了,請稍候一分鐘再試。',
    en: 'Too many requests. Please wait a minute and try again.',
  },
  badRequest: {
    'zh-TW': '請確認問題與出生時間都已正確填寫。',
    en: 'Please check that the question and birth time are filled in correctly.',
  },
  memberQuota: {
    'zh-TW': `今日 ${MEMBER_DAILY_LIMIT} 次解讀額度已用完,明天再來吧。`,
    en: `You've used all ${MEMBER_DAILY_LIMIT} readings for today. Come back tomorrow.`,
  },
  anonQuota: {
    'zh-TW': `訪客每日可免費解讀 ${ANON_DAILY_LIMIT} 次,登入會員可提高至每日 ${MEMBER_DAILY_LIMIT} 次。`,
    en: `Guests get ${ANON_DAILY_LIMIT} free readings per day. Sign in to raise it to ${MEMBER_DAILY_LIMIT}.`,
  },
  aiUnavailable: {
    'zh-TW': 'AI 解讀服務暫時無法使用,請稍後再試。',
    en: 'The AI reading service is temporarily unavailable. Please try again later.',
  },
} satisfies Record<string, Record<Locale, string>>

export type ApiMessageKey = keyof typeof API_MESSAGES

export function jsonError(key: ApiMessageKey, locale: Locale, status: number): Response {
  return Response.json({ error: API_MESSAGES[key][locale] }, { status })
}
