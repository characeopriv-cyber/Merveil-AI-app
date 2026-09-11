"""GraphExecutor — DAG runner with parallel branches, conditions, blackboard."""
import asyncio, time, json
from datetime import datetime, timezone
from typing import Any
from jinja2 import Template
import httpx
from graph import WorkflowGraph
from events import EventBus

MAX_PARALLEL = 6
DEFAULT_NODE_TIMEOUT = 120

class GraphExecutor:
    def __init__(self, *, sb, run_id: str, runtime_url: str | None = None, bus: EventBus | None = None):
        self.sb = sb
        self.run_id = run_id
        self.runtime_url = runtime_url or ""
        self.bus = bus or EventBus(run_id)
        self.node_states: dict[str, str] = {}
        self.node_outputs: dict[str, Any] = {}
        self.node_credits = 0
        self.node_tokens_in = 0
        self.node_tokens_out = 0
        self.steps = 0
        self.t0 = time.time()
        self.blackboard: dict[str, Any] = {}
        self.graph: WorkflowGraph | None = None
        self._skipped: set[str] = set()

    def stats(self) -> dict:
        return {
            "steps": self.steps,
            "credits": self.node_credits,
            "tokens_in": self.node_tokens_in,
            "tokens_out": self.node_tokens_out,
            "duration_ms": int((time.time() - self.t0) * 1000),
        }

    async def execute(self, graph: WorkflowGraph, input_data: dict) -> Any:
        self.graph = graph
        row = self.sb.table("workflow_runs").select("blackboard").eq("id", self.run_id).single().execute()
        self.blackboard = (row.data or {}).get("blackboard") or {}
        self.blackboard["input"] = input_data

        for nid in graph.nodes:
            self.node_states[nid] = "queued"

        await self._run_node(graph.entry, input_data)

        # Drain remaining ready nodes (handles parallel after split)
        while True:
            ready = self._ready_nodes()
            if not ready:
                break
            await asyncio.gather(*(self._run_node(n, None) for n in ready[:MAX_PARALLEL]))

        # Collect outputs from exit nodes
        outputs = {}
        for eid in graph.exits:
            if eid in self.node_outputs:
                outputs[graph.node(eid)["label"]] = self.node_outputs[eid]
        return outputs or self.blackboard.get("output") or self.blackboard

    def _ready_nodes(self) -> list[str]:
        ready = []
        for nid, st in self.node_states.items():
            if st != "queued" or nid in self._skipped:
                continue
            preds = self.graph.predecessors(nid)
            if not preds:
                continue
            if all(self.node_states.get(p) in ("succeeded", "skipped") for p in preds):
                # skip if all preds were skipped via other branch
                if all(p in self._skipped for p in preds) and preds:
                    self.node_states[nid] = "skipped"
                    self._skipped.add(nid)
                    continue
                ready.append(nid)
        return ready

    async def _run_node(self, node_id: str, forced_input: Any):
        if self.node_states.get(node_id) not in ("queued", None):
            return
        node = self.graph.node(node_id)
        self.node_states[node_id] = "running"
        self.steps += 1
        await self.bus.emit({
            "type": "node_start", "node_id": node_id,
            "kind": node["kind"], "label": node["label"],
        })

        t0 = time.time()
        nr = self.sb.table("node_runs").insert({
            "workflow_run_id": self.run_id,
            "node_id": node_id,
            "status": "running",
            "input": forced_input if forced_input is not None else {"blackboard_keys": list(self.blackboard.keys())},
        }).select().single().execute().data

        try:
            out = await asyncio.wait_for(
                self._dispatch(node, forced_input),
                timeout=DEFAULT_NODE_TIMEOUT,
            )
            self.node_outputs[node_id] = out
            self.node_states[node_id] = "succeeded"
            self.sb.table("node_runs").update({
                "status": "succeeded",
                "output": out if isinstance(out, (dict, list, str, int, float, type(None))) else str(out),
                "finished_at": datetime.now(timezone.utc).isoformat(),
                "duration_ms": int((time.time() - t0) * 1000),
            }).eq("id", nr["id"]).execute()
            await self.bus.emit({
                "type": "node_end", "node_id": node_id, "status": "succeeded",
                "output_preview": str(out)[:200],
            })
            await self._fanout(node_id, out)
        except Exception as e:
            self.node_states[node_id] = "failed"
            self.sb.table("node_runs").update({
                "status": "failed", "error": str(e)[:500],
                "finished_at": datetime.now(timezone.utc).isoformat(),
            }).eq("id", nr["id"]).execute()
            await self.bus.emit({"type": "node_end", "node_id": node_id, "status": "failed", "error": str(e)})
            raise

    async def _dispatch(self, node: dict, forced_input: Any) -> Any:
        kind = node["kind"]
        cfg = node.get("config") or {}
        if kind == "input":
            return self.blackboard.get("input") or forced_input or {}
        if kind == "output":
            val = self._render(cfg.get("value_template") or "{{ input }}")
            self.blackboard["output"] = val
            return val
        if kind == "delay":
            await asyncio.sleep(float(cfg.get("seconds") or 1))
            return {"delayed": cfg.get("seconds") or 1}
        if kind == "memory_write":
            key = cfg.get("key") or "mem"
            val = self._render(cfg.get("value_template") or "")
            self.blackboard[key] = val
            try:
                self.sb.rpc("bb_write", {
                    "p_run": self.run_id, "p_node": node["id"],
                    "p_key": key, "p_value": val if isinstance(val, (dict, list)) else json.loads(json.dumps(val)),
                }).execute()
            except Exception:
                pass
            return {key: val}
        if kind == "memory_read":
            key = cfg.get("key") or "mem"
            return self.blackboard.get(key)
        if kind == "condition":
            expr = cfg.get("expr") or "True"
            taken = self._eval_expr(expr)
            return {"branch": "true" if taken else "false", "expr": expr}
        if kind == "router":
            path = cfg.get("value_path") or ""
            val = self._path(path)
            cases = cfg.get("cases") or []
            for i, c in enumerate(cases):
                if str(c.get("when")) == str(val) or c.get("when") == "*":
                    return {"case": i, "port": f"case:{i}", "value": val}
            return {"case": "default", "port": "default", "value": val}
        if kind in ("parallel_split", "parallel_join"):
            return {"ok": True, "kind": kind}
        if kind == "human_handoff":
            reason = self._render(cfg.get("reason") or "Need human input")
            self.sb.table("handoffs").insert({
                "workflow_run_id": self.run_id,
                "from_node_id": node["id"],
                "kind": "agent_to_human",
                "reason": reason,
                "context": {"blackboard": self.blackboard},
                "status": "pending",
            }).execute()
            self.sb.table("workflow_runs").update({"status": "waiting_human"}).eq("id", self.run_id).execute()
            await self.bus.emit({"type": "handoff", "reason": reason})
            return {"status": "waiting_human", "reason": reason}
        if kind == "agent":
            return await self._run_agent(node, cfg)
        if kind == "tool":
            return await self._run_tool(node, cfg)
        if kind == "sub_workflow":
            return {"note": "sub_workflow not expanded in this runner", "workflow_id": cfg.get("workflow_id")}
        return {"kind": kind, "echo": forced_input}

    async def _run_agent(self, node: dict, cfg: dict) -> Any:
        prompt = self._render(cfg.get("prompt_template") or "{{ input }}")
        if self.runtime_url:
            try:
                async with httpx.AsyncClient(timeout=60) as client:
                    r = await client.post(
                        f"{self.runtime_url.rstrip('/')}/v1/agents/run",
                        json={"agent_id": cfg.get("agent_id"), "message": prompt, "blackboard": self.blackboard},
                    )
                    data = r.json()
                    self.node_tokens_in += int(data.get("tokens_in") or 0)
                    self.node_tokens_out += int(data.get("tokens_out") or 0)
                    self.node_credits += int(data.get("credits") or 1)
                    out = data.get("output") or data
                    var = cfg.get("output_var")
                    if var:
                        self.blackboard[var] = out
                    await self.bus.emit({"type": "agent_result", "run_id": data.get("run_id")})
                    return out
            except Exception as e:
                return {"error": str(e), "prompt": prompt[:200]}
        # Local fallback
        out = {"agent": cfg.get("agent_id") or "local", "reply": f"[sim] processed: {str(prompt)[:300]}"}
        var = cfg.get("output_var")
        if var:
            self.blackboard[var] = out
        self.node_credits += 1
        return out

    async def _run_tool(self, node: dict, cfg: dict) -> Any:
        name = cfg.get("tool_name") or "echo"
        args = cfg.get("args") or {}
        rendered = {k: self._render(str(v)) if isinstance(v, str) else v for k, v in args.items()}
        return {"tool": name, "args": rendered, "result": "ok"}

    async def _fanout(self, node_id: str, out: Any):
        node = self.graph.node(node_id)
        kind = node["kind"]
        if kind == "condition":
            port = (out or {}).get("branch") or "false"
            edges = self.graph.outgoing(node_id, port)
            # skip other branch targets
            other = self.graph.outgoing(node_id, "true" if port == "false" else "false")
            for e in other:
                self._skip_branch(e["to_node"])
        elif kind == "router":
            port = (out or {}).get("port") or "default"
            edges = self.graph.outgoing(node_id, port) or self.graph.outgoing(node_id, "default") or self.graph.outgoing(node_id)
        else:
            edges = self.graph.outgoing(node_id)

        for e in edges:
            tid = e["to_node"]
            if self.node_states.get(tid) == "queued":
                # will be picked by ready queue or run if no other preds pending
                if all(self.node_states.get(p) in ("succeeded", "skipped") for p in self.graph.predecessors(tid)):
                    await self._run_node(tid, out)

    def _skip_branch(self, node_id: str):
        if node_id in self._skipped:
            return
        self._skipped.add(node_id)
        self.node_states[node_id] = "skipped"
        for e in self.graph.outgoing(node_id):
            # only skip if all preds skipped/failed path
            preds = self.graph.predecessors(e["to_node"])
            if all(self.node_states.get(p) in ("skipped", "failed") for p in preds):
                self._skip_branch(e["to_node"])

    def _render(self, tmpl: str) -> Any:
        if not isinstance(tmpl, str):
            return tmpl
        try:
            return Template(tmpl).render(**self._flat_bb())
        except Exception:
            return tmpl

    def _flat_bb(self) -> dict:
        flat = {"input": self.blackboard.get("input")}
        for k, v in self.blackboard.items():
            flat[k] = v
        return flat

    def _path(self, path: str) -> Any:
        if not path:
            return None
        cur: Any = self.blackboard
        for part in path.split("."):
            if isinstance(cur, dict):
                cur = cur.get(part)
            else:
                return None
        return cur

    def _eval_expr(self, expr: str) -> bool:
        # Very small safe eval: equality / truthiness on blackboard keys
        try:
            ctx = self._flat_bb()
            # support: key == 'value'
            if "==" in expr:
                left, right = [x.strip().strip("'\"") for x in expr.split("==", 1)]
                lv = ctx.get(left, self._path(left))
                return str(lv) == right
            v = ctx.get(expr) if expr in ctx else self._path(expr)
            return bool(v)
        except Exception:
            return False
