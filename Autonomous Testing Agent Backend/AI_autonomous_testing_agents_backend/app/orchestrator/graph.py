import logging
from typing import Dict, Any, Callable, List

logger = logging.getLogger(__name__)

class WorkflowGraph:
    """
    Simulated LangGraph structure for managing agent workflow node transitions.
    """
    def __init__(self):
        self.nodes: Dict[str, Callable] = {}
        self.edges: List[tuple] = []

    def add_node(self, name: str, action: Callable) -> None:
        logger.info(f"Adding workflow node: {name}")
        self.nodes[name] = action

    def add_edge(self, from_node: str, to_node: str) -> None:
        logger.info(f"Adding edge: {from_node} -> {to_node}")
        self.edges.append((from_node, to_node))
