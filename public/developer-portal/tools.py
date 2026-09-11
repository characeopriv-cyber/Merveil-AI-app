"""Built-in tools + registry."""
import ast
import operator as op
import re
from datetime import datetime, timezone
from typing import Any
import httpx

# Safe math for calculator
_OPS = {
    ast.Add: op.add, ast.Sub: op.sub, ast.Mult: op.mul, ast.Div: op.truediv,
    ast.Pow: op.pow, ast.USub: op.neg, ast.Mod: op.mod,
}

def _safe_eval(node):
    if isinstance(node, ast.Expression):
        return _safe_eval(node.body)
    if isinstance(node, ast.Constant):
        return node.value
    if isinstance(node, ast.BinOp):
        return _OPS[type(node.op)](_safe_eval(node.left), _safe_eval(node.right))
    if isinstance(node, ast.UnaryOp):
        return _OPS[type(node.op)](_safe_eval(node.operand))
    raise ValueError("unsafe expression")

class ToolRegistry:
    def __init__(self, sb):
        self.sb = sb

    def list_tools(self, enabled_ids: list[str] | None = None) -> list[dict]:
        q = self.sb.table("agent_tools").select("*").eq("is_public", True)
        rows = q.execute().data or []
        if enabled_ids:
            rows = [r for r in rows if r["id"] in enabled_ids or r["name"] in enabled_ids]
        return rows

    def openai_tools(self, tools: list[dict]) -> list[dict]:
        out = []
        for t in tools:
            out.append({
                "type": "function",
                "function": {
                    "name": t["name"],
                    "description": t.get("description") or t["name"],
                    "parameters": t.get("schema") or {"type": "object", "properties": {}},
                },
            })
        return out

    def anthropic_tools(self, tools: list[dict]) -> list[dict]:
        out = []
        for t in tools:
            out.append({
                "name": t["name"],
                "description": t.get("description") or t["name"],
                "input_schema": t.get("schema") or {"type": "object", "properties": {}},
            })
        return out

    async def execute(self, name: str, args: dict, allowed_domains: list[str] | None = None) -> Any:
        if name == "get_time":
            return {"utc": datetime.now(timezone.utc).isoformat()}
        if name == "calculator":
            expr = str(args.get("expression") or "0")
            tree = ast.parse(expr, mode="eval")
            return {"result": _safe_eval(tree)}
        if name == "http_request":
            url = str(args.get("url") or "")
            method = str(args.get("method") or "GET").upper()
            if not url.startswith("http"):
                raise ValueError("invalid_url")
            # SSRF-ish guard
            blocked = ("localhost", "127.0.0.1", "0.0.0.0", "169.254.", "10.", "192.168.")
            if any(b in url for b in blocked):
                raise ValueError("blocked_host")
            if allowed_domains:
                from urllib.parse import urlparse
                host = urlparse(url).hostname or ""
                if not any(host.endswith(d) for d in allowed_domains):
                    raise ValueError("domain_not_allowed")
            async with httpx.AsyncClient(timeout=20, follow_redirects=True) as client:
                r = await client.request(method, url, content=args.get("body"))
                return {"status": r.status_code, "body": r.text[:4000]}
        return {"error": f"unknown_tool:{name}"}
