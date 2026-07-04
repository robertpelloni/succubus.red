import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Navigate to the frontend
        await page.goto('http://localhost:5173')

        # Wait for the scene to load
        await page.wait_for_selector('canvas')
        await asyncio.sleep(5)

        # Open the dashboard
        settings_btn = await page.wait_for_selector('button.dashboard-toggle-btn')
        await settings_btn.click()
        await asyncio.sleep(1)

        # Find the Close-up camera preset button and click it
        close_btn = await page.wait_for_selector('button:has-text("Close")')
        await close_btn.click()

        # Wait for the smooth camera transition to finish
        await asyncio.sleep(2)

        # Take a screenshot to visually verify the close-up angle
        await page.screenshot(path='camera_close_up.png')

        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
