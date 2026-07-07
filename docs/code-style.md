# 程式碼規則

這份專案的目標是「可讀、可改、可測」。規則不是為了好看而已，而是讓未來加西洋星盤、八字、紫微、金流、會員方案時，不會變成一鍋神秘湯。

## 工具分工

- ESLint：抓錯、React/Next.js 慣例、TypeScript 可讀性。
- Prettier：統一格式，包含 TypeScript、CSS、JSON、Markdown。
- TypeScript：所有商業邏輯與 API 邊界都要有型別。
- Vitest + React Testing Library：純函式與元件行為測試。
- Playwright：端對端測試，特別適合 Next.js App Router / Server Component 的完整流程。
- Zod：API request body、表單資料與外部輸入的 schema 驗證。
- React Hook Form：複雜表單狀態；搭配 `@hookform/resolvers` 可直接接 Zod schema。

## Next.js 主流選型

本專案刻意使用 React/Next.js 生態常見套件，避免 Vue/Nuxt 專用依賴混入：

| 需求          | 採用                       | 原因                                               |
| ------------- | -------------------------- | -------------------------------------------------- |
| i18n          | `next-intl`                | App Router 常見選擇，支援 Server/Client Components |
| UI 基礎       | `shadcn/ui` + Radix        | Next/React 生態熱門組合，可讀性高、可客製          |
| 表單          | `react-hook-form`          | React 主流表單狀態管理                             |
| 驗證          | `zod`                      | API 與表單 schema 可共用                           |
| 單元/元件測試 | `vitest` + Testing Library | Next 官方文件列出的測試方案之一，速度快            |
| E2E           | `playwright`               | Next 官方文件列出的 E2E 方案                       |
| CSS           | Tailwind CSS v4            | Next + shadcn/ui 常見搭配                          |

注意：`@vitejs/plugin-react` 是 Vitest 測 React 元件時需要的測試工具，不代表專案使用 Vite 當 app bundler；正式開發與 build 仍是 `next dev` / `next build`。

常用指令：

```bash
pnpm lint
pnpm lint:fix
pnpm format
pnpm typecheck
pnpm test:run
pnpm test:e2e
pnpm check
```

## 資料夾規則

```txt
app/          Next.js App Router；只放路由、layout、route handler
components/   跨頁共用元件
components/ui shadcn/ui 元件，盡量維持原始結構，避免塞商業邏輯
configs/      穩定設定、常數、白名單
docs/         專案規範與產品/技術決策
hooks/        Client hooks；名稱使用 useXxx
i18n/         next-intl request 設定
lib/          核心商業邏輯、第三方服務封裝
lib/server/   只能在伺服器使用的 API helper、AI、限流、資料庫流程
locales/      翻譯訊息來源
tests/        單元測試與測試 setup
types/        跨模組共用型別
utils/        無副作用小工具函式
```

## 命名與拆分

- React 元件使用 PascalCase，例如 `BirthStep.tsx`。
- Hook 使用 `useXxx.ts` 或 `useXxx.tsx`。
- 純函式放 `lib/` 或 `utils/`，避免依賴 React 狀態。
- API route 不直接塞大量邏輯；驗證、排盤、提示詞、資料庫存取要拆到 `lib/`、`configs/` 或 `utils/`。
- `components/ui/*` 是基礎 UI；產品語意元件放 `components/`。

## i18n 規則

- 使用 `next-intl` 管理 provider、locale 與 messages。
- 翻譯內容集中在 `locales/`。
- 新增 UI 文案時，先補 `zh-TW`，再補 `en`，並讓 TypeScript 檢查鍵值一致。
- API 回傳錯誤也要依 `locale` 回覆，不把 UI 文案寫死在元件裡。

## Server / Client 邊界

- 預設使用 Server Component；需要 state、effect、瀏覽器 API、Supabase browser client 時才加 `'use client'`。
- App Router 的 `app/page.tsx` 保持 Server Component；互動流程放在 `components/ReadingWizard.tsx`。
- AI key、Supabase server client、額度檢查只放 server。
- 前端可以即時排盤提升體感，但 server 必須重新計算一次，不信任前端傳入命盤。

## 環境變數與限流

- 所有環境變數由 [`env.ts`](../env.ts) 以 Zod 驗證。
- 本機開發可不設定 Upstash,會退回記憶體限流。
- 正式 serverless 部署建議設定 `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`,避免多實例造成限流不準。
- Supabase 型別集中在 `types/database.ts`,client/server 都要帶入 `Database` generic。

## 測試策略

- 排盤、日期、文字解析、class 合併等純函式一定優先測。
- 元件測試聚焦使用者可見行為，不測 implementation detail。
- 多頁流程、登入、API 串流、Server Component 互動用 Playwright 測。
- API route 若之後接金流或扣額度，需要補錯誤路徑測試。

第一次在本機跑 E2E 前需要安裝瀏覽器：

```bash
pnpm playwright:install
pnpm test:e2e
```
