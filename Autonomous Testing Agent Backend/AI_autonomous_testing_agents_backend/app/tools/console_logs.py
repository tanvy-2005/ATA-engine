import logging
from typing import List, Dict, Any
from app.tools.browser import browser_manager

logger = logging.getLogger(__name__)

_console_logs: List[Dict[str, Any]] = []
_console_handler = None

def start_console_monitoring() -> None:
    """
    Clears current console logs array.
    """
    global _console_logs
    _console_logs.clear()
    logger.info("Started console monitoring.")

async def attach_console_listeners() -> None:
    global _console_handler
    async def _attach():
        global _console_handler
        page = await browser_manager.get_page()

        if _console_handler:
            try:
                page.remove_listener("console", _console_handler)
            except Exception:
                pass

        def on_console(msg):
            if msg.type in ["error", "warning"]:
                text_lower = (msg.text or "").lower()
                noisy_patterns = [
                    "net::err_connection_timed_out",
                    "net::err_blocked_by_client",
                    "net::err_aborted",
                    "appsync-realtime-api",
                    "track&report js errors",
                    "preloaded using link preload but not used",
                    "failed to load resource: net::err_"
                ]
                if any(pattern in text_lower for pattern in noisy_patterns):
                    logger.debug(f"Ignored noisy third-party console {msg.type}: {msg.text}")
                    return

                log_entry = {
                    "type": msg.type,
                    "text": msg.text,
                    "location": msg.location
                }
                _console_logs.append(log_entry)
                logger.warning(f"Console {msg.type}: {msg.text}")

        _console_handler = on_console
        page.on("console", on_console)

    await browser_manager.run_async(_attach())

async def detach_console_listeners() -> None:
    global _console_handler
    if not _console_handler:
        return
    async def _detach():
        global _console_handler
        page = await browser_manager.get_page()
        try:
            page.remove_listener("console", _console_handler)
        except Exception:
            pass
        _console_handler = None

    await browser_manager.run_async(_detach())


def get_console_logs() -> List[Dict[str, Any]]:
    """
    Returns captured console warning/error logs.
    """
    return _console_logs
