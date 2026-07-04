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
        await asyncio.sleep(6) # Wait a bit for animations to load

        # Move mouse to the far top right
        await page.mouse.move(800, 100)
        await asyncio.sleep(2) # Allow time for the character's head to tween/turn
        await page.screenshot(path='lookat_top_right.png')

        # Move mouse to the far bottom left
        await page.mouse.move(100, 800)
        await asyncio.sleep(2)
        await page.screenshot(path='lookat_bottom_left.png')

        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
