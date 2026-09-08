"""PULSE Edge offline runtime primitives.

Standard-library implementation so the core safety/queue algorithm can run on a
minimal offline installation. Hardware adapters and model runners are injected.
"""
from __future__ import annotations

import hashlib
import hmac
import json
import sqlite3
import time
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable, Iterable, Optional


@dataclass(frozen=True)
class ProcedureStep:
    id: str
    name: str
    kind: str  # read | check | command | human_task
    timeout_s: float
    min_duration_s: float = 0
    required_conditions: tuple[str, ...] = ()
    safety_checks: tuple[str, ...] = ()
    requires_human_approval: bool = False


@dataclass
class ProcedureContext:
    machine_id: str
    procedure_id: str
    state: dict[str, Any] = field(default_factory=dict)


class OfflineStore:
    """Durable local cache, audit log and store-and-forward queue."""

    def __init__(self, db_path: str = "/data/pulse-edge.db") -> None:
        Path(db_path).parent.mkdir(parents=True, exist_ok=True)
        self.db = sqlite3.connect(db_path)
        self.db.row_factory = sqlite3.Row
        self.db.executescript(
            """
            PRAGMA journal_mode=WAL;
            PRAGMA foreign_keys=ON;
            CREATE TABLE IF NOT EXISTS edge_records (
              id TEXT PRIMARY KEY,
              kind TEXT NOT NULL,
              machine_id TEXT NOT NULL,
              payload TEXT NOT NULL,
              created_at REAL NOT NULL,
              sync_state TEXT NOT NULL DEFAULT 'pending',
              attempts INTEGER NOT NULL DEFAULT 0,
              last_error TEXT
            );
            CREATE INDEX IF NOT EXISTS edge_records_sync_idx
              ON edge_records(sync_state, created_at);
            CREATE TABLE IF NOT EXISTS edge_audit (
              id TEXT PRIMARY KEY,
              machine_id TEXT NOT NULL,
              event TEXT NOT NULL,
              payload TEXT NOT NULL,
              created_at REAL NOT NULL
            );
            """
        )
        self.db.commit()

    def enqueue(self, kind: str, machine_id: str, payload: dict[str, Any]) -> str:
        record_id = str(uuid.uuid4())
        self.db.execute(
            "INSERT INTO edge_records(id,kind,machine_id,payload,created_at) VALUES(?,?,?,?,?)",
            (record_id, kind, machine_id, json.dumps(payload, separators=(",", ":"), sort_keys=True), time.time()),
        )
        self.db.commit()
        return record_id

    def audit(self, machine_id: str, event: str, payload: dict[str, Any]) -> None:
        self.db.execute(
            "INSERT INTO edge_audit(id,machine_id,event,payload,created_at) VALUES(?,?,?,?,?)",
            (str(uuid.uuid4()), machine_id, event, json.dumps(payload, sort_keys=True), time.time()),
        )
        self.db.commit()

    def pending(self, limit: int = 100) -> list[sqlite3.Row]:
        return list(self.db.execute(
            "SELECT * FROM edge_records WHERE sync_state='pending' ORDER BY created_at LIMIT ?", (limit,)
        ))

    def mark_synced(self, record_id: str) -> None:
        self.db.execute("UPDATE edge_records SET sync_state='synced' WHERE id=?", (record_id,))
        self.db.commit()

    def mark_failed(self, record_id: str, error: str) -> None:
        self.db.execute(
            "UPDATE edge_records SET attempts=attempts+1,last_error=? WHERE id=?",
            (error[:1000], record_id),
        )
        self.db.commit()


class SafetyGovernor:
    """Local fail-closed safety boundary.

    A missing safety fact blocks an action. AI output is advisory and never
    satisfies a safety requirement by itself.
    """

    def authorize(
        self,
        *,
        machine_state: dict[str, Any],
        required_conditions: Iterable[str],
        safety_checks: Iterable[str],
        authorized: bool,
        human_approved: bool,
    ) -> tuple[bool, str]:
        if not authorized:
            return False, "authorization_required"
        for condition in required_conditions:
            if not bool(machine_state.get(condition)):
                return False, f"condition_not_met:{condition}"
        for check in safety_checks:
            if not bool(machine_state.get(check)):
                return False, f"safety_check_failed:{check}"
        if human_approved is False:
            return False, "human_approval_required"
        return True, "authorized"


class ProcedureEngine:
    def __init__(
        self,
        store: OfflineStore,
        safety: SafetyGovernor,
        action_runner: Callable[[ProcedureStep, ProcedureContext], dict[str, Any]],
    ) -> None:
        self.store = store
        self.safety = safety
        self.action_runner = action_runner

    def execute(
        self,
        procedure: list[ProcedureStep],
        context: ProcedureContext,
        *,
        authorized: bool,
        human_approved: bool = False,
    ) -> dict[str, Any]:
        for step in procedure:
            self.store.audit(context.machine_id, "procedure.step.started", {"procedure_id": context.procedure_id, "step_id": step.id})
            ok, reason = self.safety.authorize(
                machine_state=context.state,
                required_conditions=step.required_conditions,
                safety_checks=step.safety_checks,
                authorized=authorized,
                human_approved=(human_approved or not step.requires_human_approval),
            )
            if not ok:
                self.store.audit(context.machine_id, "procedure.step.blocked", {"step_id": step.id, "reason": reason})
                return {"status": "blocked", "step": step.id, "reason": reason}

            started = time.monotonic()
            try:
                result = self.action_runner(step, context)
            except Exception as exc:  # noqa: BLE001 - edge runtime must convert hardware failures to state
                self.store.audit(context.machine_id, "procedure.step.failed", {"step_id": step.id, "error": str(exc)})
                return {"status": "failed", "step": step.id, "error": str(exc)}
            elapsed = time.monotonic() - started
            if elapsed > step.timeout_s:
                self.store.audit(context.machine_id, "procedure.step.timeout", {"step_id": step.id, "elapsed_s": elapsed})
                return {"status": "timeout", "step": step.id, "elapsed_s": elapsed}
            if elapsed < step.min_duration_s:
                self.store.audit(context.machine_id, "procedure.step.invalid_timing", {"step_id": step.id, "elapsed_s": elapsed})
                return {"status": "invalid_timing", "step": step.id, "elapsed_s": elapsed}

            self.store.audit(context.machine_id, "procedure.step.completed", {"step_id": step.id, "elapsed_s": elapsed, "result": result})

        return {"status": "completed", "procedure_id": context.procedure_id}


def telemetry_fingerprint(machine_id: str, sequence: int, observed_at: str) -> str:
    """Stable idempotency key for offline telemetry."""
    raw = f"{machine_id}|{sequence}|{observed_at}".encode()
    return hashlib.sha256(raw).hexdigest()


def verify_sync_token(expected: str, presented: str) -> bool:
    """Constant-time comparison for a local/cloud sync credential."""
    return hmac.compare_digest(expected.encode(), presented.encode())
