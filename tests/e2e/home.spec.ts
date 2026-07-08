import { expect, test } from '@playwright/test'

test('home page shows the first decision step', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: /問\s*命/ })).toBeVisible()
  await expect(page.getByText('你現在最想問的是什麼?')).toBeVisible()
  await expect(page.getByRole('button', { name: '下一步:填寫生辰' })).toBeDisabled()
})

test('visitor can complete the form until server validation', async ({ page }) => {
  await page.goto('/')

  await page
    .getByPlaceholder(/最近整體運勢/)
    .fill('我最近卡在工作選擇，想知道下一步方向。')
  await page.getByRole('button', { name: '下一步:填寫生辰' }).click()

  await expect(page.getByText('你的出生時間')).toBeVisible()

  await page.locator('#birth-date').click()
  const calendarDialog = page.getByRole('dialog')
  await expect(calendarDialog.getByRole('combobox').nth(1)).toContainText('七月')
  await calendarDialog.getByRole('button').filter({ hasText: /^15$/ }).click()
  await expect(page.locator('#birth-date')).toContainText(/^\d{4}-\d{2}-15$/)

  await page.locator('#birth-hour').click()
  await page.getByRole('option', { name: '09' }).click()
  await page.locator('#birth-minute').click()
  await page.getByRole('option', { name: '30' }).click()

  await page.getByRole('button', { name: '排盤解讀' }).click()
  await expect(page.getByText('你的命盤')).toBeVisible()
})
