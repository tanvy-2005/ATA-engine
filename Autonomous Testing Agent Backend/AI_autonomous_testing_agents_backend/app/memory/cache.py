import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

class CacheMemory:
    """
    Key-Value cache for repetitive LLM queries or page scrapes.
    """
    def __init__(self):
        self._cache: Dict[str, Any] = {}

    def get(self, key: str) -> Any:
        return self._cache.get(key)

    def set(self, key: str, value: Any) -> None:
        logger.debug(f"CacheMemory: set '{key}'")
        self._cache[key] = value

    def clear(self) -> None:
        logger.info("CacheMemory: Cleared cache.")
        self._cache.clear()

# Global singleton
cache_memory = CacheMemory()
