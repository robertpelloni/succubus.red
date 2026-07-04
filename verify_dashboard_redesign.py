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
        await asyncio.sleep(2)

        # Open the dashboard
        settings_btn = await page.wait_for_selector('button.dashboard-toggle-btn')
        await settings_btn.click()

        # Wait for dashboard transition animation to finish
        await asyncio.sleep(1)

        # Take a screenshot to visually verify the categorized UI
        await page.screenshot(path='dashboard_redesign.png')

        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
