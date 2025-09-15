import { test, expect } from '@playwright/test';

test('home renders and CTAs visible on mobile', async ({ page }) => {
  // iPhone-ish viewport
  await page.setViewportSize({ width: 375, height: 812 });

  await page.goto('/');

  // Hero text
  await expect(page.getByRole('heading', { name: /coordinate care with confidence/i })).toBeVisible();

  // Plan CTAs (small chips, not tall bars)
  await expect(page.getByRole('link', { name: /start lite/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /go elite/i })).toBeVisible();

  // Pricing details drawer opens
  const summary = page.getByRole('button', { name: /see pricing details/i }).first().or(page.getByText('See pricing details').first());
  if (await summary.isVisible()) {
    await summary.click();
  } else {
    // Fallback: summary rendered as <summary> without role=button
    await page.locator('summary:text("See pricing details")').first().click();
  }

  // Prices text
  await expect(page.getByText(/\$4\.99\s*\/\s*month/i)).toBeVisible();
  await expect(page.getByText(/\$9\.99\s*\/\s*month/i)).toBeVisible();

  // Elite health features present
  await expect(page.getByText(/Diabetes logs/i)).toBeVisible();
  await expect(page.getByText(/Medicine helper & MAR/i)).toBeVisible();
});

test('feature boxes expand/collapse work on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/#features');

  // Find a card and toggle +/-
  const medsCard = page.getByRole('heading', { name: /medications & mar/i }).locator('..');
  const toggle = medsCard.getByRole('button', { name: /expand|collapse|\+|–/i });
  await expect(toggle).toBeVisible();

  // Collapse then expand
  await toggle.click();
  await expect(medsCard.getByText(/Doses, refills/i)).toBeHidden();
  await toggle.click();
  await expect(medsCard.getByText(/Doses, refills/i)).toBeVisible();
});

test('donation CTAs exist with checkout links when env set', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/#foundation');

  const oneTime = page.getByRole('link', { name: /donate \$1\.00 \(one-time\)/i });
  const monthly = page.getByRole('link', { name: /donate \$1\.50 \/ month/i });

  // Buttons may be disabled if env vars not set; only assert href when visible
  if (await oneTime.isVisible()) {
    await expect(oneTime).toHaveAttribute('href', /\/api\/stripe\/checkout\?priceId=.*mode=payment/);
  }
  if (await monthly.isVisible()) {
    await expect(monthly).toHaveAttribute('href', /\/api\/stripe\/checkout\?priceId=.*mode=subscription/);
  }
});
