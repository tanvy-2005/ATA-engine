import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class SessionMemory:
    """
    In-memory storage for active run session parameters and agent contexts.
    """
    def __init__(self):
        self._data: Dict[str, Any] = {}

    def get(self, key: str, default: Any = None) -> Any:
        return self._data.get(key, default)

    def set(self, key: str, value: Any) -> None:
        logger.debug(f"SessionMemory: set {key} = {value}")
        self._data[key] = value

    def clear(self) -> None:
        logger.info("SessionMemory: clearing active context")
        self._data.clear()

# Global singleton
session_memory = SessionMemory()
