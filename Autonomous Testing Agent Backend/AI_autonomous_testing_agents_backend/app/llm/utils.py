import os
from pathlib import Path

PROMPTS_DIR = Path(__file__).parent / "prompts"

def load_prompt(filename: str) -> str:
    """
    Load a prompt template from the app/llm/prompts directory.
    """
    file_path = PROMPTS_DIR / filename
    if not file_path.exists():
        raise FileNotFoundError(f"Prompt file not found: {file_path}")
    
    with open(file_path, "r", encoding="utf-8") as f:
        return f.read().strip()
