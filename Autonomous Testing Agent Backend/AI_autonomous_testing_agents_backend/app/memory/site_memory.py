import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

class SiteMemory:
    """
    Stores site maps, navigation graphs, and page element inventory discovered during crawling.
    Strictly scoped by project_id + run_id + target_url.
    """
    def __init__(self):
        self._sitemap: Dict[str, Any] = {}
        self._pages_visited: List[str] = []
        self.current_project_id: Optional[str] = None
        self.current_run_id: Optional[str] = None
        self.current_target_url: Optional[str] = None
        # Optional archive for intentional historical comparison across runs
        self._history: Dict[str, Dict[str, Any]] = {}

    def start_run(self, target_url: str, run_id: Optional[str] = None, project_id: Optional[str] = None) -> None:
        logger.info(
            f"SiteMemory: Starting clean run-specific snapshot for url={target_url}, "
            f"run_id={run_id}, project_id={project_id}"
        )
        # Archive previous run to history if present before clearing
        if self.current_run_id and (self._sitemap or self._pages_visited):
            archive_key = f"{self.current_project_id or 'default'}_{self.current_run_id}"
            self._history[archive_key] = {
                "sitemap": self._sitemap.copy(),
                "pages_visited": list(self._pages_visited),
                "target_url": self.current_target_url,
                "project_id": self.current_project_id,
                "run_id": self.current_run_id,
            }
        # ALWAYS start with a clean snapshot for the new run
        self.clear()
        self.current_target_url = target_url
        self.current_run_id = run_id
        self.current_project_id = project_id

    def save_sitemap(self, sitemap: Dict[str, Any]) -> None:
        logger.info("SiteMemory: Saving site map and navigation elements for current run.")
        self._sitemap = sitemap

    def get_sitemap(self) -> Dict[str, Any]:
        return self._sitemap

    def mark_visited(self, url: str) -> None:
        if url not in self._pages_visited:
            self._pages_visited.append(url)

    def get_visited_pages(self) -> List[str]:
        return self._pages_visited

    def get_history(self, target_url: Optional[str] = None, project_id: Optional[str] = None) -> Dict[str, Dict[str, Any]]:
        """
        Allows intentional historical comparison separately from active run memory.
        """
        result = {}
        for key, snap in self._history.items():
            if target_url and snap.get("target_url") != target_url:
                continue
            if project_id and snap.get("project_id") != project_id:
                continue
            result[key] = snap
        return result

    def clear(self) -> None:
        self._sitemap.clear()
        self._pages_visited.clear()
        self.current_target_url = None
        self.current_run_id = None
        self.current_project_id = None

# Global singleton
site_memory = SiteMemory()

