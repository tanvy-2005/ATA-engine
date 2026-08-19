import asyncio
from playwright.async_api import async_playwright
import sys
import random

async def run():
    print("Launching browser...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 720})
        page = await context.new_page()

        # Listen to console logs
        page.on("console", lambda msg: print(f"[CONSOLE] {msg.type}: {msg.text}"))
        
        # Listen to failed network requests
        page.on("requestfailed", lambda req: print(f"[REQ FAILED] {req.method} {req.url}: {req.failure}"))
        page.on("response", lambda res: print(f"[RESP] {res.status} {res.url}") if res.status >= 400 else None)

        random_id = random.randint(10000, 99999)
        email = f"test_{random_id}@example.com"
        password = "Password123!"

        # 1. Signup
        print("Navigating to signup page...")
        await page.goto("http://localhost:5173/signup")
        
        print("Waiting for password selector to ensure page has fully rendered...")
        await page.wait_for_selector("#signup-password", state="visible", timeout=10000)

        print("Filling registration form...")
        await page.fill("#signup-name", "Browser Tester")
        await page.fill("input[type='email']", email)
        await page.fill("#signup-password", password)
        await page.fill("#signup-confirm", password)
        
        print("Submitting signup...")
        await page.click("button[type='submit']")
        await page.wait_for_timeout(15000)
        print("Current URL:", page.url)

        # Take screenshot of signup outcome
        await page.screenshot(path="artifacts/diag_signup.png")

        # Check if redirected to OTP verification
        if "/verify-otp" in page.url:
            print("Redirected to OTP verification. Querying database for verification code...")
            # Query MongoDB for the code
            from app.db.mongodb import db_client, connect_to_mongo
            await connect_to_mongo()
            user_doc = await db_client.db["users"].find_one({"email": email})
            if user_doc and "verification_code" in user_doc:
                code = user_doc["verification_code"]
                print(f"Verification code found: {code}")
                # Fill digits
                # The page might have 6 separate input boxes
                inputs = await page.query_selector_all("input[type='text']")
                if len(inputs) == 6:
                    for i, char in enumerate(code):
                        await inputs[i].fill(char)
                else:
                    await page.fill("input", code)
                
                print("Submitting OTP...")
                await page.click("button[type='submit']")
                await page.wait_for_timeout(3000)
                print("Current URL after OTP:", page.url)
                await page.screenshot(path="artifacts/diag_post_otp.png")

        # Check if logged in / on dashboard
        if "/dashboard" in page.url or "/workspaces" in page.url:
            print("Successfully logged in!")
        else:
            print("Not logged in. Current URL:", page.url)
            await browser.close()
            return

        # 2. Create Workspace
        print("Navigating to workspaces page...")
        await page.goto("http://localhost:5173/workspaces")
        await page.wait_for_timeout(2000)
        
        # Click "New Workspace"
        print("Clicking New Workspace...")
        await page.click("text=New Workspace")
        await page.wait_for_timeout(1500)
        
        print("Filling workspace creation form...")
        await page.fill("input[name='name']", f"Diag Workspace {random_id}")
        await page.fill("textarea[name='description']", "Diagnostic workspace creation from playwright")
        await page.click("button[type='submit']")
        await page.wait_for_timeout(3000)
        print("Current URL after workspace creation:", page.url)
        await page.screenshot(path="artifacts/diag_workspace_created.png")

        # 3. Create Project
        print("Navigating to projects page...")
        await page.goto("http://localhost:5173/projects")
        await page.wait_for_timeout(2000)

        print("Clicking Create Project...")
        # Find the Create Project button
        await page.click("text=Create Project")
        await page.wait_for_timeout(2000)
        print("Current URL (Project Create):", page.url)

        print("Filling project form...")
        # General Information
        await page.fill("input[name='name']", f"Diag Project {random_id}")
        await page.fill("input[name='baseUrl']", "https://the-internet.herokuapp.com/")
        await page.fill("textarea[name='description']", "Diagnostic website project")
        
        # Submit the project creation form
        print("Submitting project form...")
        await page.click("button[type='submit']")
        await page.wait_for_timeout(4000)
        print("Current URL after project creation:", page.url)
        await page.screenshot(path="artifacts/diag_project_created.png")

        # 4. Trigger Run Tests
        # Click on the project card to open it
        print("Opening the project details page...")
        await page.click("text=Diag Project")
        await page.wait_for_timeout(3000)
        print("Current URL (Project Overview):", page.url)
        await page.screenshot(path="artifacts/diag_project_overview.png")

        print("Clicking Run Tests button...")
        # The overview page should show the "Run Tests" button
        run_btn = await page.query_selector("button:has-text('Run Tests')")
        if run_btn:
            await run_btn.click()
            print("Clicked Run Tests. Waiting for runs page to load...")
            await page.wait_for_timeout(5000)
            print("Current URL (Runs page):", page.url)
            await page.screenshot(path="artifacts/diag_runs_page.png")
            
            # Wait another 5 seconds to see if WebSocket and pipeline initialize
            print("Observing runs page telemetry...")
            await page.wait_for_timeout(8000)
            await page.screenshot(path="artifacts/diag_runs_page_final.png")
        else:
            print("Run Tests button not found!")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
