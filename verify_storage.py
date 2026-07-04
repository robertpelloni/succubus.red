import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Navigate to the frontend
        await page.goto('http://localhost:5173')
        await page.wait_for_selector('canvas')
        await asyncio.sleep(2)

        # Open settings
        settings_btn = await page.wait_for_selector('button.dashboard-toggle-btn')
        await settings_btn.click()
        await asyncio.sleep(1)

        # Change a setting (e.g., OpenRouter API Key)
        api_input = await page.wait_for_selector('input[placeholder="sk-or-v1-..."]')
        await api_input.fill('TEST_API_KEY_123')

        # Wait for React to sync state to StorageService
        await asyncio.sleep(1)

        # Reload the page
        await page.reload()
        await page.wait_for_selector('canvas')
        await asyncio.sleep(2)

        # Open settings again
        settings_btn = await page.wait_for_selector('button.dashboard-toggle-btn')
        await settings_btn.click()
        await asyncio.sleep(1)

        # Verify the setting was restored
        api_input = await page.wait_for_selector('input[placeholder="sk-or-v1-..."]')
        val = await api_input.input_value()

        if val == 'TEST_API_KEY_123':
            print("Successfully verified StorageService state restoration.")
        else:
            print(f"Failed: Expected 'TEST_API_KEY_123', got '{val}'")

        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
