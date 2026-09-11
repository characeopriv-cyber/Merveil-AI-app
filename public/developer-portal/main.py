"""Merveil Agent Runtime — invoke + stream."""
import os, json, time, logging
from datetime import datetime, timezone
from typing import Optional, Any
from fastapi import FastAPI, HTTPException, Header
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client

from spec import AgentSpec
from tools import ToolRegistry
from models import ModelRouter
from loop import AgentLoop

log = logging.getLogger("merveil.runtime")
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))

sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])
tools = ToolRegistry(sb)
models = ModelRouter()

app = FastAPI(title="Merveil Agent Runtime", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

class InvokeRequest(BaseModel):
    agent_id: str
    session_id: Optional[str] = None
    message: str
    variables: dict = {}
    stream: bool = False
    channel: str = "api"

async def _resolve_user(auth: str | None) -> str | None:
    if not auth:
        return None
    try:
        u = sb.auth.get_user(auth.replace("Bearer ", ""))
        return u.user.id if u and u.user else None
    except Exception:
        return None

async def _load_spec(agent_id: str) -> tuple[dict, AgentSpec]:
    a = sb.table("agents").select("*").eq("id", agent_id).maybe_single().execute().data
    if not a:
        raise HTTPException(404, "agent_not_found")
    v = None
    if a.get("current_version_id"):
        v = sb.table("agent_versions").select("*").eq("id", a["current_version_id"]).maybe_single().execute().data
    if not v:
        vs = sb.table("agent_versions").select("*").eq("agent_id", agent_id).order("version", desc=True).limit(1).execute().data
        v = (vs or [None])[0]
    if not v:
        # default spec for draft without version
        return a, AgentSpec(name=a.get("name") or "Agent")
    return a, AgentSpec.model_validate(v["spec"])

async def _session(agent_id: str, session_id: str | None, user_id: str | None, variables: dict) -> dict:
    if session_id:
        r = sb.table("agent_sessions").select("*").eq("id", session_id).maybe_single().execute().data
        if r:
            return r
    return sb.table("agent_sessions").insert({
        "agent_id": agent_id,
        "user_id": user_id,
        "variables": variables or {},
        "status": "active",
    }).select().single().execute().data

@app.get("/healthz")
def healthz():
    return {"ok": True, "ts": datetime.now(timezone.utc).isoformat()}

@app.post("/v1/agents/invoke")
@app.post("/v1/agents/run")
async def invoke(req: InvokeRequest, authorization: str = Header(default="")):
    user_id = await _resolve_user(authorization)
    agent, spec = await _load_spec(req.agent_id)
    session = await _session(req.agent_id, req.session_id, user_id, req.variables)

    run = sb.table("agent_runs").insert({
        "session_id": session["id"],
        "agent_id": req.agent_id,
        "triggered_by": user_id,
        "trigger": "user",
        "status": "running",
        "input": {"message": req.message},
    }).select().single().execute().data

    # history
    hist = sb.table("agent_messages").select("role,content,tool_call_id,name") \
        .eq("session_id", session["id"]).order("created_at").limit(40).execute().data or []

    sb.table("agent_messages").insert({
        "session_id": session["id"], "role": "user", "content": req.message,
    }).execute()

    loop = AgentLoop(sb=sb, spec=spec, tools=tools, models=models,
                     run_id=run["id"], session_id=session["id"], agent_id=req.agent_id)
    try:
        result = await loop.run(req.message, hist, {**(session.get("variables") or {}), **(req.variables or {})})
        sb.table("agent_messages").insert({
            "session_id": session["id"], "role": "assistant", "content": result["text"],
            "tokens_in": result["tokens_in"], "tokens_out": result["tokens_out"],
            "credits_used": result["credits_used"],
        }).execute()
        sb.table("agent_runs").update({
            "status": "succeeded",
            "output": {"text": result["text"]},
            "steps": result["steps"],
            "credits_used": result["credits_used"],
            "tokens_in": result["tokens_in"],
            "tokens_out": result["tokens_out"],
            "duration_ms": result["duration_ms"],
            "finished_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", run["id"]).execute()
        # credit deduct if available
        if user_id and result["credits_used"]:
            try:
                sb.rpc("apply_credit_delta", {
                    "p_user_id": user_id,
                    "p_delta": -int(result["credits_used"]),
                    "p_reason": "assist",
                    "p_ref": run["id"],
                }).execute()
            except Exception:
                pass
        return {
            "run_id": run["id"],
            "session_id": session["id"],
            "output": result["text"],
            "steps": result["steps"],
            "credits_used": result["credits_used"],
            "duration_ms": result["duration_ms"],
        }
    except Exception as e:
        sb.table("agent_runs").update({
            "status": "failed", "error": str(e)[:500],
            "finished_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", run["id"]).execute()
        raise HTTPException(500, str(e))

@app.post("/v1/agents/stream")
async def stream(req: InvokeRequest, authorization: str = Header(default="")):
    # Non-token streaming: emit run lifecycle events then final (token streaming can be added later)
    async def gen():
        try:
            # reuse invoke path
            user_id = await _resolve_user(authorization)
            # call internal
            from fastapi import Request
            result = await invoke(req, authorization)
            yield f"data: {json.dumps({'type':'final', **result})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type':'error','error':str(e)})}\n\n"
        yield "data: [DONE]\n\n"
    return StreamingResponse(gen(), media_type="text/event-stream",
                             headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})

@app.get("/v1/agents/{agent_id}/runs")
async def list_runs(agent_id: str, authorization: str = Header(default="")):
    await _resolve_user(authorization)
    rows = sb.table("agent_runs").select("*").eq("agent_id", agent_id).order("started_at", desc=True).limit(40).execute().data
    return {"runs": rows or []}
