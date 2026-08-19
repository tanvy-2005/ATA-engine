import os
import logging
import asyncio
import re
from typing import Optional
from openai import AsyncOpenAI
from app.llm.base import BaseLLM

logger = logging.getLogger(__name__)


class OllamaLLM(BaseLLM):
    """
    Ollama LLM client using the OpenAI-compatible API.
    This is the sole LLM provider for this project — Groq has been removed.
    """

    def __init__(self):
        base_url = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434/v1")
        self.model = os.environ.get("OLLAMA_MODEL", "qwen2.5-coder:7b")
        self.client = AsyncOpenAI(
            api_key="ollama",
            base_url=base_url,
        )
        logger.info(f"Initialized OllamaLLM with model: {self.model} at {base_url}")

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        response_format: Optional[str] = None
    ) -> str:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        kwargs = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.1,
            "max_tokens": 1200,
            "extra_body": {
                "options": {
                    "num_ctx": 4096,
                    "num_gpu": 99,
                    "num_predict": 1200,
                    "low_vram": False,
                    "f16_kv": True,
                    "num_thread": 8,
                    "use_mmap": True,
                }
            }
        }

        max_retries = 3
        base_delay = 2.0

        for attempt in range(max_retries + 1):
            try:
                response = await self.client.chat.completions.create(timeout=60.0, **kwargs)
                return response.choices[0].message.content
            except Exception as e:
                error_str = str(e).lower()
                is_retryable = any(k in error_str for k in [
                    "500", "502", "503", "connection", "timeout", "reset"
                ])

                if is_retryable and attempt < max_retries:
                    delay = base_delay * (2 ** attempt)
                    logger.warning(
                        f"[OllamaLLM] Error ({type(e).__name__}). "
                        f"Retrying in {delay:.1f}s... (attempt {attempt + 1}/{max_retries}). Error: {e}"
                    )
                    await asyncio.sleep(delay)
                else:
                    logger.error(f"[OllamaLLM] Failed after {attempt} retries: {e}")
                    raise e
