from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Literal
from uuid import uuid4

from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(title="Merveil Physical Intelligence Runtime", version="0.1.0")

EvidenceKind = Literal["image", "video", "audio", "telemetry", "log", "document", "camera", "microphone"]
TaskKind = Literal["identify", "inspect", "diagnose", "predict", "simulate", "repair", "rebuild", "transcribe"]

class Evidence(BaseModel):
    machine_id: str
    kind: EvidenceKind
    uri: str
    metadata: dict[str, Any] = Field(default_factory=dict)

class AnalysisRequest(BaseModel):
    machine_id: str
    task: TaskKind
    evidence: list[Evidence] = Field(default_factory=list)
    context: dict[str, Any] = Field(default_factory=dict)

@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "physical-intelligence"}

@app.post("/v1/analyze")
def analyze(request: AnalysisRequest) -> dict[str, Any]:
    job_id = str(uuid4())
    return {
        "job_id": job_id,
        "machine_id": request.machine_id,
        "task": request.task,
        "status": "queued",
        "received_evidence": len(request.evidence),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "execution": "not_started",
        "note": "Model execution is intentionally behind the provider-neutral orchestration boundary.",
    }
