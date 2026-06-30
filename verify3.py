from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 720})

        # Go to the local Vite server
        page.goto('http://localhost:5173')

        # Wait for the 3D model to load
        print("Waiting for 3D model to load...")
        time.sleep(10)

        # Take a screenshot
        screenshot_path = '/home/jules/verification/verification3.png'
        page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        browser.close()

if __name__ == '__main__':
    run()
