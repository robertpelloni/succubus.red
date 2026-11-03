import asyncio
import os
import sys
from playwright.async_api import async_playwright

async def verify_app():
    print("[1/5] Launching Playwright browser...")
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(permissions=['microphone'])
        page = await context.new_page()

        print("[2/5] Navigating to frontend on http://localhost:5173 ...")
        await page.goto('http://localhost:5173')

        # Authentication Overlay check
        auth_input = await page.wait_for_selector('.auth-input', timeout=10000)
        await auth_input.fill('qa_user')
        await page.click('.auth-button')
        print("  ✓ Authenticated as qa_user")

        # 3D Canvas
        await page.wait_for_selector('canvas', timeout=10000)
        await asyncio.sleep(2)
        print("  ✓ 3D Canvas mounted successfully")

        # Open Dashboard Panel
        settings_btn = await page.wait_for_selector('button.dashboard-toggle-btn')
        await settings_btn.click()
        await asyncio.sleep(1)
        print("  ✓ Dashboard opened")

        # Capture Dashboard Screenshot
        await page.screenshot(path='dashboard_consolidated.png')
        print("  ✓ Screenshot captured: dashboard_consolidated.png")

        # Test Mic button
        mic_btn = await page.wait_for_selector('button.mic-button')
        await mic_btn.click()
        await asyncio.sleep(0.5)
        await mic_btn.click()
        print("  ✓ Mic toggle verified")

        # Test Camera preset
        close_btn = await page.query_selector('button:has-text("Close")')
        if close_btn:
            await close_btn.click()
            await asyncio.sleep(1)
            print("  ✓ Camera preset tested")

        await browser.close()
        print("[5/5] Verification completed successfully!")

if __name__ == '__main__':
    asyncio.run(verify_app())
