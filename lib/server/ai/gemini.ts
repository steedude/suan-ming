import type { BaziChart } from '@/types/bazi'
import type { InterpretRequest } from '@/lib/validation/interpret'
import { GoogleGenAI } from '@google/genai'
import { GEMINI_MODEL, GENERATION_CONFIG } from '@/configs/gemini'
import { env } from '@/env'
import { buildUserContent, SYSTEM_INSTRUCTION } from '@/lib/prompt'

export function hasGeminiApiKey(): boolean {
  return Boolean(env.GEMINI_API_KEY)
}

export async function generateReadingStream(body: InterpretRequest, chart: BaziChart) {
  const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY! })

  return ai.models.generateContentStream({
    model: GEMINI_MODEL,
    contents: buildUserContent(
      body.question,
      body.category,
      body.gender,
      chart,
      body.locale,
    ),
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      ...GENERATION_CONFIG,
    },
  })
}
