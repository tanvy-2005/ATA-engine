from abc import ABC, abstractmethod
from typing import Optional, Dict, Any

class BaseLLM(ABC):
    @abstractmethod
    async def generate(
        self, 
        prompt: str, 
        system_prompt: Optional[str] = None, 
        response_format: Optional[str] = None
    ) -> str:
        """
        Generate response from LLM given prompt and optional system prompt.
        Args:
            prompt (str): User prompt
            system_prompt (Optional[str]): System prompt instructions
            response_format (Optional[str]): E.g. 'json' for JSON output formatting
        Returns:
            str: Generated response text
        """
        pass
