import type { BaziChart, BirthInput, DaYun, Pillar } from '@/types/bazi'
import { Solar } from 'lunar-typescript'
import { pad } from '@/utils/date'
import { toTraditional } from '@/utils/zh'

/**
 * 八字排盤(確定性計算)
 *
 * 所有命盤資料(四柱、藏干、十神、五行、大運)都由 lunar-typescript 依節氣計算。
 *
 * 設計意圖:
 * - 前端先算一次,讓使用者不用等 AI 就能看到命盤。
 * - 後端 API 再算一次,避免相信前端送來的命盤結果。
 * - AI 完全不參與排盤,只拿結構化結果做文字解讀。
 *
 * 本模組是純函式、無副作用,因此可同時在瀏覽器與伺服器執行。
 */

/** 天干 → 五行 */
const GAN_WUXING: Record<string, string> = {
  甲: '木',
  乙: '木',
  丙: '火',
  丁: '火',
  戊: '土',
  己: '土',
  庚: '金',
  辛: '金',
  壬: '水',
  癸: '水',
}

/** 地支 → 五行 */
const ZHI_WUXING: Record<string, string> = {
  子: '水',
  丑: '土',
  寅: '木',
  卯: '木',
  辰: '土',
  巳: '火',
  午: '火',
  未: '土',
  申: '金',
  酉: '金',
  戌: '土',
  亥: '水',
}

/** 由陽曆生辰排出完整八字命盤 */
export function computeBazi(input: BirthInput): BaziChart {
  const solar = Solar.fromYmdHms(
    input.year,
    input.month,
    input.day,
    input.hour,
    input.minute,
    0,
  )
  const lunar = solar.getLunar()
  const ec = lunar.getEightChar()

  const buildPillar = (
    label: string,
    gan: string,
    zhi: string,
    hideGan: string[],
    shiShenGan: string,
    shiShenZhi: string[],
  ): Pillar => ({
    label,
    gan,
    zhi,
    hideGan,
    shiShenGan: toTraditional(shiShenGan),
    shiShenZhi: shiShenZhi.map(toTraditional),
    ganWuXing: GAN_WUXING[gan],
    zhiWuXing: ZHI_WUXING[zhi],
  })

  const pillars: Pillar[] = [
    buildPillar(
      '年柱',
      ec.getYearGan(),
      ec.getYearZhi(),
      ec.getYearHideGan(),
      ec.getYearShiShenGan(),
      ec.getYearShiShenZhi(),
    ),
    buildPillar(
      '月柱',
      ec.getMonthGan(),
      ec.getMonthZhi(),
      ec.getMonthHideGan(),
      ec.getMonthShiShenGan(),
      ec.getMonthShiShenZhi(),
    ),
    buildPillar(
      '日柱',
      ec.getDayGan(),
      ec.getDayZhi(),
      ec.getDayHideGan(),
      '日主',
      ec.getDayShiShenZhi(),
    ),
    buildPillar(
      '時柱',
      ec.getTimeGan(),
      ec.getTimeZhi(),
      ec.getTimeHideGan(),
      ec.getTimeShiShenGan(),
      ec.getTimeShiShenZhi(),
    ),
  ]

  // 統計四干四支的五行分布
  const wuXingCount: Record<string, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 }
  for (const p of pillars) {
    wuXingCount[p.ganWuXing]++
    wuXingCount[p.zhiWuXing]++
  }

  // 大運依性別與年干陰陽順逆排;失敗時不影響主流程
  let daYun: DaYun[] = []
  try {
    daYun = ec
      .getYun(input.gender === 'male' ? 1 : 0)
      .getDaYun()
      .slice(1, 7) // 第 0 步為起運前,略過
      .map((d) => ({
        startAge: d.getStartAge(),
        startYear: d.getStartYear(),
        ganZhi: d.getGanZhi(),
      }))
      .filter((d) => d.ganZhi)
  } catch {
    daYun = []
  }

  return {
    solarDate: `${input.year}-${pad(input.month)}-${pad(input.day)} ${pad(input.hour)}:${pad(input.minute)}`,
    lunarDate: `農曆${lunar.getYearInChinese()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()} ${lunar.getTimeZhi()}時`,
    shengXiao: toTraditional(lunar.getYearShengXiao()),
    pillars,
    dayMaster: ec.getDayGan(),
    dayMasterWuXing: GAN_WUXING[ec.getDayGan()],
    wuXingCount,
    daYun,
  }
}
