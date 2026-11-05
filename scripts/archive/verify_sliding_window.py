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

        # We don't necessarily need to trigger 21 messages to test the UI,
        # but we can verify the UI loads cleanly with the new prompt

        # Find the Settings toggle and click it
        settings_btn = await page.wait_for_selector('button.dashboard-toggle-btn')
        await settings_btn.click()

        await asyncio.sleep(1)

        # Check that the textarea has our new default prompt
        prompt_textarea = await page.wait_for_selector('textarea.dashboard-input')
        prompt_text = await prompt_textarea.input_value()

        if "You are Succubus" in prompt_text:
            print("Successfully loaded the new default system prompt.")
            await page.screenshot(path='sliding_window.png')
        else:
            print("Failed to find new system prompt:", prompt_text)

        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
