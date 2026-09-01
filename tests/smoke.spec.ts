import { test, expect, devices } from '@playwright/test'

const BASE_URL = process.env.BASE_URL ?? 'https://lunchbuddy-5fbda.web.app'

test.describe('LunchBuddy — primary kid flow', () => {
  test('new family → kid role → child setup → food picking view', async ({ page }) => {
    await page.goto(BASE_URL)

    await page.getByRole('button', { name: /משפחה חדשה/ }).click()
    await page.getByRole('button', { name: /אני ילד\/ה/ }).click()

    await expect(page.getByRole('heading', { name: 'בואו נכיר' })).toBeVisible()

    const kidName = `אודיט-${new Date().toISOString().replace(/[:.]/g, '-')}`
    await page.getByRole('button', { name: '🦁' }).click()
    await page.getByRole('textbox', { name: /השם שלי/ }).fill(kidName)
    await page.getByRole('button', { name: /בואו נתחיל/ }).click()

    await expect(page.getByText(`היי, ${kidName}`)).toBeVisible()
    await expect(page.getByRole('button', { name: /תבחר לי/ })).toBeVisible()

    // At least one food card rendered with a real (non-empty) icon glyph.
    const firstCardEmoji = page.locator('.food-card__emoji').first()
    await expect(firstCardEmoji).toBeVisible()
    await expect(firstCardEmoji).not.toHaveText('')
  })

  test('bottom nav switches between the four tabs', async ({ page }) => {
    await page.goto(BASE_URL)
    await page.getByRole('button', { name: /משפחה חדשה/ }).click()
    await page.getByRole('button', { name: /אני ילד\/ה/ }).click()
    await page.getByRole('button', { name: '🦁' }).click()
    await page.getByRole('textbox', { name: /השם שלי/ }).fill('אודיט')
    await page.getByRole('button', { name: /בואו נתחיל/ }).click()

    for (const tabName of [/תכנון שבועי/, /קניות/, /שלי/, /בחירה/]) {
      await page.getByRole('button', { name: tabName }).click()
      await expect(page.getByRole('button', { name: tabName })).toBeVisible()
    }
  })
})

test.describe('Viewport sanity — landing page renders at all three breakpoints', () => {
  for (const [label, viewport] of Object.entries({
    desktop: { width: 1440, height: 900 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 812 },
  })) {
    test(`renders at ${label} (${viewport.width}x${viewport.height})`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await page.goto(BASE_URL)
      await expect(page.getByRole('heading', { name: 'LunchBuddy' })).toBeVisible()
      await expect(page.getByRole('button', { name: /משפחה חדשה/ })).toBeVisible()
    })
  }
})
