import logging
from typing import Callable, List, Dict

logger = logging.getLogger(__name__)

class EventDispatcher:
    """
    Subscribes and dispatches execution events.
    """
    def __init__(self):
        self._listeners: Dict[str, List[Callable]] = {}

    def subscribe(self, event_type: str, listener: Callable) -> None:
        if event_type not in self._listeners:
            self._listeners[event_type] = []
        self._listeners[event_type].append(listener)

    def dispatch(self, event_type: str, data: dict) -> None:
        listeners = self._listeners.get(event_type, [])
        logger.info(f"Dispatching event '{event_type}' to {len(listeners)} listeners.")
        for listener in listeners:
            try:
                listener(data)
            except Exception as e:
                logger.error(f"Error in listener for '{event_type}': {e}")

# Global dispatcher instance
event_dispatcher = EventDispatcher()
