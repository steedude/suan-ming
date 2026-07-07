# 問命|AI 八字解讀網站

給人生困惑的人一點方向。使用者先寫下自己的問題,再輸入生辰,網站立即排出八字命盤,並由 AI 以串流方式生成溫暖、務實的解讀與建議。

## 功能特色

- **兩段式引導**:先寫困惑(附問題類別:綜合/事業/感情/財運/學業)、再填生辰,附步驟進度指示
- **即時排盤**:命盤在瀏覽器端毫秒級排出,不必等 AI —— 四柱、藏干、十神、五行分布(含缺行提示)、大運前六步
- **串流解讀**:AI 文字邊生成邊顯示(打字機效果),體感等待大幅縮短
- **五行視覺化**:四柱干支依五行上色,五行分布長條圖
- **會員系統**(Supabase):Email 註冊/登入、解讀紀錄自動保存、歷史頁回顧與刪除
- **免費增值(Freemium)基礎**:訪客每日 3 次、會員每日 10 次(皆可由環境變數調整),超額回應附升級引導
- **一鍵複製**:解讀結果可直接複製分享
- **成本保護**:每 IP 每分鐘限流、每日額度、輸出 token 上限、關閉模型思考鏈
- **隱私**:訪客資料零儲存;會員紀錄受 Supabase RLS 保護,僅本人可讀寫、可隨時刪除

## 核心設計:排盤用程式算,AI 只負責解讀

LLM 自己推算干支很容易出錯(節氣交界、時柱換日等)。本專案把兩件事徹底分開:

| 職責     | 由誰負責                                                        | 說明                                                  |
| -------- | --------------------------------------------------------------- | ----------------------------------------------------- |
| 排盤計算 | [`lunar-typescript`](https://github.com/6tail/lunar-typescript) | 依節氣精確計算四柱、藏干、十神、大運,結果確定且可重現 |
| 文字解讀 | Google Gemini                                                   | 只拿到「算好的」命盤,把資料翻譯成白話建議             |

`lib/bazi.ts` 為純函式、前後端共用:前端用它即時顯示命盤,伺服器用同一套重新排盤組提示詞(不信任前端傳來的資料)。

### Token 效率與穩定性設計(`lib/prompt.ts`)

1. **固定指令與變動資料分離**:角色設定與輸出規則放 `systemInstruction`,每次請求逐字相同,可命中 Gemini 隱式快取(implicit caching)
2. **緊湊序列化**:命盤以行式格式傳給模型(`年 乙亥|正官|藏 壬:偏財,甲:七殺`),token 約為敘述式寫法的一半
3. **關閉思考鏈**:`thinkingBudget: 0` —— 解讀任務不需要推理鏈,省 token 也降低延遲
4. **輸出上限**:`maxOutputTokens: 2048` + 提示詞中規定各段落字數,輸出長度穩定可控
5. **結構化輸出**:固定【你的命盤】【關於你的問題】【給你的方向】【結語】四段,方便前端呈現與日後解析

## 技術架構

```
使用者:問題 + 類別 + 生辰
        │
        ▼
app/page.tsx ──── lib/bazi.ts ──▶ 命盤立即顯示(瀏覽器端排盤)
        │
        │  POST /api/interpret(串流)
        ▼
app/api/interpret/route.ts
  ├─ 輸入驗證 + IP 限流
  ├─ lib/bazi.ts      伺服器端重新排盤(不信任前端資料)
  ├─ lib/prompt.ts    systemInstruction + 緊湊命盤序列化
  └─ @google/genai    generateContentStream
        │
        ▼
ReadableStream ──▶ 前端逐塊渲染(打字機效果)
```

| 項目   | 選擇                                                      |
| ------ | --------------------------------------------------------- |
| 框架   | Next.js(App Router)+ TypeScript + Tailwind CSS            |
| 排盤   | lunar-typescript(節氣、干支、十神、大運),含簡轉繁處理     |
| AI     | Google Gemini(預設 `gemini-2.5-flash`,可透過環境變數更換) |
| 資料庫 | 無 —— 不儲存任何使用者資料                                |

## 快速開始

```bash
# 1. 安裝依賴
pnpm install

# 2. 設定 API Key(到 https://aistudio.google.com/apikey 免費申請)
cp .env.example .env.local
#    編輯 .env.local,填入 GEMINI_API_KEY=你的金鑰

# 3. 啟動
pnpm dev
```

打開 [http://localhost:3000](http://localhost:3000) 即可使用。

## 環境變數

| 變數                                   | 必填 | 說明                                 |
| -------------------------------------- | ---- | ------------------------------------ |
| `GEMINI_API_KEY`                       | ✅   | Google AI Studio 申請的 API Key      |
| `GEMINI_MODEL`                         | ❌   | 使用的模型,預設 `gemini-2.5-flash`   |
| `NEXT_PUBLIC_SUPABASE_URL`             | ❌   | Supabase 專案網址(會員功能用)        |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ❌   | Supabase publishable key(會員功能用) |
| `ANON_DAILY_LIMIT`                     | ❌   | 訪客每日解讀次數,預設 3              |
| `MEMBER_DAILY_LIMIT`                   | ❌   | 會員每日解讀次數,預設 10             |
| `PER_MINUTE_LIMIT`                     | ❌   | 每 IP 每分鐘請求上限,預設 6          |
| `UPSTASH_REDIS_REST_URL`               | ❌   | Upstash Redis REST URL,正式限流用    |
| `UPSTASH_REDIS_REST_TOKEN`             | ❌   | Upstash Redis REST Token             |

環境變數會由 [`env.ts`](env.ts) 以 Zod 驗證。未設定 Upstash 時會退回記憶體限流,方便本機開發;正式部署到 Vercel/serverless 多實例時建議設定 Upstash,避免免費額度被多實例放大。

## 會員系統設定(選用)

會員功能為選配:**兩個 `NEXT_PUBLIC_SUPABASE_*` 變數都設定後自動啟用**,未設定時網站照常運作(隱藏登入與紀錄功能)。

1. 到 [supabase.com](https://supabase.com) 建立專案(免費方案即可)
2. Dashboard → **SQL Editor** → 貼上執行 [`supabase/schema.sql`](supabase/schema.sql)(建立 `readings` 資料表與 RLS 政策)
3. Dashboard → **Project Settings → API** 取得 Project URL 與 publishable key,填入 `.env.local`
4. 重啟 `pnpm dev`

安全設計:全程只使用 publishable key(可公開),資料存取由 Row Level Security 保證「每個人只能讀寫自己的紀錄」;伺服器端不需要 service role key。

### 額度與變現設計

| 身分     | 每日額度                     | 紀錄保存            |
| -------- | ---------------------------- | ------------------- |
| 訪客     | 3 次(記憶體計數/IP)          | 不保存              |
| 免費會員 | 10 次(資料表計數,跨實例準確) | 自動保存,歷史頁回顧 |

超額時回傳 429 並附升級引導文案;解讀完成後的「免費註冊」橫幅是訪客轉會員的主要入口。之後要接金流(付費會員無限次數、進階解讀)時,只需在額度檢查處加上方案判斷。

## 部署(Vercel)

1. 推上 GitHub → Vercel 匯入 repo
2. Environment Variables 加入 `GEMINI_API_KEY`
3. 部署完成

> API route 已設定 `maxDuration = 60` 避免生成超時;記憶體限流在 serverless 多實例下為盡力而為,正式產品建議改用 Upstash/Redis。

## 專案結構

```
app/
  page.tsx                  Server Component 入口
  layout.tsx                全站佈局(含 Header)與 metadata
  globals.css               主題色、進場動畫、串流游標
  history/page.tsx          我的紀錄(會員歷史解讀,展開回顧/刪除)
  api/interpret/route.ts    解讀 API:驗證 → 額度 → 排盤 → Gemini 串流 → 保存
components/
  ReadingWizard.tsx         三步驟流程的 Client Component 狀態編排
  Header.tsx                全站頁首(品牌 + 登入/登出/我的紀錄)
  AuthDialog.tsx            登入/註冊對話框
  StepIndicator.tsx         步驟進度指示
  QuestionStep.tsx          問題輸入 + 類別選擇
  BirthStep.tsx             生辰輸入
  BaziChartCard.tsx         命盤卡片(四柱/藏干/五行條/大運)
  InterpretationCard.tsx    串流解讀 + 複製
lib/
  bazi.ts                   八字排盤(確定性、純函式、前後端共用)
  prompt.ts                 systemInstruction + 緊湊命盤序列化
  server/
    ai/gemini.ts            Gemini 串流呼叫
    api-errors.ts           API 錯誤訊息
    rate-limit.ts           Upstash Redis / 記憶體限流
    readings.ts             readings 額度與保存
    request.ts              request 解析與 locale/ip helper
  supabase/
    client.ts               瀏覽器端 client(含 isSupabaseConfigured)
    server.ts               伺服器端 client(cookie 綁定,RLS 保護)
    useUser.ts              登入狀態 hook
supabase/
  schema.sql                readings 資料表 + RLS 政策
types/
  database.ts               Supabase Database 型別
proxy.ts                    Supabase session 刷新(Next.js 16 middleware 慣例)
.env.example                環境變數範例
```

## 程式碼規則與品質檢查

本專案使用 pnpm、ESLint 自訂規則、Prettier、Vitest 與 shadcn/ui。完整規範請看
[`docs/code-style.md`](docs/code-style.md)。

```bash
pnpm lint        # ESLint 靜態檢查
pnpm lint:fix    # ESLint 可自動修復項目
pnpm format      # Prettier 格式化 TS/TSX/CSS/JSON/MD
pnpm typecheck   # TypeScript 型別檢查
pnpm test:run    # Vitest 單元測試
pnpm test:e2e    # Playwright 端對端測試
pnpm check       # lint + typecheck + test + build
```

第一次執行 Playwright 前，請先安裝 Chromium：

```bash
pnpm playwright:install
```

### 測試與主流套件選型

- **Vitest + React Testing Library**：用於純函式與同步 Client Component 測試，速度快、設定輕。
- **Playwright**：用於 E2E，適合驗證 Next.js App Router、Server Component、路由與真實瀏覽器互動。
- **Zod**：用於 API request body 與外部輸入驗證；目前 `/api/interpret` 已使用 Zod schema。
- **React Hook Form + @hookform/resolvers**：準備給後續更複雜的多步驟表單使用，可與 Zod schema 共用驗證規則。
- **next-intl**：i18n 使用 Next/App Router 生態常見方案，元件直接使用 `useTranslations` / `useLocale`。

`@vitejs/plugin-react` 只用於 Vitest 測試環境，正式開發與 production build 仍是 Next.js/Turbopack。

## 隱私與免責

- 生辰資料只在單次請求中使用,伺服器不做任何儲存
- 解讀內容由 AI 生成,僅供參考與娛樂,不構成醫療、法律或投資建議
