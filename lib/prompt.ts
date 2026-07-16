import type { QuestionCategory } from '@/configs/questions'
import type { BaziChart, Gender } from '@/types/bazi'
import type { Locale } from '@/types/i18n'

/**
 * AI 提示詞組裝
 *
 * 設計原則:
 * 1. 固定規則放 `SYSTEM_INSTRUCTION`,每次請求保持一致,利於模型端快取與穩定輸出。
 * 2. 變動資料由 `buildUserContent()` 產生,只放問題與已算好的命盤摘要。
 * 3. 命盤採緊湊行式格式,避免用長句描述四柱,降低 token 成本。
 * 4. 提示詞明確禁止 AI 重新排盤,避免模型自行推算造成錯誤。
 */

/** 固定不變的角色與輸出規則(每次請求逐字相同,利於快取) */
export const SYSTEM_INSTRUCTION = `你是一位溫暖、務實的八字命理顧問。來訪者正處於人生的困惑之中,你的任務不是預言吉凶,而是透過命盤給他方向感與力量。

命盤資料由程式依節氣精確排出,直接採用,絕不重新推算干支或十神。

輸出規則:
1. 語氣溫暖誠懇,像一位有智慧的長輩,不裝神弄鬼、不危言聳聽。
2. 依以下四段輸出,段落標題用【】包住;標題以外不使用任何 Markdown 符號(不用 #、*、-):
【你的命盤】日主特質、五行強弱與整體格局,白話易懂,約 150 字。
【關於你的問題】結合十神、五行、大運回應來訪者的問題,重點段落,約 250 字。
【給你的方向】2~3 條結合命盤特質的具體建議,避免空泛,約 150 字。
【結語】溫暖收尾,提醒命理是參考、方向盤在自己手上,約 50 字。
3. 不說「根據你提供的資料」這類字眼,直接以顧問口吻對來訪者說話。
4. 不給醫療、法律、投資的具體指示;涉及時提醒尋求專業協助。
5. 依「回覆語言」指定的語言輸出全文;段落標題也使用該語言(英文時格式如【Your Chart】)。`

/** 各語系的回覆語言指示與段落標題示例 */
const REPLY_LANGUAGE: Record<Locale, string> = {
  'zh-TW': '繁體中文',
  en: 'English(標題例:【Your Chart】【About Your Question】【Your Direction】【Closing】)',
}

/**
 * 把排盤結果序列化成緊湊的使用者訊息。
 * 格式:每柱一行「柱名 干支|干十神|藏干:十神,...」,固定欄位順序,方便模型穩定解析。
 */
export function buildUserContent(
  question: string,
  category: QuestionCategory,
  gender: Gender,
  chart: BaziChart,
  locale: Locale = 'zh-TW',
): string {
  const pillarLines = chart.pillars
    .map((p) => {
      const hidden = p.hideGan.map((g, i) => `${g}:${p.shiShenZhi[i] ?? ''}`).join(',')
      return `${p.label[0]} ${p.gan}${p.zhi}|${p.shiShenGan}|藏 ${hidden}`
    })
    .join('\n')

  const wuXing = Object.entries(chart.wuXingCount)
    .map(([k, v]) => `${k}${v}`)
    .join(' ')

  const daYun =
    chart.daYun.length > 0
      ? chart.daYun.map((d) => `${d.startAge}歲${d.ganZhi}`).join(' ')
      : '無資料'

  return `命主:${gender === 'male' ? '男' : '女'},陽曆 ${chart.solarDate},${chart.lunarDate},屬${chart.shengXiao}
四柱:
${pillarLines}
日主:${chart.dayMaster}${chart.dayMasterWuXing}
五行:${wuXing}
大運:${daYun}
問題類別:${category}
回覆語言:${REPLY_LANGUAGE[locale]}
問題:${question}`
}
