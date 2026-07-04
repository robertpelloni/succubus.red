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

        # Send a message to start a long stream
        input_box = await page.wait_for_selector('input[placeholder="Type a message..."]')
        await input_box.fill('Tell me a very long story.')
        await page.keyboard.press('Enter')

        # Wait a couple seconds so the stream is definitely in progress
        await asyncio.sleep(2)

        # Open settings and clear chat
        settings_btn = await page.wait_for_selector('button.dashboard-toggle-btn')
        await settings_btn.click()
        await asyncio.sleep(1)

        clear_btn = await page.wait_for_selector('button:has-text("Clear Chat")')
        await clear_btn.click()

        # Wait another couple seconds to ensure no crashes occurred and the UI is reset
        await asyncio.sleep(2)

        # Verify the chat window is empty
        messages = await page.query_selector_all('.chat-messages > div:not(:last-child)') # excluding the ref div
        if len(messages) == 0:
            print("Successfully verified chat clearance and stream abort.")

        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
