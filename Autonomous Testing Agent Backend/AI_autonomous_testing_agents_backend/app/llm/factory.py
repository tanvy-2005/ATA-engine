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
            else:
                raise ValueError(
                    f"Unsupported LLM Provider: '{provider}'. "
                    "This project uses Ollama only. Set LLM_PROVIDER=ollama in your .env"
                )
        return cls._instance
