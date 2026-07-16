# 指南 Architecture

`指南` 是一個 AI 八字決策指引產品。核心設計是「程式負責排盤，AI 負責解讀」：命盤資料由 `lunar-typescript` 依出生資料確定性計算，再把結構化命盤與使用者問題交給 Gemini 生成文字解讀。

## 系統流程

```txt
使用者輸入問題
  ↓
QuestionStep
  ↓
使用者輸入出生日期、時間、性別
  ↓
BirthStep
  ↓
useReadingFlow
  ├─ 前端 computeBazi()：立即顯示命盤
  └─ useInterpretationStream：POST /api/interpret
       ↓
       Route Handler 驗證 request
       ↓
       Upstash Redis / memory fallback 限流
       ↓
       Supabase 會員與每日額度檢查
       ↓
       後端 computeBazi()：產生可信任命盤
       ↓
       Gemini generateContentStream()
       ↓
       HTTP ReadableStream 回前端
       ↓
       會員解讀完成後寫入 Supabase readings
```

## 前端分層

| 位置                                | 職責                                     |
| ----------------------------------- | ---------------------------------------- |
| `app/page.tsx`                      | 首頁 route，渲染 `ReadingWizard`         |
| `components/ReadingWizard.tsx`      | 純畫面組合，根據目前步驟渲染子元件       |
| `hooks/useReadingFlow.ts`           | 管理三步驟流程、表單狀態、命盤與解讀狀態 |
| `hooks/useInterpretationStream.ts`  | 呼叫 AI API，讀取文字串流                |
| `components/QuestionStep.tsx`       | 問題分類與問題輸入                       |
| `components/BirthStep.tsx`          | 出生日期、時間、性別輸入                 |
| `components/BaziChartCard.tsx`      | 命盤視覺化                               |
| `components/InterpretationCard.tsx` | AI 解讀文字、複製內容、錯誤訊息          |
| `components/ui/*`                   | shadcn/ui 風格基礎元件                   |

## 後端分層

| 位置                              | 職責                                            |
| --------------------------------- | ----------------------------------------------- |
| `app/api/interpret/route.ts`      | API 流程入口，負責串接各 helper                 |
| `lib/server/interpret/session.ts` | 取得 Supabase session，未設定時視為訪客         |
| `lib/server/interpret/quota.ts`   | 每分鐘限流、訪客每日額度、會員每日額度          |
| `lib/server/interpret/stream.ts`  | Gemini stream → HTTP stream，完成後儲存會員紀錄 |
| `lib/server/rate-limit.ts`        | Upstash Redis / memory fallback 限流            |
| `lib/server/readings.ts`          | 查詢會員今日用量與儲存 readings                 |
| `lib/server/ai/gemini.ts`         | Google Gemini SDK 呼叫                          |
| `lib/server/api-errors.ts`        | API error response 與 Sentry 上報               |
| `lib/server/request.ts`           | locale、request body、client IP 解析            |

## Domain types

主要型別放在：

- `types/bazi.ts`：八字命盤、四柱、大運、出生資料
- `types/reading.ts`：產品流程、問題、出生表單、API payload
- `types/i18n.ts`：支援語系與字典型別

這樣做的目標是讓 UI state、API payload、命盤資料各自有清楚語意，不用靠一堆散落的 primitive 參數理解流程。

## AI 與 token 策略

相關檔案：

- `lib/prompt.ts`
- `configs/gemini.ts`
- `lib/server/ai/gemini.ts`

策略：

1. 固定規則放在 `SYSTEM_INSTRUCTION`，每次請求保持一致。
2. 命盤由 `buildUserContent()` 序列化為緊湊格式。
3. AI 只接收「已算好的命盤」，不重新排盤。
4. `thinkingBudget: 0` 與 `maxOutputTokens` 控制成本與輸出長度。

## 限流與額度

相關檔案：

- `lib/server/rate-limit.ts`
- `lib/server/interpret/quota.ts`
- `configs/quota.ts`

機制：

- 每 IP 每分鐘限流：`Ratelimit.slidingWindow(PER_MINUTE_LIMIT, '1 m')`
- 訪客每日限流：`Ratelimit.fixedWindow(ANON_DAILY_LIMIT, '1 d')`
- 會員每日限流：查 Supabase `readings` 今天的筆數

Redis key prefix：

```txt
zhi-nan:minute
zhi-nan:anon-day
```

如果沒有設定 Upstash，會退回本機記憶體 `Map`，方便本機開發。

## 會員、資料與隱私

相關檔案：

- `lib/supabase/client.ts`
- `lib/supabase/server.ts`
- `lib/server/readings.ts`
- `app/history/page.tsx`
- `supabase/schema.sql`

訪客資料不儲存。會員登入後，解讀完成才會寫入 `readings`。資料存取由 Supabase RLS 控制，每個使用者只能讀寫自己的紀錄。

## 錯誤處理與監控

相關檔案：

- `lib/errors.ts`
- `lib/server/api-errors.ts`
- `app/error.tsx`
- `app/global-error.tsx`
- `instrumentation.ts`
- `instrumentation-client.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`

API 錯誤統一回傳：

```json
{
  "code": "RATE_LIMITED",
  "message": "請稍微放慢一點，等一下再重新送出。",
  "error": "請稍微放慢一點，等一下再重新送出。"
}
```

會送 Sentry：

- Gemini API 失敗
- Gemini stream 中斷
- Supabase 查額度/儲存失敗
- React render error

不送 Sentry：

- 使用者輸入錯
- 每分鐘限流
- 訪客/會員額度用完
- 剪貼簿權限失敗

## SEO 與分享

相關檔案：

- `configs/site.ts`
- `app/layout.tsx`
- `app/sitemap.ts`
- `app/robots.ts`
- `app/opengraph-image.tsx`
- `app/twitter-image.tsx`
- `app/manifest.ts`

`NEXT_PUBLIC_SITE_URL` 會影響：

- canonical URL
- Open Graph URL
- sitemap URL
- robots 裡的 sitemap 位置
- OG image 文字上的網域

## 測試

| 測試                     | 用途                         |
| ------------------------ | ---------------------------- |
| `tests/bazi.test.ts`     | 驗證排盤資料基本存在與格式   |
| `tests/utils.test.ts`    | 驗證工具函式                 |
| `tests/e2e/home.spec.ts` | 驗證使用者能走完主要首頁流程 |

常用指令：

```bash
pnpm lint
pnpm typecheck
pnpm test:run
pnpm build
pnpm test:e2e
```

## 設計取捨

- 前後端都呼叫 `computeBazi()`：前端為了即時體驗，後端為了可信任資料。
- AI 使用 stream：讓使用者看到文字逐段出現，降低等待感。
- 訪客每日額度用 Redis：不需要會員也能控制成本。
- 會員每日額度用 Supabase：以實際儲存紀錄為準，跨裝置一致。
- error code 集中管理：前端顯示、API response、Sentry tag 都能對齊。
