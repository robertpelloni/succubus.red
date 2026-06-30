from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 720})

        # Route API to return mocked responses
        def route_handler(route, request):
            if "/api/chat" in request.url:
                # Based on the message, return different mock JSON
                post_data = request.post_data_json
                msg = post_data.get("userMessages", [{}])[-1].get("content", "")

                if "wave" in msg.lower():
                    resp = '{"text": "Hello!", "animation": "wave", "emotion": "happy"}'
                elif "idle" in msg.lower():
                    resp = '{"text": "Just standing here.", "animation": "idle", "emotion": "relaxed"}'
                else:
                    resp = '{"text": "I am speaking now.", "animation": "idle", "emotion": "surprised"}'

                route.fulfill(
                    status=200,
                    content_type="text/plain",
                    body=resp
                )
            else:
                route.continue_()

        page.route("**/*", route_handler)

        print("Navigating to app...")
        page.goto('http://localhost:5173')

        print("Waiting for model to load (10s)...")
        time.sleep(10)

        # Scenario 1: Default Idle
        page.screenshot(path='/home/jules/verification/scenario1_default_idle.png')
        print("Scenario 1: Default Idle saved.")

        # Scenario 2: Wave animation + Happy emotion
        print("Triggering Wave scenario...")
        page.fill('input[type="text"]', 'Please wave')
        page.click('button:has-text("Send")')
        time.sleep(3) # Wait for animation to transition and play
        page.screenshot(path='/home/jules/verification/scenario2_wave_happy.png')
        print("Scenario 2: Wave + Happy saved.")

        # Scenario 3: Another interaction
        print("Triggering Idle scenario again...")
        page.fill('input[type="text"]', 'Go idle')
        page.click('button:has-text("Send")')
        time.sleep(3)
        page.screenshot(path='/home/jules/verification/scenario3_idle_relaxed.png')
        print("Scenario 3: Idle + Relaxed saved.")

        browser.close()

if __name__ == '__main__':
    run()
