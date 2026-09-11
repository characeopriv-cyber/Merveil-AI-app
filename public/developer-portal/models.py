"""Model router — Anthropic + OpenAI streaming."""
import os
from typing import Any, AsyncIterator

class ModelRouter:
    def __init__(self):
        self.anthropic_key = os.environ.get("ANTHROPIC_API_KEY")
        self.openai_key = os.environ.get("OPENAI_API_KEY")

    async def complete(self, *, provider: str, model: str, system: str,
                       messages: list[dict], tools: list[dict] | None,
                       temperature: float, max_tokens: int) -> dict:
        if provider == "openai" or (provider == "anthropic" and not self.anthropic_key and self.openai_key):
            return await self._openai(model, system, messages, tools, temperature, max_tokens)
        return await self._anthropic(model, system, messages, tools, temperature, max_tokens)

    async def _anthropic(self, model, system, messages, tools, temperature, max_tokens) -> dict:
        if not self.anthropic_key:
            return self._stub(messages)
        from anthropic import AsyncAnthropic
        client = AsyncAnthropic(api_key=self.anthropic_key)
        kwargs: dict[str, Any] = {
            "model": model or "claude-sonnet-4-5",
            "max_tokens": max_tokens,
            "temperature": temperature,
            "system": system,
            "messages": messages,
        }
        if tools:
            kwargs["tools"] = tools
        msg = await client.messages.create(**kwargs)
        text = ""
        tool_calls = []
        for b in msg.content:
            if getattr(b, "type", None) == "text":
                text += b.text
            elif getattr(b, "type", None) == "tool_use":
                tool_calls.append({"id": b.id, "name": b.name, "input": b.input})
        return {
            "text": text,
            "tool_calls": tool_calls,
            "tokens_in": getattr(msg.usage, "input_tokens", 0) or 0,
            "tokens_out": getattr(msg.usage, "output_tokens", 0) or 0,
            "stop_reason": msg.stop_reason,
            "raw_content": msg.content,
        }

    async def _openai(self, model, system, messages, tools, temperature, max_tokens) -> dict:
        if not self.openai_key:
            return self._stub(messages)
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=self.openai_key)
        oai_msgs = [{"role": "system", "content": system}] + messages
        kwargs: dict[str, Any] = {
            "model": model if model.startswith("gpt") else "gpt-4o-mini",
            "messages": oai_msgs,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if tools:
            kwargs["tools"] = tools
        resp = await client.chat.completions.create(**kwargs)
        choice = resp.choices[0]
        msg = choice.message
        tool_calls = []
        if msg.tool_calls:
            for tc in msg.tool_calls:
                import json
                try:
                    args = json.loads(tc.function.arguments or "{}")
                except Exception:
                    args = {}
                tool_calls.append({"id": tc.id, "name": tc.function.name, "input": args})
        return {
            "text": msg.content or "",
            "tool_calls": tool_calls,
            "tokens_in": getattr(resp.usage, "prompt_tokens", 0) or 0,
            "tokens_out": getattr(resp.usage, "completion_tokens", 0) or 0,
            "stop_reason": choice.finish_reason,
        }

    def _stub(self, messages: list) -> dict:
        last = ""
        for m in reversed(messages):
            if m.get("role") == "user":
                last = str(m.get("content") or "")[:400]
                break
        return {
            "text": f"[sim] Received: {last}\nSet ANTHROPIC_API_KEY or OPENAI_API_KEY for live models.",
            "tool_calls": [],
            "tokens_in": 0,
            "tokens_out": 0,
            "stop_reason": "end_turn",
        }
