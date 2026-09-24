import os
from typing import Optional
from app.llm.base import BaseLLM
from app.llm.ollama import OllamaLLM

class LLMFactory:
    _instance: Optional[BaseLLM] = None

    @classmethod
    def get_llm(cls) -> BaseLLM:
        """
        Factory method to return the singleton LLM client instance.
        Project runs fully on Ollama — Groq has been removed.
        """
        if cls._instance is None:
            provider = os.environ.get("LLM_PROVIDER", "ollama").lower()
            if provider == "ollama":
                cls._instance = OllamaLLM()
            elif provider == "gemini":
                # Route to ModelManager where it's actually handled
                cls._instance = None
            else:
                # Default to None or OllamaLLM instead of crashing
                cls._instance = None
        return cls._instance
