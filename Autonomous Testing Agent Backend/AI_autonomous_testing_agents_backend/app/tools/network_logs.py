import logging
from typing import List, Dict, Any
from app.tools.browser import browser_manager

logger = logging.getLogger(__name__)

_network_logs: List[Dict[str, Any]] = []
_network_handler = None

def start_network_monitoring() -> None:
    """
    Subscribes to request/response events on page.
    """
    global _network_logs
    _network_logs.clear()
    logger.info("Started network monitoring.")

async def attach_network_listeners() -> None:
    global _network_handler
    async def _attach():
        global _network_handler
        page = await browser_manager.get_page()
        
        if _network_handler:
            try:
                page.remove_listener("response", _network_handler)
            except Exception:
                pass

        def on_request(request):
            pass

        def on_response(response):
            if response.status >= 400:
                log_entry = {
                    "url": response.url,
                    "status": response.status,
                    "status_text": response.status_text,
                    "method": response.request.method
                }
                _network_logs.append(log_entry)
                logger.warning(f"Failed network request: {response.request.method} {response.url} -> {response.status}")

        _network_handler = on_response
        page.on("response", on_response)

    await browser_manager.run_async(_attach())

async def detach_network_listeners() -> None:
    global _network_handler
    if not _network_handler:
        return
    async def _detach():
        global _network_handler
        page = await browser_manager.get_page()
        try:
            page.remove_listener("response", _network_handler)
        except Exception:
            pass
        _network_handler = None

    await browser_manager.run_async(_detach())

def get_failed_network_logs() -> List[Dict[str, Any]]:
    """
    Returns list of captured failed network requests.
    """
    return _network_logs

