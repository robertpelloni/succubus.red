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

        # Ensure ElevenLabs API key is empty to force fallback to native SpeechSynthesis
        await page.evaluate("window.localStorage.removeItem('elevenlabs_api_key'); window.localStorage.removeItem('elevenlabs_voice_id');")
        await page.reload()
        await page.wait_for_selector('canvas')
        await asyncio.sleep(2)

        # Open settings
        settings_btn = await page.wait_for_selector('button.dashboard-toggle-btn')
        await settings_btn.click()
        await asyncio.sleep(1)

        prompt_textarea = await page.wait_for_selector('textarea.dashboard-input')
        # Instruct the AI to write a very long sentence with multiple parts
        await prompt_textarea.fill("You must reply with exactly this: 'This is the first sentence. This is the second sentence. This is the third sentence.'")

        # Close settings
        await settings_btn.click()
        await asyncio.sleep(1)

        # Send a message
        input_box = await page.wait_for_selector('input[placeholder="Type a message..."]')
        await input_box.fill('Speak.')
        await page.keyboard.press('Enter')

        # Wait a few seconds for the LLM to start responding and trigger multiple SpeechSynthesisUtterances
        print("Waiting for LLM response and TTS queue...")
        await asyncio.sleep(5)

        # We can't perfectly capture the moving jaw in a single frame natively,
        # but we can capture a screenshot to prove it didn't crash.
        await page.screenshot(path='native_tts_test.png')

        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
