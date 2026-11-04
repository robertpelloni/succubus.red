import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        # We need to grant microphone permissions for the context
        context = await browser.new_context(permissions=['microphone'])
        page = await context.new_page()

        # Navigate to the frontend
        await page.goto('http://localhost:5173')

        # Wait for the scene to load
        await page.wait_for_selector('canvas')
        await asyncio.sleep(5)

        # Find the microphone button and click it to start recording
        mic_btn = await page.wait_for_selector('button.mic-button')
        await mic_btn.click()

        # Wait a second for the UI state to update (CSS pulse animation)
        await asyncio.sleep(1)

        # Take a screenshot to verify the pulsing red mic button
        await page.screenshot(path='mic_recording.png')

        # Click it again to stop
        await mic_btn.click()

        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
