const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(4000);
  await page.screenshot({ path: '/home/jules/verification/final_test.png' });
  await browser.close();
})();
