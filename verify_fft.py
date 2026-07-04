import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Navigate to the frontend
        await page.goto('http://localhost:5173')

        # Wait for the model to load and scene to render
        await page.wait_for_selector('canvas')
        await asyncio.sleep(5)

        # Send a chat message
        input_box = await page.wait_for_selector('input[type="text"]')
        await input_box.fill('Hello, test the lipsync!')

        send_btn = await page.query_selector('button:has-text("Send")')
        if not send_btn:
             # Find any button that might be the send button.
             # Usually it's the last button or the only one next to the input
             buttons = await page.query_selector_all('button')
             send_btn = buttons[-1]

        await send_btn.click()

        # Wait for some time to allow the response to start and lips to move
        await asyncio.sleep(3)

        # Take a screenshot
        await page.screenshot(path='fft_lipsync.png')

        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
