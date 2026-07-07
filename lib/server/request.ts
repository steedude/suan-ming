import type { Locale } from '@/types/i18n'
import { isLocale } from '@/locales'
import { interpretRequestSchema, type InterpretRequest } from '@/lib/validation/interpret'

export function getRequestLocale(raw: unknown): Locale {
  return isLocale((raw as Record<string, unknown>)?.locale)
    ? ((raw as Record<string, unknown>).locale as Locale)
    : 'zh-TW'
}

export function parseInterpretRequest(body: unknown): InterpretRequest | null {
  const result = interpretRequestSchema.safeParse(body)
  return result.success ? result.data : null
}

export function getClientIp(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local'
}
