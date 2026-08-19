import asyncio
from dotenv import load_dotenv
load_dotenv() # Loads CLOUDINARY env vars from your .env file

from app.tools.browser import browser_manager
from app.tools.screenshot import take_screenshot

async def main():
    print("1. Initializing and opening browser...")
    page = await browser_manager.get_page()
    
    print("2. Navigating to google.com...")
    async def navigate():
        await page.goto("https://google.com")
    await browser_manager.run_async(navigate())
    
    print("3. Capturing and uploading screenshot to Cloudinary...")
    cloudinary_url = await take_screenshot("test_cloudinary_run")
    
    print("\n=========================================")
    print("SUCCESS!")
    print(f"Cloudinary Image URL: {cloudinary_url}")
    print("=========================================\n")
    
    print("4. Stopping browser...")
    await browser_manager.stop()

if __name__ == "__main__":
    asyncio.run(main())
