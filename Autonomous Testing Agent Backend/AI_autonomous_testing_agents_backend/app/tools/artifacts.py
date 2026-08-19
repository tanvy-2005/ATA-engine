import logging
import json
import os
from datetime import datetime
from typing import Any

logger = logging.getLogger(__name__)

# Default directory for outputs
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, "..", ".."))
OUTPUTS_DIR = os.path.join(PROJECT_ROOT, ".artifacts", "outputs")


def save_artifact(filename: str, data: Any) -> str:
    """
    Save execution data (dict, list, string) as a file artifact.
    Returns path to the saved artifact file.
    """
    os.makedirs(OUTPUTS_DIR, exist_ok=True)
    
    path = os.path.join(OUTPUTS_DIR, filename)
    logger.info(f"Saving artifact to: {path}")

    with open(path, "w", encoding="utf-8") as f:
        if isinstance(data, (dict, list)):
            json.dump(data, f, indent=2)
        else:
            f.write(str(data))
            
    return path
