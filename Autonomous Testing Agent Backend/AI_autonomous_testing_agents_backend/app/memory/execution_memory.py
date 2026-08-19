import logging
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)

class ExecutionMemory:
    """
    Stores logs and output results for each phase/agent execution, strictly scoped by execution_id + target_url + project_id.
    """
    def __init__(self):
        self._agent_outputs: Dict[str, Any] = {}
        self._test_cases: List[Dict[str, Any]] = []
        self._validation_results: List[Dict[str, Any]] = []
        self._bug_analyses: List[Dict[str, Any]] = []
        self.current_execution_id: Optional[str] = None
        self.current_target_url: Optional[str] = None
        self.current_project_id: Optional[str] = None
        # Optional archive for intentional historical comparison across runs
        self._history: Dict[str, Dict[str, Any]] = {}

    def start_run(self, execution_id: str, target_url: str, project_id: Optional[str] = None) -> None:
        logger.info(
            f"ExecutionMemory: Starting clean run-specific snapshot for run={execution_id} "
            f"({target_url}), project_id={project_id}"
        )
        # Archive previous run before starting a clean snapshot
        if self.current_execution_id and (
            self._agent_outputs or self._test_cases or self._validation_results or self._bug_analyses
        ):
            archive_key = f"{self.current_project_id or 'default'}_{self.current_execution_id}"
            self._history[archive_key] = {
                "agent_outputs": self._agent_outputs.copy(),
                "test_cases": list(self._test_cases),
                "validation_results": list(self._validation_results),
                "bug_analyses": list(self._bug_analyses),
                "execution_id": self.current_execution_id,
                "target_url": self.current_target_url,
                "project_id": self.current_project_id,
            }
        # ALWAYS start with a clean snapshot for every run
        self.clear()
        self.current_execution_id = execution_id
        self.current_target_url = target_url
        self.current_project_id = project_id

    def set_agent_output(self, agent_name: str, output: Any) -> None:
        logger.info(f"ExecutionMemory: Storing output for {agent_name} (run_id={self.current_execution_id})")
        self._agent_outputs[agent_name] = output

    def get_agent_output(self, agent_name: str) -> Any:
        return self._agent_outputs.get(agent_name)

    def set_test_cases(self, test_cases: List[Dict[str, Any]]) -> None:
        self._test_cases = test_cases

    def get_test_cases(self) -> List[Dict[str, Any]]:
        return self._test_cases

    def add_validation_result(self, result: Dict[str, Any]) -> None:
        self._validation_results.append(result)

    def get_validation_results(self) -> List[Dict[str, Any]]:
        return self._validation_results

    def add_bug_analysis(self, analysis: Dict[str, Any]) -> None:
        self._bug_analyses.append(analysis)

    def get_bug_analyses(self) -> List[Dict[str, Any]]:
        return self._bug_analyses

    def get_history(self, execution_id: Optional[str] = None, target_url: Optional[str] = None, project_id: Optional[str] = None) -> Dict[str, Dict[str, Any]]:
        """
        Allows intentional historical comparison separately from active run memory.
        """
        result = {}
        for key, snap in self._history.items():
            if execution_id and snap.get("execution_id") != execution_id:
                continue
            if target_url and snap.get("target_url") != target_url:
                continue
            if project_id and snap.get("project_id") != project_id:
                continue
            result[key] = snap
        return result

    def clear(self) -> None:
        self._agent_outputs.clear()
        self._test_cases.clear()
        self._validation_results.clear()
        self._bug_analyses.clear()
        self.current_execution_id = None
        self.current_target_url = None
        self.current_project_id = None

# Global singleton
execution_memory = ExecutionMemory()

