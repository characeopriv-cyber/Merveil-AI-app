"""Mountable FastAPI routes for multi-agent workflows."""
import os, json, asyncio
from datetime import datetime, timezone
from typing import AsyncIterator
from fastapi import APIRouter, HTTPException, Header
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from supabase import create_client

from graph import WorkflowGraph
from executor import GraphExecutor
from events import EventBus

sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])
AGENT_RUNTIME = os.environ.get("AGENT_RUNTIME_URL", "")

router = APIRouter(prefix="/v1/workflows", tags=["workflows"])

class StartReq(BaseModel):
    workflow_id: str
    input: dict = {}
    stream: bool = True

async def _resolve_user(auth: str | None) -> str | None:
    if not auth:
        return None
    try:
        token = auth.replace("Bearer ", "")
        u = sb.auth.get_user(token)
        return u.user.id if u and u.user else None
    except Exception:
        return None

async def _load_graph(workflow_id: str) -> WorkflowGraph:
    wf = sb.table("workflows").select("*").eq("id", workflow_id).maybe_single().execute().data
    if not wf:
        raise HTTPException(404, "workflow_not_found")
    nodes = sb.table("workflow_nodes").select("*").eq("workflow_id", workflow_id).execute().data or []
    edges = sb.table("workflow_edges").select("*").eq("workflow_id", workflow_id).execute().data or []
    if not nodes:
        raise HTTPException(400, "empty_workflow")
    return WorkflowGraph(workflow=wf, nodes=nodes, edges=edges)

def _finish_run(run_id: str, status: str, output, stats: dict, error: str | None = None):
    sb.table("workflow_runs").update({
        "status": status,
        "output": output,
        "error": error,
        "steps": stats.get("steps", 0),
        "credits_used": stats.get("credits", 0),
        "tokens_in": stats.get("tokens_in", 0),
        "tokens_out": stats.get("tokens_out", 0),
        "finished_at": datetime.now(timezone.utc).isoformat(),
        "duration_ms": stats.get("duration_ms", 0),
    }).eq("id", run_id).execute()

@router.post("/run")
async def run(req: StartReq, authorization: str = Header(default="")):
    user_id = await _resolve_user(authorization)
    graph = await _load_graph(req.workflow_id)
    run = sb.table("workflow_runs").insert({
        "workflow_id": req.workflow_id,
        "triggered_by": user_id,
        "trigger": "user",
        "status": "running",
        "input": req.input,
        "blackboard": {},
    }).select().single().execute().data
    executor = GraphExecutor(sb=sb, run_id=run["id"], runtime_url=AGENT_RUNTIME)
    try:
        result = await executor.execute(graph, req.input)
        _finish_run(run["id"], "succeeded", result, executor.stats())
        return {"run_id": run["id"], "output": result, **executor.stats()}
    except Exception as e:
        _finish_run(run["id"], "failed", None, executor.stats(), error=str(e))
        raise HTTPException(500, str(e))

@router.post("/stream")
async def stream(req: StartReq, authorization: str = Header(default="")):
    user_id = await _resolve_user(authorization)

    async def gen():
        graph = await _load_graph(req.workflow_id)
        run = sb.table("workflow_runs").insert({
            "workflow_id": req.workflow_id,
            "triggered_by": user_id,
            "trigger": "user",
            "status": "running",
            "input": req.input,
            "blackboard": {},
        }).select().single().execute().data
        yield f"data: {json.dumps({'type':'run','run_id':run['id'],'workflow_id':req.workflow_id})}\n\n"
        bus = EventBus(run["id"])
        executor = GraphExecutor(sb=sb, run_id=run["id"], runtime_url=AGENT_RUNTIME, bus=bus)
        task = asyncio.create_task(executor.execute(graph, req.input))
        async def pump():
            async for ev in bus.consume():
                yield ev
        # interleave: run executor, emit events
        async def run_and_close():
            try:
                result = await task
                _finish_run(run["id"], "succeeded", result, executor.stats())
                await bus.emit({"type": "final", "output": result, **executor.stats()})
            except Exception as e:
                _finish_run(run["id"], "failed", None, executor.stats(), error=str(e))
                await bus.emit({"type": "error", "error": str(e)})
            finally:
                bus.close()
        asyncio.create_task(run_and_close())
        async for ev in bus.consume():
            yield f"data: {json.dumps(ev)}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(gen(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})
