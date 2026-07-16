'use client'

import { useCallback } from 'react'
import type { ApiErrorBody } from '@/lib/errors'
import type { InterpretPayload } from '@/types/reading'

interface StartInterpretationOptions {
  payload: InterpretPayload
  onChunk: (chunk: string) => void
  fallbackError: string
  networkError: string
}

interface StreamResult {
  ok: boolean
  error?: string
}

/** 呼叫 AI 解讀 API，並把文字串流逐塊交給呼叫端 append。 */
export function useInterpretationStream() {
  return useCallback(
    async ({
      payload,
      onChunk,
      fallbackError,
      networkError,
    }: StartInterpretationOptions): Promise<StreamResult> => {
      try {
        const res = await fetch('/api/interpret', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!res.ok || !res.body) {
          const data = await readApiError(res)
          return { ok: false, error: data?.message ?? data?.error ?? fallbackError }
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()

        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          onChunk(decoder.decode(value, { stream: true }))
        }

        return { ok: true }
      } catch {
        return { ok: false, error: networkError }
      }
    },
    [],
  )
}

async function readApiError(res: Response): Promise<ApiErrorBody | null> {
  try {
    return (await res.json()) as ApiErrorBody
  } catch {
    return null
  }
}
