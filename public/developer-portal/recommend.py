"""Merveil AI — Live recommendation engine during builds."""
import os, json
from anthropic import AsyncAnthropic
from supabase import create_client

sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])
claude = AsyncAnthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

REC_SYSTEM = """You are Merveil AI, advising a developer DURING a build.
Given the project kind, sector, template, and brief, output STRICT JSON:
{
  "recommendations": [
    {"kind": "content|page|seo|a11y|monetization|tone|risk",
     "title": "...",
     "why": "...",
     "action": "...",
     "confidence": 0.0-1.0,
     "tier": "free|pro|studio"}
  ]
}
Return 5-9 recommendations, prioritised by impact. Be specific and short.
"""

async def recommend_during_build(project_id: str, kind: str, sector: dict, template: dict, brief: dict):
    user = f"""KIND: {kind}
SECTOR: {sector.get('label')}
TEMPLATE: {template.get('name')}
BRIEF: {json.dumps(brief)}"""
    msg = await claude.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=1200,
        system=REC_SYSTEM,
        messages=[{"role": "user", "content": user}],
    )
    text = msg.content[0].text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"): text = text[4:]
    data = json.loads(text.strip())
    rows = [{
        "project_id": project_id,
        "kind": r.get("kind", "insight"),
        "payload": r,
        "confidence": r.get("confidence", 0.6),
    } for r in data.get("recommendations", [])]
    if rows:
        sb.table("project_insights").insert(rows).execute()
