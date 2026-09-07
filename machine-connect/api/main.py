"""Merveil Machine Connect API foundation.

Physical commands are deliberately fail-closed: this service only issues a command
when identity, capability, authorization and safety checks all pass. The API emits
realtime events for a separate device gateway; it never pretends to control hardware.
"""
from datetime import datetime, timezone
from enum import Enum
from typing import Any
from uuid import UUID, uuid4

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field

app = FastAPI(title="Merveil Machine Connect API", version="0.2.0")


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
    capabilities: list[str] = Field(default_factory=list)
    owner_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_heartbeat_at: datetime | None = None


class CommandRequest(BaseModel):
    action: str
    parameters: dict[str, Any] = Field(default_factory=dict)
    requested_by: str
    actor_role: str
    idempotency_key: str | None = None


class Telemetry(BaseModel):
    machine_id: UUID
    metric_name: str
    metric_value: float | None = None
    unit: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    recorded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


machines: dict[UUID, Machine] = {}
websocket_clients: set[WebSocket] = set()


async def publish(event: dict[str, Any]) -> None:
    stale: list[WebSocket] = []
    for client in websocket_clients:
        try:
            await client.send_json(event)
        except Exception:
            stale.append(client)
    for client in stale:
        websocket_clients.discard(client)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "machine-connect",
        "realtime": "websocket",
        "timestamp": datetime.now(timezone.utc),
    }


@app.get("/api/v1/machines", response_model=list[Machine])
def list_machines():
    return list(machines.values())


@app.post("/api/v1/machines", response_model=Machine, status_code=201)
async def register_machine(machine: Machine):
    if any(m.machine_identity == machine.machine_identity for m in machines.values()):
        raise HTTPException(status_code=409, detail="machine_identity already registered")
    machines[machine.id] = machine
    await publish({"type": "machine.registered", "machine": machine.model_dump(mode="json")})
    return machine


@app.get("/api/v1/machines/{machine_id}", response_model=Machine)
def get_machine(machine_id: UUID):
    machine = machines.get(machine_id)
    if not machine:
        raise HTTPException(status_code=404, detail="machine not found")
    return machine


@app.post("/api/v1/machines/{machine_id}/heartbeat")
async def heartbeat(machine_id: UUID):
    machine = machines.get(machine_id)
    if not machine:
        raise HTTPException(status_code=404, detail="machine not found")
    machine.last_heartbeat_at = datetime.now(timezone.utc)
    if machine.state == MachineState.OFFLINE:
        machine.state = MachineState.ONLINE
    event = {
        "type": "heartbeat.received",
        "machine_id": str(machine_id),
        "state": machine.state.value,
        "timestamp": machine.last_heartbeat_at.isoformat(),
    }
    await publish(event)
    return event


@app.post("/api/v1/machines/{machine_id}/telemetry")
async def ingest_telemetry(machine_id: UUID, telemetry: Telemetry):
    machine = machines.get(machine_id)
    if not machine or telemetry.machine_id != machine_id:
        raise HTTPException(status_code=404, detail="machine not found")
    machine.last_heartbeat_at = telemetry.recorded_at
    if machine.state == MachineState.OFFLINE:
        machine.state = MachineState.ONLINE
    event = {"type": "telemetry.received", "telemetry": telemetry.model_dump(mode="json")}
    await publish(event)
    return {"accepted": True, **event}


@app.post("/api/v1/machines/{machine_id}/commands")
async def request_command(machine_id: UUID, request: CommandRequest):
    machine = machines.get(machine_id)
    if not machine:
        raise HTTPException(status_code=404, detail="machine not found")
    if machine.state in {MachineState.OFFLINE, MachineState.LOCKED, MachineState.EMERGENCY_STOP, MachineState.CRITICAL}:
        raise HTTPException(status_code=409, detail="command rejected by machine safety state")
    if request.actor_role not in {"Owner", "Operator", "Developer", "AI Agent", "Emergency Authority"}:
        raise HTTPException(status_code=403, detail="actor role not authorized")
    if request.action not in machine.capabilities:
        raise HTTPException(status_code=403, detail="machine capability does not permit this action")

    command = {
        "command_id": str(uuid4()),
        "status": "AUTHORIZED_FOR_GATEWAY",
        "machine_id": str(machine_id),
        "action": request.action,
        "idempotency_key": request.idempotency_key,
        "audit": {"requested_by": request.requested_by, "timestamp": datetime.now(timezone.utc).isoformat()},
        "next": "device_gateway",
    }
    await publish({"type": "command.authorized", "command": command})
    return command


@app.post("/api/v1/machines/{machine_id}/emergency-stop")
async def emergency_stop(machine_id: UUID, requested_by: str):
    machine = machines.get(machine_id)
    if not machine:
        raise HTTPException(status_code=404, detail="machine not found")
    machine.state = MachineState.EMERGENCY_STOP
    event = {"type": "safety.emergency_stop", "status": "EMERGENCY_STOP", "machine_id": str(machine_id), "requested_by": requested_by}
    await publish(event)
    return event


@app.websocket("/api/v1/realtime")
async def realtime(websocket: WebSocket):
    await websocket.accept()
    websocket_clients.add(websocket)
    try:
        await websocket.send_json({"type": "realtime.connected", "service": "machine-connect"})
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        websocket_clients.discard(websocket)
    except Exception:
        websocket_clients.discard(websocket)
