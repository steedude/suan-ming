/** 日期相關純函式 */

/** 補零至兩位數 */
export function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** 將 Date 格式化為表單用的 YYYY-MM-DD。 */
export function formatDateInput(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** 將 YYYY-MM-DD 轉成 Date；無效值回傳 undefined。 */
export function parseDateInput(value: string): Date | undefined {
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day || !isValidDate(year, month, day)) return undefined
  return new Date(year, month - 1, day)
}

/** 檢查是否為真實存在的日期(擋掉 2 月 30 日這類輸入) */
export function isValidDate(year: number, month: number, day: number): boolean {
  const d = new Date(year, month - 1, day)
  return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day
}

/** 台北時區的今天(YYYY-MM-DD),額度以台北時間換日 */
export function todayTaipei(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei' }).format(new Date())
}
