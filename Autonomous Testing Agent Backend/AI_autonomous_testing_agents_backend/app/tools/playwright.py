import logging
from playwright.async_api import Page
from app.tools.browser import browser_manager

logger = logging.getLogger(__name__)

import time
from typing import Dict, Any

import re

def clean_url(url: str) -> str:
    """
    Clean and sanitize the input URL to handle common formatting typos and protocol omissions.
    """
    if not url:
        return ""
    url = url.strip()
    url = re.sub(r'^(https?)[/:]+', r'\1://', url)
    if not url.startswith("http://") and not url.startswith("https://"):
        if url.startswith("localhost") or url.startswith("127.0.0.1"):
            url = "http://" + url
        else:
            url = "https://" + url
    return url

async def navigate_to(url: str) -> Dict[str, Any]:
    """
    Navigate to a specific URL and extract metadata, load time, network logs, cookies and storage.
    """
    url = clean_url(url)

    async def _navigate():
        logger.info(f"[Browser] Opening URL: {url}")
        page = await browser_manager.get_page()
        
        api_calls = []
        # Setup request listener to intercept API calls
        def on_request(request):
            if "api" in request.url.lower():
                api_calls.append({
                    "url": request.url,
                    "method": request.method
                })
        
        page.on("request", on_request)
        
        start_time = time.perf_counter()
        response = None
        status_code = 200
        error_message = None
        
        try:
            # Use "load" instead of "networkidle" because local dev servers (Vite/React) 
            # keep websockets open, causing networkidle to always timeout after 15s.
            response = await page.goto(url, wait_until="load", timeout=10000)
        except Exception as e1:
            error_str = str(e1)
            if "ERR_ABORTED" in error_str:
                logger.warning(f"[Browser] Navigation aborted (e.g. redirect or cancel). Current URL: {page.url}")
                status_code = 200
            else:
                logger.warning(f"[Browser] Navigation with load failed/timed out: {e1}. Retrying with domcontentloaded...")
                try:
                    response = await page.goto(url, wait_until="domcontentloaded", timeout=5000)
                except Exception as e2:
                    error_str2 = str(e2)
                    if "ERR_ABORTED" in error_str2:
                        logger.warning(f"[Browser] Navigation aborted on retry. Current URL: {page.url}")
                        status_code = 200
                    else:
                        logger.error(f"[Browser] Navigation failed completely: {e2}")
                        error_message = str(e2)
                        status_code = 500
        
        end_time = time.perf_counter()
        page_load_time = round(end_time - start_time, 3)
        
        if response:
            status_code = response.status
        
        # Check if the URL redirected to a different page/domain
        if _is_redirect_to_different_url(url, page.url):
            logger.warning(f"[Browser] URL redirected from {url} to {page.url}. Restricting analysis.")
            page.remove_listener("request", on_request)
            return {
                "page_load_time": page_load_time,
                "status_code": 302,
                "api_calls": [],
                "cookies": [],
                "local_storage": {},
                "session_storage": {},
                "error": f"REDIRECTED: URL redirected to {page.url}"
            }
        
        logger.info(f"[Browser] Page load finished with status: {status_code}")
        
        # Extract cookies and storage safely
        cookies = []
        local_storage = {}
        session_storage = {}
        try:
            cookies = await page.context.cookies()
            local_storage = await page.evaluate("() => ({ ...localStorage })")
            session_storage = await page.evaluate("() => ({ ...sessionStorage })")
        except Exception as e_storage:
            logger.warning(f"[Browser] Could not extract cookies/storage: {e_storage}")
        
        # Clean listener to avoid leak
        page.remove_listener("request", on_request)
        
        return {
            "page_load_time": page_load_time,
            "status_code": status_code,
            "api_calls": api_calls,
            "cookies": cookies,
            "local_storage": local_storage,
            "session_storage": session_storage,
            "error": error_message
        }

    return await browser_manager.run_async(_navigate())


async def click_element(selector: str) -> None:
    """
    Clicks an element defined by selector.
    """
    async def _click():
        logger.info(f"Clicking element: {selector}")
        page = await browser_manager.get_page()
        await page.wait_for_selector(selector, state="attached", timeout=10000)
        try:
            await page.click(selector, timeout=5000)
        except Exception:
            # Element exists but may be hidden (e.g. collapsed chat widget), force click
            await page.evaluate(f'document.querySelector("{selector.replace(chr(34), chr(39))}")?.click()')

    await browser_manager.run_async(_click())

async def fill_input(selector: str, value: str) -> None:
    """
    Fills an input field with the given value.
    """
    async def _fill():
        logger.info(f"Filling element: {selector} with value")
        page = await browser_manager.get_page()
        await page.wait_for_selector(selector, state="attached", timeout=10000)
        try:
            await page.fill(selector, value, timeout=5000)
        except Exception:
            # Element exists but is hidden, fill via JS as fallback
            escaped = value.replace("'", "\\'")
            sel_escaped = selector.replace('"', "'")
            await page.evaluate(f'var el = document.querySelector("{sel_escaped}"); if(el) {{ el.value = \'{escaped}\'; el.dispatchEvent(new Event(\'input\', {{bubbles:true}})); el.dispatchEvent(new Event(\'change\', {{bubbles:true}})); }}')

    await browser_manager.run_async(_fill())

async def select_option(selector: str, value: str) -> None:
    """
    Selects a dropdown option by value or label.
    """
    async def _select():
        logger.info(f"Selecting dropdown: {selector} with option: {value}")
        page = await browser_manager.get_page()
        await page.wait_for_selector(selector, state="attached", timeout=10000)
        await page.select_option(selector, value)

    await browser_manager.run_async(_select())

async def get_page_content() -> str:
    """
    Gets the HTML body content.
    """
    async def _content():
        page = await browser_manager.get_page()
        return await page.content()

    return await browser_manager.run_async(_content())


def _is_redirect_to_different_url(orig_url: str, redirect_target: str) -> bool:
    from urllib.parse import urlparse, urljoin
    try:
        full_target = urljoin(orig_url, redirect_target)
        p1 = urlparse(orig_url)
        p2 = urlparse(full_target)
        
        def norm_host(h: str) -> str:
            h = h.lower().strip()
            if h.startswith("www."):
                h = h[4:]
            return h
            
        host1 = norm_host(p1.netloc)
        host2 = norm_host(p2.netloc)
        
        # Only consider it a restricted redirect if it navigates to an entirely DIFFERENT domain host
        return host1 != host2
    except Exception:
        return False


async def check_site_reachability(url: str) -> tuple[bool, str]:
    """
    Checks if a target URL is reachable and does not redirect to a different domain page before starting analysis.
    Returns (is_reachable: bool, reason: str).
    """
    import httpx
    url = clean_url(url)
    if not url:
        return False, "Empty URL"
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
        }
        async with httpx.AsyncClient(verify=False, follow_redirects=True, timeout=8.0) as client:
            response = await client.get(url, headers=headers)
            if response.status_code >= 400 and response.status_code not in (401, 403, 405, 429):
                return False, f"HTTP {response.status_code} ({response.reason_phrase})"
            if str(response.url) and _is_redirect_to_different_url(url, str(response.url)):
                return False, f"REDIRECTED: {str(response.url)}"
            return True, "OK"
    except Exception as e:
        logger.warning(f"[Reachability] HTTP ping error for {url}: {e}. Proceeding with Playwright browser load.")
        return True, "OK"

