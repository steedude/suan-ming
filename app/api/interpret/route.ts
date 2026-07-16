import type { BaziChart } from '@/types/bazi'
import { computeBazi } from '@/lib/bazi'
import { hasGeminiApiKey } from '@/lib/server/ai/gemini'
import { jsonError } from '@/lib/server/api-errors'
import { checkInterpretQuota } from '@/lib/server/interpret/quota'
import { getInterpretSession } from '@/lib/server/interpret/session'
import { createInterpretationResponse } from '@/lib/server/interpret/stream'
import {
  getClientIp,
  getRequestLocale,
  parseInterpretRequest,
} from '@/lib/server/request'

export const maxDuration = 60

export async function POST(request: Request): Promise<Response> {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return jsonError('BAD_REQUEST', 'zh-TW', 400)
  }

  const locale = getRequestLocale(raw)

  if (!hasGeminiApiKey()) {
    return jsonError('CONFIG_MISSING_GEMINI_API_KEY', locale, 500, {
      report: true,
      message: 'Missing GEMINI_API_KEY',
      context: { tags: { route: 'api.interpret' } },
    })
  }

  const body = parseInterpretRequest(raw)
  if (!body) return jsonError('BAD_REQUEST', locale, 400)

  const ip = getClientIp(request)
  let session
  try {
    session = await getInterpretSession()
    const quotaError = await checkInterpretQuota({ ip, locale, session })
    if (quotaError) return quotaError
  } catch (err) {
    return jsonError('INTERNAL_SERVER_ERROR', locale, 500, {
      report: true,
      cause: err,
      context: { tags: { route: 'api.interpret', phase: 'quota' } },
    })
  }

  let chart: BaziChart
  try {
    chart = computeBazi(body)
  } catch {
    return jsonError('BAD_REQUEST', locale, 400)
  }

  try {
    return await createInterpretationResponse({ body, chart, session })
  } catch (err) {
    return jsonError('AI_SERVICE_UNAVAILABLE', locale, 502, {
      report: true,
      cause: err,
      context: {
        tags: { route: 'api.interpret', phase: 'generate' },
        user: session.user ? { id: session.user.id } : undefined,
      },
    })
  }
}
