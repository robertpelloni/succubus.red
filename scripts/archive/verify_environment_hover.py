import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Navigate to the frontend
        await page.goto('http://localhost:5173')

        # Wait for the scene and model to fully load
        await page.wait_for_selector('canvas')
        await asyncio.sleep(6)

        # Move the mouse over a part of the environment (e.g., the stage floor)
        # Assuming the stage floor is towards the bottom center of the canvas
        await page.mouse.move(400, 500)

        # Wait for any hover transitions
        await asyncio.sleep(1)

        # Take a screenshot to visually verify the mesh emissive highlight
        await page.screenshot(path='environment_hover.png')

        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
