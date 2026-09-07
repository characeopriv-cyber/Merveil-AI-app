from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import Any, Dict

app = FastAPI(title='Merveil Machine Connect Intelligence', version='0.1.0')

class AnalysisRequest(BaseModel):
    tenant_id: str
    machine_id: str
    telemetry: Dict[str, Any] = Field(default_factory=dict)

class AnalysisResponse(BaseModel):
    machine_id: str
    status: str
    findings: list[str] = Field(default_factory=list)
    proposed_actions: list[str] = Field(default_factory=list)

@app.get('/health')
def health():
    return {'status': 'ok', 'service': 'intelligence'}

@app.post('/v1/analyze', response_model=AnalysisResponse)
def analyze(request: AnalysisRequest):
    return AnalysisResponse(machine_id=request.machine_id, status='analysis_complete')
