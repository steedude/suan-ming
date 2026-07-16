import type { BaziChart } from '@/types/bazi'
import type { InterpretRequest } from '@/lib/validation/interpret'
import { generateReadingStream } from '@/lib/server/ai/gemini'
import { reportServerError } from '@/lib/server/api-errors'
import { saveReading } from '@/lib/server/readings'
import type { InterpretSession } from '@/lib/server/interpret/session'

interface CreateInterpretationResponseInput {
  body: InterpretRequest
  chart: BaziChart
  session: InterpretSession
}

/**
 * 把 Gemini 的 async stream 轉成 HTTP ReadableStream。
 * 串流完成後才儲存會員紀錄，避免把半截內容寫進資料庫。
 */
export async function createInterpretationResponse({
  body,
  chart,
  session,
}: CreateInterpretationResponseInput): Promise<Response> {
  const stream = await generateReadingStream(body, chart)
  const encoder = new TextEncoder()

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      let fullText = ''
      try {
        for await (const chunk of stream) {
          if (chunk.text) {
            fullText += chunk.text
            controller.enqueue(encoder.encode(chunk.text))
          }
        }

        if (session.supabase && session.user && fullText) {
          await saveReading(session.supabase, session.user, body, chart, fullText)
        }

        controller.close()
      } catch (err) {
        reportServerError('AI_STREAM_FAILED', {
          cause: err,
          context: {
            tags: { route: 'api.interpret', phase: 'stream' },
            user: session.user ? { id: session.user.id } : undefined,
          },
        })
        controller.error(err)
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
