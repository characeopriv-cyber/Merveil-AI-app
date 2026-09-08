from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from pulse_edge import OfflineStore, telemetry_fingerprint

app = FastAPI(title="PULSE Edge", version="0.1.0")
store = OfflineStore(os.getenv("PULSE_DB_PATH", "/data/pulse-edge.db"))


class Telemetry(BaseModel):
    machine_id: str = Field(min_length=1, max_length=200)
    sequence: int | None = None
    observed_at: str | None = None
    source: str = Field(default="edge", max_length=100)
    data: dict[str, Any] = Field(default_factory=dict)


@app.get("/health")
def health() -> dict[str, Any]:
    return {"status": "ok", "mode": os.getenv("PULSE_MODE", "offline"), "pending": len(store.pending())}


@app.post("/telemetry")
def ingest(item: Telemetry) -> dict[str, Any]:
    observed = item.observed_at or datetime.now(timezone.utc).isoformat()
    record = {"machine_id": item.machine_id, "sequence": item.sequence, "observed_at": observed, "source": item.source, "data": item.data}
    record["fingerprint"] = telemetry_fingerprint(item.machine_id, item.sequence, observed)
    store.enqueue("telemetry", record)
    store.audit("telemetry.accepted", {"machine_id": item.machine_id, "fingerprint": record["fingerprint"]})
    return {"accepted": True, "fingerprint": record["fingerprint"]}


@app.get("/sync/pending")
def pending() -> dict[str, Any]:
    return {"records": store.pending()}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PULSE_EDGE_PORT", "5000")))
