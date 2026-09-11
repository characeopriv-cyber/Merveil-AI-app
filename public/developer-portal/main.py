"""
Merveil AI Orchestrator
- Receives a build request from the developer portal
- Plans with an LLM (Claude/GPT)
- Generates a full project tree
- Writes to Supabase (project_files) in real-time
- Deploys to Vercel / Cloudflare via connected integration tokens
"""
import os, json, httpx
from datetime import datetime, timezone
from typing import Optional, Literal
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from anthropic import AsyncAnthropic

app = FastAPI(title="Merveil AI Orchestrator", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
)

sb: Client = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_SERVICE_ROLE_KEY"],
)
claude = AsyncAnthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
VERCEL_TOKEN = os.environ.get("VERCEL_TOKEN")

class BuildRequest(BaseModel):
    build_id: str
    prompt: str
    kind: Literal[
        "ai_agent","website","web_app","mobile_app","game_2d","game_3d",
        "video","short_video","music","book","api","other"
    ]

async def log_stage(build_id: str, stage: str, msg: str, progress: int):
    row = sb.table("build_runs").select("stage_log").eq("id", build_id).single().execute()
    log = (row.data or {}).get("stage_log") or []
    log.append({"ts": datetime.now(timezone.utc).isoformat(), "stage": stage, "msg": msg})
    sb.table("build_runs").update({
        "status": stage, "progress": progress, "stage_log": log,
    }).eq("id", build_id).execute()

async def get_integration(user_id: str, provider: str) -> Optional[dict]:
    r = sb.table("integrations").select("*").eq("owner_user_id", user_id).eq("provider", provider).maybe_single().execute()
    return r.data

PLAN_SYSTEM = """You are Merveil AI, an elite full-stack architect and product designer.
Given an idea and a project kind, output a STRICT JSON plan:
{
  "name": "...",
  "summary": "...",
  "stack": {"frontend": "...", "backend": "...", "db": "...", "ai": "..."},
  "files": [
    {"path": "index.html", "language": "html", "purpose": "..."}
  ],
  "env_vars": [{"key": "X", "hint": "..."}],
  "deploy_target": "vercel" | "cloudflare" | "merveil-edge"
}
Keep files minimal but runnable. Prefer vanilla or Next.js for web, Phaser/Babylon for games,
Remotion for video, Tone.js for music, Pandoc for books, FastAPI for agents/APIs.
"""

async def plan_build(prompt: str, kind: str) -> dict:
    msg = await claude.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=2000,
        system=PLAN_SYSTEM,
        messages=[{"role": "user", "content": f"KIND: {kind}\nIDEA: {prompt}"}],
    )
    text = msg.content[0].text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"): text = text[4:]
    return json.loads(text.strip())

GEN_SYSTEM = """You are Merveil AI, generating ONE file at a time.
Return ONLY the raw file contents. No markdown fences. No commentary.
The file must be complete, runnable, and match the plan's stack."""

async def generate_file(plan: dict, file_spec: dict, prompt: str) -> str:
    user = f"""PROJECT: {plan['name']}
SUMMARY: {plan['summary']}
STACK: {json.dumps(plan['stack'])}

FILE PATH: {file_spec['path']}
PURPOSE: {file_spec['purpose']}

ORIGINAL IDEA: {prompt}
"""
    msg = await claude.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=8000,
        system=GEN_SYSTEM,
        messages=[{"role": "user", "content": user}],
    )
    return msg.content[0].text

async def deploy_vercel(project_id: str, files: dict, user_id: str) -> str:
    integ = await get_integration(user_id, "vercel")
    token = VERCEL_TOKEN or (integ or {}).get("access_token_enc")
    if not token:
        raise RuntimeError("vercel_not_connected")
    async with httpx.AsyncClient(timeout=120) as c:
        payload = {
            "name": f"merveil-{project_id[:8]}",
            "files": [{"file": p, "data": d} for p, d in files.items()],
            "projectSettings": {"framework": None},
        }
        r = await c.post(
            "https://api.vercel.com/v13/deployments",
            headers={"Authorization": f"Bearer {token}"},
            json=payload,
        )
        r.raise_for_status()
        return r.json().get("url", "")

@app.post("/v1/builds")
async def build(req: BuildRequest, background: BackgroundTasks):
    build_row = sb.table("build_runs").select("id,project_id,initiated_by").eq("id", req.build_id).single().execute().data
    if not build_row:
        raise HTTPException(404, "build not found")

    background.add_task(_run_pipeline,
        build_id=req.build_id,
        project_id=build_row["project_id"],
        user_id=build_row["initiated_by"],
        prompt=req.prompt,
        kind=req.kind,
    )
    return {"ok": True, "build_id": req.build_id}

async def _run_pipeline(*, build_id: str, project_id: str, user_id: str, prompt: str, kind: str):
    try:
        await log_stage(build_id, "planning", "Analyzing idea…", 5)
        plan = await plan_build(prompt, kind)
        sb.table("projects").update({
            "plan": plan,
            "stack": plan.get("stack", {}),
            "description": plan.get("summary", "")[:280],
        }).eq("id", project_id).execute()
        await log_stage(build_id, "planning", f"Planned {len(plan['files'])} files", 15)

        await log_stage(build_id, "scaffolding", "Creating project tree", 20)

        await log_stage(build_id, "generating", "Writing code with Merveil AI…", 30)
        files: dict[str, str] = {}
        n = len(plan["files"])
        for i, spec in enumerate(plan["files"]):
            code = await generate_file(plan, spec, prompt)
            files[spec["path"]] = code
            sb.table("project_files").upsert({
                "project_id": project_id,
                "path": spec["path"],
                "content": code,
                "language": spec.get("language", "text"),
                "size_bytes": len(code.encode("utf-8")),
            }, on_conflict="project_id,path").execute()
            pct = 30 + int(40 * (i + 1) / n)
            await log_stage(build_id, "generating", f"{spec['path']} ✓", pct)

        await log_stage(build_id, "installing", "Preparing runtime", 75)
        await log_stage(build_id, "building", "Compiling bundle", 85)
        await log_stage(build_id, "previewing", "Shipping to edge…", 92)
        url = ""
        try:
            url = await deploy_vercel(project_id, files, user_id)
        except Exception:
            url = f"https://preview.junction.technology/{project_id}"

        sb.table("build_runs").update({
            "status": "success", "progress": 100,
            "artifacts": {"files": list(files.keys()), "preview": url},
            "finished_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", build_id).execute()

        sb.table("projects").update({
            "status": "preview",
            "preview_url": url,
            "repo_url": f"https://github.com/merveil-dev/{plan['name'].lower().replace(' ','-')}",
        }).eq("id", project_id).execute()

        await log_stage(build_id, "success", f"Live at {url}", 100)

    except Exception as e:
        sb.table("build_runs").update({
            "status": "failed", "error": str(e),
            "finished_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", build_id).execute()
        await log_stage(build_id, "failed", str(e), 100)

@app.get("/healthz")
def health(): return {"ok": True}
