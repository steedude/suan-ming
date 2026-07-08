import type { Locale } from '@/types/i18n'
import * as Sentry from '@sentry/nextjs'
import { type ApiErrorBody, type AppErrorCode, getErrorMessage } from '@/lib/errors'

interface ReportOptions {
  cause?: unknown
  context?: {
    tags?: Record<string, unknown>
    extra?: Record<string, unknown>
    user?: { id?: string; email?: string; username?: string }
  }
  message?: string
}

interface JsonErrorOptions extends ReportOptions {
  report?: boolean
}

export function reportServerError(code: AppErrorCode, options: ReportOptions = {}) {
  Sentry.withScope((scope) => {
    scope.setTag('error_code', code)

    if (options.context?.tags) {
      for (const [key, value] of Object.entries(options.context.tags)) {
        scope.setTag(key, String(value))
      }
    }

    if (options.context?.extra) {
      for (const [key, value] of Object.entries(options.context.extra)) {
        scope.setExtra(key, value)
      }
    }

    if (options.context?.user) scope.setUser(options.context.user)

    if (options.cause instanceof Error) {
      Sentry.captureException(options.cause)
      return
    }

    Sentry.captureMessage(options.message ?? code, 'error')
  })
}

export function jsonError(
  code: AppErrorCode,
  locale: Locale,
  status: number,
  options: JsonErrorOptions = {},
): Response {
  if (options.report) reportServerError(code, options)

  const message = getErrorMessage(code, locale)
  const body: ApiErrorBody = {
    code,
    message,
    error: message,
  }

  return Response.json(body, { status })
}
