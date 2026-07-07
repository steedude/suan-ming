import { env } from '@/env'

/**
 * Gemini 模型設定(僅伺服器端使用)
 */

/** 使用的模型,可由環境變數覆寫 */
export const GEMINI_MODEL = env.GEMINI_MODEL

/**
 * 生成參數
 * - thinkingBudget 0:解讀不需推理鏈,關閉思考省 token 與延遲
 * - maxOutputTokens:輸出上限,控制成本
 */
export const GENERATION_CONFIG = {
  thinkingConfig: { thinkingBudget: 0 },
  maxOutputTokens: 2048,
  temperature: 0.9,
} as const
