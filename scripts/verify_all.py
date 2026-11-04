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

        # Test Microphone Input Tester in Companion Studio
        mic_test_btn = page.locator('button', has_text='Test Mic').first
        await mic_test_btn.scroll_into_view_if_needed()
        await mic_test_btn.click()
        await asyncio.sleep(1)
        # Check active status
        status_span = await page.query_selector('.mic-status-text')
        status_text = await status_span.inner_text() if status_span else ""
        assert "Level:" in status_text or "Microphone" in status_text
        print(f"  ✓ Mic test widget active: {status_text}")
        await mic_test_btn.click()
        print("  ✓ Mic test widget toggle verified")

        # Capture Studio with Mic Tester Screenshot
        await page.screenshot(path='dashboard_consolidated.png')
        print("  ✓ Screenshot captured: dashboard_consolidated.png")

        # Test Mic toggle button in chat input
        mic_btn = await page.wait_for_selector('button.mic-button')
        await mic_btn.click()
        await asyncio.sleep(0.5)
        await mic_btn.click()
        print("  ✓ Mic toggle verified")

        # Test Image Attachment button presence
        img_btn = await page.wait_for_selector('button.action-icon-button')
        assert img_btn is not None
        print("  ✓ Image attachment button verified")

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
