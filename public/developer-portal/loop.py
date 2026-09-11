"""Agent loop with tools, guardrails, tracing."""
import json, time
from datetime import datetime, timezone
from typing import Any, AsyncIterator
from jinja2 import Template

from spec import AgentSpec
from tools import ToolRegistry
from models import ModelRouter

class AgentLoop:
    def __init__(self, *, sb, spec: AgentSpec, tools: ToolRegistry, models: ModelRouter,
                 run_id: str, session_id: str, agent_id: str):
        self.sb = sb
        self.spec = spec
        self.tools = tools
        self.models = models
        self.run_id = run_id
        self.session_id = session_id
        self.agent_id = agent_id
        self.step = 0
        self.credits = 0
        self.tokens_in = 0
        self.tokens_out = 0
        self.t0 = time.time()

    async def run(self, message: str, history: list[dict], variables: dict) -> dict:
        system = Template(self.spec.prompt.system).render(**(variables or {}))
        messages = list(history[-self.spec.memory.short_term.get("window", 20):])
        messages.append({"role": "user", "content": message})

        tool_rows = self.tools.list_tools([t.get("tool_id") for t in self.spec.tools] or None)
        # if no tools selected, still expose builtins
        if not tool_rows:
            tool_rows = self.tools.list_tools(None)

        final_text = ""
        for _ in range(self.spec.guardrails.max_steps):
            if time.time() - self.t0 > self.spec.guardrails.max_seconds:
                await self._trace("guardrail", {"reason": "timeout"})
                break
            if self.credits >= self.spec.guardrails.max_credits:
                await self._trace("guardrail", {"reason": "max_credits"})
                break

            self.step += 1
            provider = self.spec.model.provider
            if provider == "anthropic":
                tool_defs = self.tools.anthropic_tools(tool_rows)
                # anthropic message format
                a_msgs = []
                for m in messages:
                    if m["role"] in ("user", "assistant"):
                        a_msgs.append({"role": m["role"], "content": m["content"]})
                    elif m["role"] == "tool":
                        a_msgs.append({
                            "role": "user",
                            "content": [{
                                "type": "tool_result",
                                "tool_use_id": m.get("tool_call_id"),
                                "content": str(m.get("content") or ""),
                            }],
                        })
                result = await self.models.complete(
                    provider="anthropic", model=self.spec.model.name, system=system,
                    messages=a_msgs or [{"role": "user", "content": message}],
                    tools=tool_defs or None,
                    temperature=self.spec.model.temperature,
                    max_tokens=self.spec.model.max_tokens,
                )
            else:
                tool_defs = self.tools.openai_tools(tool_rows)
                o_msgs = []
                for m in messages:
                    if m["role"] == "tool":
                        o_msgs.append({
                            "role": "tool",
                            "tool_call_id": m.get("tool_call_id"),
                            "content": str(m.get("content") or ""),
                        })
                    else:
                        o_msgs.append({"role": m["role"], "content": m.get("content") or ""})
                result = await self.models.complete(
                    provider="openai", model=self.spec.model.name, system=system,
                    messages=o_msgs, tools=tool_defs or None,
                    temperature=self.spec.model.temperature,
                    max_tokens=self.spec.model.max_tokens,
                )

            self.tokens_in += result.get("tokens_in") or 0
            self.tokens_out += result.get("tokens_out") or 0
            self.credits += 1
            await self._trace("llm_call", {
                "model": self.spec.model.name,
                "text_preview": (result.get("text") or "")[:200],
                "tool_calls": result.get("tool_calls"),
            }, tokens_in=result.get("tokens_in"), tokens_out=result.get("tokens_out"), credits=1)

            tcs = result.get("tool_calls") or []
            if not tcs:
                final_text = result.get("text") or ""
                messages.append({"role": "assistant", "content": final_text})
                break

            # append assistant tool-use then execute tools
            messages.append({"role": "assistant", "content": result.get("text") or ""})
            for tc in tcs:
                await self._trace("tool_call", {"name": tc["name"], "input": tc.get("input")}, tool_name=tc["name"], credits=1)
                try:
                    out = await self.tools.execute(
                        tc["name"], tc.get("input") or {},
                        allowed_domains=self.spec.guardrails.allowed_domains or None,
                    )
                    self.credits += 1
                except Exception as e:
                    out = {"error": str(e)}
                await self._trace("tool_result", {"name": tc["name"], "output": out}, tool_name=tc["name"])
                messages.append({
                    "role": "tool",
                    "tool_call_id": tc.get("id"),
                    "name": tc["name"],
                    "content": json.dumps(out)[:4000],
                })
            final_text = result.get("text") or final_text

        return {
            "text": final_text,
            "steps": self.step,
            "credits_used": self.credits,
            "tokens_in": self.tokens_in,
            "tokens_out": self.tokens_out,
            "duration_ms": int((time.time() - self.t0) * 1000),
            "messages": messages,
        }

    async def _trace(self, kind: str, payload: dict, tool_name: str | None = None,
                     tokens_in=0, tokens_out=0, credits=0):
        try:
            self.sb.table("agent_traces").insert({
                "run_id": self.run_id,
                "step": self.step,
                "kind": kind,
                "model": self.spec.model.name if kind == "llm_call" else None,
                "tool_name": tool_name,
                "input": payload if kind in ("tool_call", "llm_call") else None,
                "output": payload if kind == "tool_result" else payload,
                "tokens_in": tokens_in or 0,
                "tokens_out": tokens_out or 0,
                "credits": credits or 0,
            }).execute()
        except Exception:
            pass
