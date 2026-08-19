import logging
import sys
import os
import asyncio
import threading
import time
from playwright.async_api import async_playwright, Browser, Page, BrowserContext
from typing import AsyncGenerator, Optional, Tuple, Any

logger = logging.getLogger(__name__)

class BrowserManager:
    def __init__(self):
        self.playwright = None
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self._loop: Optional[asyncio.AbstractEventLoop] = None
        self._thread: Optional[threading.Thread] = None
        # Read headless preference from environment.
        # Set BROWSER_HEADLESS=false in your .env to launch a visible browser.
        # Force headless=True to avoid visible browser popups and system lag
        self.headless: bool = True

    def _start_loop(self):
        if self._thread and self._thread.is_alive():
            return
        
        def run():
            if sys.platform == 'win32':
                asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
                logging.getLogger("asyncio").setLevel(logging.ERROR)
            self._loop = asyncio.new_event_loop()
            asyncio.set_event_loop(self._loop)
            self._loop.run_forever()

        self._thread = threading.Thread(target=run, daemon=True)
        self._thread.start()
        # Wait for the loop to initialize and run
        while self._loop is None or not self._loop.is_running():
            time.sleep(0.01)

    async def run_async(self, coro: Any) -> Any:
        """
        Runs a coroutine on the background thread's event loop and awaits the result.
        """
        self._start_loop()
        future = asyncio.run_coroutine_threadsafe(coro, self._loop)
        return await asyncio.wrap_future(future)

    async def start(self) -> Tuple[Browser, BrowserContext]:
        """
        Starts the playwright engine and launches chromium browser on the background loop.
        """
        async def _start():
            if not self.playwright:
                logger.info("[Browser] Launching Chromium")
                self.playwright = await async_playwright().start()
            
            if not self.browser:
                mode_label = "HEADLESS" if self.headless else "HEADED (visible window)"
                logger.info(f"[Browser] Browser launching in {mode_label} mode")
                self.browser = await self.playwright.chromium.launch(headless=self.headless)
                self.context = await self.browser.new_context(
                    viewport={"width": 1280, "height": 720},
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                )
                logger.info("[Browser] Browser launched")
            return self.browser, self.context

        return await self.run_async(_start())

    async def stop(self):
        """
        Closes context, browser, and stops playwright.
        """
        async def _stop():
            logger.info("Stopping BrowserManager...")
            if self.context:
                await self.context.close()
                self.context = None
            if self.browser:
                await self.browser.close()
                self.browser = None
            if self.playwright:
                await self.playwright.stop()
                self.playwright = None
            logger.info("BrowserManager stopped successfully.")

        if self._loop and self._loop.is_running():
            await self.run_async(_stop())
            self._loop.call_soon_threadsafe(self._loop.stop)
            if self._thread:
                self._thread.join()
                self._thread = None
            self._loop = None

    async def get_page(self) -> Page:
        """
        Retrieves a new or existing page from context.
        """
        async def _get_page():
            if not self.context:
                await _start()
            
            pages = self.context.pages
            if pages:
                return pages[0]
            
            logger.info("Creating a new page context...")
            return await self.context.new_page()

        async def _start():
            if not self.playwright:
                logger.info("[Browser] Launching Chromium")
                self.playwright = await async_playwright().start()
            if not self.browser:
                mode_label = "HEADLESS" if self.headless else "HEADED (visible window)"
                logger.info(f"[Browser] Browser launching in {mode_label} mode")
                self.browser = await self.playwright.chromium.launch(headless=self.headless)
                self.context = await self.browser.new_context(
                    viewport={"width": 1280, "height": 720},
                    user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                )
                logger.info("[Browser] Browser launched")

        return await self.run_async(_get_page())

# Global browser manager instance for dependency injection/re-use
browser_manager = BrowserManager()

