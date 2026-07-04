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

        # We need to simulate the AI sending an [effect:sparkle] tag.
        settings_btn = await page.wait_for_selector('button.dashboard-toggle-btn')
        await settings_btn.click()
        await asyncio.sleep(1)

        prompt_textarea = await page.wait_for_selector('textarea.dashboard-input')
        # Instruct the AI to trigger the effect
        await prompt_textarea.fill("You must reply with exactly this string: '[effect:sparkle] The sparkles are now active.'")

        # Close settings
        await settings_btn.click()
        await asyncio.sleep(1)

        # Send a message
        input_box = await page.wait_for_selector('input[placeholder="Type a message..."]')
        await input_box.fill('Show me sparkles.')
        await page.keyboard.press('Enter')

        # Wait for the LLM streaming response to process the tag and update the 3D scene
        print("Waiting 10 seconds for LLM response and particle rendering...")
        await asyncio.sleep(10)

        # Take a screenshot to verify the sparkles are active
        await page.screenshot(path='sparkles_active.png')

        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
