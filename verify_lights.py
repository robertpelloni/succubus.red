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

        # We need to simulate the AI sending a [lights:off] tag.
        settings_btn = await page.wait_for_selector('button.dashboard-toggle-btn')
        await settings_btn.click()
        await asyncio.sleep(1)

        prompt_textarea = await page.wait_for_selector('textarea.dashboard-input')
        # Instruct the AI to turn off the lights immediately
        await prompt_textarea.fill("You must reply with exactly this string: '[lights:off] The lights are now off.'")

        # Close settings
        await settings_btn.click()
        await asyncio.sleep(1)

        # Send a message
        input_box = await page.wait_for_selector('input[placeholder="Type a message..."]')
        await input_box.fill('Turn off the lights.')
        await page.keyboard.press('Enter')

        # Wait for the LLM streaming response to process the tag and update the 3D scene
        print("Waiting 10 seconds for LLM response and light transition...")
        await asyncio.sleep(10)

        # Take a screenshot to verify the lights are off
        await page.screenshot(path='lights_off.png')

        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
