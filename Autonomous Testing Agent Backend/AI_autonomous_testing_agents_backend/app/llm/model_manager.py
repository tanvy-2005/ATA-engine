import os
import re
import time
import json
import logging
from typing import Optional, Tuple, Dict, Any
from openai import AsyncOpenAI

logger = logging.getLogger(__name__)


def _balance_json_braces(s: str) -> str:
    """
    Attempts to repair a truncated JSON string by completing unclosed
    double quotes, curly braces {}, and square brackets [].
    Also cleans up trailing commas and incomplete tokens.
    """
    s = s.strip()
    if not s:
        return s

    in_string = False
    escape = False
    stack = []

    for char in s:
        if escape:
            escape = False
            continue
        if char == '\\':
            escape = True
            continue
        if char == '"':
            in_string = not in_string
            continue
        if not in_string:
            if char in ('{', '['):
                stack.append(char)
            elif char in ('}', ']'):
                if stack:
                    opp = '{' if char == '}' else '['
                    if stack[-1] == opp:
                        stack.pop()

    # Repair step 1: Close unclosed string literal
    if in_string:
        s += '"'

    # Repair step 2: Strip trailing commas or trailing colons before closing
    s = re.sub(r',\s*$', '', s.strip())
    if s.endswith(':') or s.endswith(': '):
        s += ' null'

    # Repair step 3: Pop remaining open braces from stack in reverse order and close them
    while stack:
        open_brace = stack.pop()
        if open_brace == '{':
            s += '}'
        elif open_brace == '[':
            s += ']'

    # Repair step 4: Remove any trailing comma right before closing brace/bracket
    s = re.sub(r',\s*([\]}])', r'\1', s)
    return s


def _extract_json_from_text(text: str) -> str:
    """
    Robustly extract valid JSON from raw LLM output.
    Strips Thinking Preamble & Handle Non-JSON Output.
    """
    if not text:
        return text

    # Extract content between markdown code blocks if present
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text, flags=re.IGNORECASE)
    candidate = match.group(1) if match else text
    
    # Fallback to the first outer JSON object or array
    match_brace = re.search(r"(\{[\s\S]*\}|\[[\s\S]*\])", candidate)
    if match_brace:
        candidate = match_brace.group(1)
        
    return _balance_json_braces(candidate.strip())



class AIModelManager:
    _ollama_client: Optional[AsyncOpenAI] = None
    _ollama_available: Optional[bool] = None
    _ollama_models: Optional[list] = None

    @classmethod
    def get_ollama_client(cls) -> AsyncOpenAI:
        if cls._ollama_client is None:
            base_url = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434/v1")
            cls._ollama_client = AsyncOpenAI(
                api_key="ollama",
                base_url=base_url
            )
        return cls._ollama_client

    @classmethod
    async def check_ollama_available(cls, model_name: str) -> Tuple[bool, str]:
        """
        Check if Ollama is running and resolve an available model.
        Returns (is_available, effective_model_name).
        """
        # Removed early return so we retry if Ollama comes back up

        try:
            import urllib.request
            req = urllib.request.urlopen("http://localhost:11434/api/tags", timeout=1.5)
            data = json.loads(req.read().decode("utf-8"))
            models = [m["name"] for m in data.get("models", [])]
            cls._ollama_models = models
            cls._ollama_available = True

            if model_name in models:
                return True, model_name
            # For fast GPU performance on 4GB-6GB VRAM laptops, prefer fast 3B/small models if available
            fast_candidates = [
                "qwen2.5-coder:3b", "llama3.2:3b", "qwen2.5:3b", "phi3:3b",
                "qwen2.5-coder:1.5b", "llama3.2:1b", "gemma2:2b",
                "qwen2.5-coder:7b", "llama3.1:8b"
            ]
            for cand in fast_candidates:
                if cand in models:
                    logger.info(f"[ModelManager] Fast GPU routing: using '{cand}'.")
                    return True, cand
            # Try prefix match (e.g. "qwen2.5-coder:7b" matches "qwen2.5-coder:7b-instruct-q4_K_M")
            base = model_name.split(":")[0]
            for m in models:
                if base in m:
                    logger.info(f"[ModelManager] Model '{model_name}' not found, using '{m}'.")
                    return True, m
            if models:
                logger.info(f"[ModelManager] Model '{model_name}' not found, falling back to '{models[0]}'.")
                return True, models[0]
            cls._ollama_available = False
            return False, ""
        except Exception as e:
            logger.warning(f"[ModelManager] Ollama unreachable ({e}). Please ensure Ollama is running at {os.environ.get('OLLAMA_BASE_URL', 'http://localhost:11434/v1')}.")
            cls._ollama_available = False
            return False, ""

    MODEL_CONFIG = {
        "planner": {"provider": "gemini", "model": "gemini-3.6-flash", "timeout": 15.0},
        "explorer": {"provider": "gemini", "model": "gemini-3.6-flash", "timeout": 15.0},
        "generator": {"provider": "gemini", "model": "gemini-3.6-flash", "timeout": 20.0},
        "executor": None,
        "validator": None,
        "buganalyzer": {"provider": "gemini", "model": "gemini-3.6-flash", "timeout": 30.0},
        "bug_analyzer": {"provider": "gemini", "model": "gemini-3.6-flash", "timeout": 30.0},
        "bug-analyzer": {"provider": "gemini", "model": "gemini-3.6-flash", "timeout": 30.0},
        "reporter": {"provider": "gemini", "model": "gemini-3.6-flash", "timeout": 15.0},
        "memory": {"provider": "gemini", "model": "gemini-3.6-flash", "timeout": 15.0},
    }

    @classmethod
    def get_model_and_provider(cls, agent_name: str) -> Optional[Dict[str, Any]]:
        name = agent_name.lower().replace("_", "").replace("-", "").strip()
        default_config = cls.MODEL_CONFIG.get(name)
        
        # Don't override agents that intentionally have no LLM (e.g. executor)
        if default_config is None:
            return None
            
        from app.memory.session_memory import session_memory
        model_override = session_memory.get("model_override")
        
        OVERRIDE_MAP = {
            "gemini-3.6-flash": {"provider": "gemini", "model": "gemini-3.6-flash"},
            "deepseek-v3": {"provider": "openrouter", "model": "deepseek/deepseek-chat"},
            "claude-3.5-sonnet": {"provider": "openrouter", "model": "openrouter/free"},
            "auto": None
        }

        if model_override and model_override in OVERRIDE_MAP and OVERRIDE_MAP[model_override] is not None:
            logger.info(f"[ModelManager] Applying user override '{model_override}' for agent '{agent_name}'")
            # Return a copy of default_config with the new provider and model
            override_config = dict(default_config)
            override_config.update(OVERRIDE_MAP[model_override])
            return override_config

        return default_config


    @classmethod
    async def generate(
        cls,
        agent_name: str,
        prompt: str,
        system_prompt: Optional[str] = None,
        response_format: Optional[str] = None
    ) -> Tuple[str, Dict[str, Any]]:
        """
        Run LLM query, robustly extract JSON, calculate latency/tokens, and return output + metadata.
        """
        import asyncio
        config = cls.get_model_and_provider(agent_name)
        if not config:
            logger.info(f"[ModelManager] Agent '{agent_name}' requires no LLM call (Pure Playwright execution).")
            return "", {"agent_name": agent_name, "success": True, "skipped": True}

        model_name = config["model"]
        provider = config["provider"]
        client_timeout = config.get("timeout", 20.0)
        logger.info(f"[ModelManager] Routing agent '{agent_name}' to model '{model_name}' via provider '{provider}'")

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        if provider == "gemini":
            client = AsyncOpenAI(
                api_key=os.environ.get("GEMINI_API_KEY", "dummy"),
                base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
                max_retries=1
            )
            eff_model = model_name
        elif provider == "openrouter":
            client = AsyncOpenAI(
                api_key=os.environ.get("OPENROUTER_API_KEY", "dummy"),
                base_url="https://openrouter.ai/api/v1",
                max_retries=1
            )
            eff_model = model_name
        else:
            raise RuntimeError(f"Unsupported provider {provider} configured.")
            
        model_name = eff_model

        kwargs = {
            "model": model_name,
            "messages": messages,
            "temperature": 0.1,
            "max_tokens": 1200,
        }

        if provider == "ollama":
            kwargs["extra_body"] = {
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

        if response_format == "json":
            kwargs["response_format"] = {"type": "json_object"}

        start_time = time.perf_counter()
        response = None

        max_retries = 2
        for attempt in range(max_retries + 1):
            try:
                # Minimum 2.0-second sleep to prevent tripping Gemini free tier RPM limit
                if provider in ["gemini", "openrouter"]:
                    await asyncio.sleep(2.0)

                # Use explicit timeout
                response = await client.chat.completions.create(timeout=client_timeout, **kwargs)
                break

            except Exception as e:
                err_str = str(e).lower()
                
                # Check for rate limit / 429 / resource exhausted or 400
                if "429" in err_str or "resource_exhausted" in err_str or "rate limit" in err_str or "rate_limit" in err_str or "400" in err_str:
                    if provider == "gemini" and attempt < max_retries:
                        wait_sec = (2.0 ** attempt) * 2.0 # Exponential backoff with jitter
                        logger.warning(f"⚠️ Rate limit hit on {provider}. Waiting {wait_sec}s before retry...")
                        await asyncio.sleep(wait_sec)
                        continue

                    logger.warning(f"⚠️ Persistent Rate limit or endpoint error hit. Falling back to OpenRouter free non-reasoning models...")
                    
                    # Update config for fallback to 100% free non-thinking models
                    provider = "openrouter"
                    model_name = "meta-llama/llama-3.1-8b-instruct:free"
                    
                    # Initialize OpenRouter client
                    client = AsyncOpenAI(
                        api_key=os.environ.get("OPENROUTER_API_KEY", "dummy"),
                        base_url="https://openrouter.ai/api/v1",
                        max_retries=1
                    )
                    
                    # Update kwargs with the new model
                    kwargs["model"] = model_name
                    
                    # Force a retry
                    max_retries = max(max_retries, attempt + 1)
                    continue

                is_retryable = any(k in err_str for k in [
                    "413", "tokens per minute",
                    "too many requests",
                    "request too large", "message size",
                    "timeout", "timed out", "connect", "connection",
                    "503", "502", "reset", "disconnected", "broken pipe"
                ])
                if "localhost" in err_str or "127.0.0.1" in err_str:
                    is_retryable = False

                if is_retryable and attempt < max_retries:
                    import re as _re
                    wait_sec = (2 ** attempt) * 2.0
                    match = _re.search(r"try again in ([0-9.]+)s", err_str)
                    if match:
                        try:
                            parsed_wait = float(match.group(1)) + 1.5
                            wait_sec = max(wait_sec, parsed_wait)
                        except Exception:
                            pass

                    if "413" in err_str or "request too large" in err_str or "message size" in err_str:
                        logger.warning(
                            f"[ModelManager] 413 Request too large for '{agent_name}'. "
                            f"Reducing prompt size and retrying..."
                        )
                        if kwargs.get("messages") and "content" in kwargs["messages"][-1]:
                            old_content = kwargs["messages"][-1]["content"]
                            kwargs["messages"][-1]["content"] = (
                                old_content[:max(500, len(old_content) // 2)]
                                + "\n... [TRUNCATED FOR TOKEN LIMIT]"
                            )

                    logger.warning(
                        f"[ModelManager] Retryable error ({e}) hit for '{agent_name}'. "
                        f"Waiting {wait_sec:.2f}s before retry {attempt+1}/{max_retries}..."
                    )
                    await asyncio.sleep(wait_sec)
                    continue

                # If all retries fail or non-retryable error, don't raise immediately, allow fallback JSON
                logger.error(f"[ModelManager] Error running agent '{agent_name}' after {attempt} retries: {e}")
                break

        latency = round(time.perf_counter() - start_time, 2)
        if response is None:
            # Return structured fallback JSON when rate-limited/errored rather than throwing UnboundLocalError
            fallback_json = "{}"
            if agent_name.lower() == "planner":
                fallback_json = '{"priority_areas": [{"area": "System Wide", "reason": "Rate limited fallback", "risk_level": "Medium"}]}'
            elif agent_name.lower() == "generator":
                fallback_json = '{"test_cases": [{"id": "TC001", "title": "Fallback Smoke Test", "steps": [{"step": 1, "action": "navigate", "selector": "/", "value": null}], "expected_result": "Page loads."}]}'
            return fallback_json, {"agent_name": agent_name, "success": False, "error": "LLM Provider Rate Limited or Unreachable"}
            
        raw_content = response.choices[0].message.content or ""

        # --- Robust JSON extraction (handles markdown fences, trailing text, etc.) ---
        cleaned_content = _extract_json_from_text(raw_content)

        # Enforce JSON validation only if requested
        if response_format == "json":
            try:
                json.loads(cleaned_content)
            except Exception as parse_err:
                preview = cleaned_content[:300].replace("\n", " ")
                logger.warning(
                    f"[ModelManager] Ollama returned invalid JSON for '{agent_name}'. "
                    f"Preview: {preview!r}. Attempting JSON repair..."
                )
                # Try harder to repair it
                repaired = _balance_json_braces(cleaned_content)
                try:
                    json.loads(repaired)
                    cleaned_content = repaired
                except Exception:
                    logger.error(
                        f"[ModelManager] JSON parse failed for agent '{agent_name}' "
                        f"(model={model_name}). Preview: {preview!r}"
                    )
                    raise ValueError(
                        f"Output of agent '{agent_name}' was not valid JSON: {str(parse_err)}"
                    )

        usage = getattr(response, "usage", None)
        input_tokens = getattr(usage, "prompt_tokens", 0) if usage else 0
        output_tokens = getattr(usage, "completion_tokens", 0) if usage else 0

        metadata = {
            "agent_name": agent_name,
            "model_name": model_name,
            "provider": provider,
            "latency": latency,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "success": True
        }

        return cleaned_content, metadata
