import os
import logging
from typing import Optional
from openai import AsyncOpenAI
from app.llm.base import BaseLLM

logger = logging.getLogger(__name__)

class GroqLLM(BaseLLM):
    def __init__(self):
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY environment variable is not set.")
        
        self.model = os.environ.get("GROQ_MODEL", "llama-3.1-8b-instant")
        self.client = AsyncOpenAI(
            api_key=api_key,
            base_url="https://api.groq.com/openai/v1",
        )
        logger.info(f"Initialized GroqLLM with model: {self.model}")

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
            "max_tokens": 2500,
        }

        # Handle json response format if supported and requested
        if response_format == "json":
            kwargs["response_format"] = {"type": "json_object"}

        import asyncio
        import re
        max_retries = 4
        base_delay = 2.5
        
        for attempt in range(max_retries + 1):
            try:
                response = await self.client.chat.completions.create(timeout=30.0, **kwargs)
                return response.choices[0].message.content
            except Exception as e:
                error_str = str(e).lower()
                is_retryable = any(k in error_str for k in ["429", "413", "rate limit", "tokens per minute", "rate_limit_exceeded", "too many requests", "request too large", "500", "502", "503"])
                
                if is_retryable and attempt < max_retries:
                    delay = base_delay * (2 ** attempt)
                    match = re.search(r"try again in ([0-9.]+)s", error_str)
                    if match:
                        try:
                            parsed_wait = float(match.group(1)) + 1.5
                            delay = max(delay, parsed_wait)
                        except Exception:
                            pass

                    if "413" in error_str or "request too large" in error_str or "message size" in error_str:
                        logger.warning(f"413 Request too large in GroqLLM. Reducing prompt size and retrying...")
                        if kwargs.get("messages") and "content" in kwargs["messages"][-1]:
                            old_content = kwargs["messages"][-1]["content"]
                            kwargs["messages"][-1]["content"] = old_content[:max(500, len(old_content) // 2)] + "\n... [TRUNCATED FOR GROQ TOKEN LIMIT]"

                    logger.warning(f"Groq API error ({type(e).__name__}). Retrying in {delay:.2f}s... (Attempt {attempt+1}/{max_retries}) Error: {e}")
                    await asyncio.sleep(delay)
                else:
                    logger.error(f"Error during Groq LLM generation after {attempt} retries: {e}")
                    raise e
