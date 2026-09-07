"""Merveil Machine Connect API foundation.

Physical commands are deliberately fail-closed: this service only issues a command
when identity, capability, authorization and safety checks all pass. Integrate the
actual MQTT/device gateway in production; this starter never pretends to move a
real machine.
"""
from datetime import datetime, timezone
from enum import Enum
from typing import Any
from uuid import UUID, uuid4

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="Merveil Machine Connect API", version="0.1.0")


class MachineState(str, Enum):
    ONLINE = "ONLINE"
    OFFLINE = "OFFLINE"
    CONNECTING = "CONNECTING"
    IDLE = "IDLE"
    ACTIVE = "ACTIVE"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"
    MAINTENANCE = "MAINTENANCE"
    LOCKED = "LOCKED"
    EMERGENCY_STOP = "EMERGENCY_STOP"


class Machine(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    machine_identity: str
    name: str
    machine_type: str
    state: MachineState = MachineState.OFFLINE
    capabilities: list[str] = []
    owner_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class CommandRequest(BaseModel):
    action: str
    parameters: dict[str, Any] = {}
    requested_by: str
    actor_role: str


machines: dict[UUID, Machine] = {}


@app.get("/health")
def health():
    return {"status": "ok", "service": "machine-connect", "timestamp": datetime.now(timezone.utc)}


@app.get("/api/v1/machines", response_model=list[Machine])
def list_machines():
    return list(machines.values())


@app.post("/api/v1/machines", response_model=Machine, status_code=201)
def register_machine(machine: Machine):
    if any(m.machine_identity == machine.machine_identity for m in machines.values()):
        raise HTTPException(status_code=409, detail="machine_identity already registered")
    machines[machine.id] = machine
    return machine


@app.get("/api/v1/machines/{machine_id}", response_model=Machine)
def get_machine(machine_id: UUID):
    machine = machines.get(machine_id)
    if not machine:
        raise HTTPException(status_code=404, detail="machine not found")
    return machine


@app.post("/api/v1/machines/{machine_id}/commands")
def request_command(machine_id: UUID, request: CommandRequest):
    machine = machines.get(machine_id)
    if not machine:
        raise HTTPException(status_code=404, detail="machine not found")
    if machine.state in {MachineState.OFFLINE, MachineState.LOCKED, MachineState.EMERGENCY_STOP, MachineState.CRITICAL}:
        raise HTTPException(status_code=409, detail="command rejected by machine safety state")
    if request.actor_role not in {"Owner", "Operator", "Developer", "AI Agent", "Emergency Authority"}:
        raise HTTPException(status_code=403, detail="actor role not authorized")
    if request.action not in machine.capabilities:
        raise HTTPException(status_code=403, detail="machine capability does not permit this action")

    # Production adapter must perform the final device-side authorization and safety check.
    return {
        "command_id": str(uuid4()),
        "status": "AUTHORIZED_FOR_GATEWAY",
        "machine_id": str(machine_id),
        "action": request.action,
        "audit": {"requested_by": request.requested_by, "timestamp": datetime.now(timezone.utc).isoformat()},
        "next": "device_gateway",
    }


@app.post("/api/v1/machines/{machine_id}/emergency-stop")
def emergency_stop(machine_id: UUID, requested_by: str):
    machine = machines.get(machine_id)
    if not machine:
        raise HTTPException(status_code=404, detail="machine not found")
    machine.state = MachineState.EMERGENCY_STOP
    return {"status": "EMERGENCY_STOP", "machine_id": str(machine_id), "requested_by": requested_by}
