"""PULSE offline-first edge agent.

The edge agent keeps the physical-machine loop alive when cloud connectivity is
unavailable. It is intentionally conservative: diagnostics and telemetry may run
offline; physical commands require an explicit local policy and are never created
by this agent from arbitrary user input.

Architecture:
  machine/protocol adapter -> local evidence/state -> SQLite outbox -> sync later
                                      |
                                      +-> local safety policy -> approved command
"""
from __future__ import annotations

import hashlib
import json
import sqlite3
import time
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Callable


@dataclass(frozen=True)
class LocalCommand:
    command_id: str
    machine_id: str
    capability: str
    parameters: dict[str, Any]
    safety_class: str
    created_at: float


class PulseEdgeAgent:
    """Offline state, evidence, command policy and store-and-forward queue."""

    def __init__(
        self,
        db_path: str | Path,
        machine_id: str,
        *,
        allowed_offline_capabilities: set[str] | None = None,
    ) -> None:
        self.machine_id = machine_id
        self.allowed_offline_capabilities = allowed_offline_capabilities or set()
        self.db = sqlite3.connect(str(db_path), check_same_thread=False)
        self.db.row_factory = sqlite3.Row
        self._init_db()

    def _init_db(self) -> None:
        self.db.executescript(
            """
            PRAGMA journal_mode=WAL;
            PRAGMA synchronous=FULL;

            CREATE TABLE IF NOT EXISTS local_state (
              key TEXT PRIMARY KEY,
              value_json TEXT NOT NULL,
              updated_at REAL NOT NULL
            );

            CREATE TABLE IF NOT EXISTS evidence (
              id TEXT PRIMARY KEY,
              machine_id TEXT NOT NULL,
              kind TEXT NOT NULL,
              payload_json TEXT NOT NULL,
              observed_at REAL NOT NULL,
              sequence_no INTEGER NOT NULL,
              content_hash TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS outbox (
              id TEXT PRIMARY KEY,
              kind TEXT NOT NULL,
              payload_json TEXT NOT NULL,
              sequence_no INTEGER NOT NULL,
              attempts INTEGER NOT NULL DEFAULT 0,
              next_attempt_at REAL NOT NULL DEFAULT 0,
              synced_at REAL
            );

            CREATE TABLE IF NOT EXISTS local_commands (
              command_id TEXT PRIMARY KEY,
              machine_id TEXT NOT NULL,
              capability TEXT NOT NULL,
              parameters_json TEXT NOT NULL,
              safety_class TEXT NOT NULL,
              status TEXT NOT NULL,
              created_at REAL NOT NULL,
              completed_at REAL
            );
            """
        )
        self.db.commit()

    def _next_sequence(self) -> int:
        row = self.db.execute(
            "SELECT COALESCE(MAX(sequence_no), 0) AS n FROM evidence"
        ).fetchone()
        return int(row["n"]) + 1

    def record_telemetry(self, payload: dict[str, Any], *, observed_at: float | None = None) -> str:
        """Persist telemetry locally first; cloud sync is optional and asynchronous."""
        now = observed_at if observed_at is not None else time.time()
        sequence = self._next_sequence()
        evidence_id = str(uuid.uuid4())
        canonical = json.dumps(payload, sort_keys=True, separators=(",", ":"))
        digest = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
        self.db.execute(
            "INSERT INTO evidence(id,machine_id,kind,payload_json,observed_at,sequence_no,content_hash) VALUES(?,?,?,?,?,?,?)",
            (evidence_id, self.machine_id, "telemetry", canonical, now, sequence, digest),
        )
        self.db.execute(
            "INSERT INTO outbox(id,kind,payload_json,sequence_no) VALUES(?,?,?,?,?)".replace(
                "VALUES(?,?,?,?,?)", "VALUES(?,?,?,?)"
            ),
            (
                evidence_id,
                "telemetry",
                json.dumps(
                    {
                        "machine_id": self.machine_id,
                        "sequence_no": sequence,
                        "observed_at": now,
                        "data": payload,
                        "content_hash": digest,
                    },
                    separators=(",", ":"),
                ),
                sequence,
            ),
        )
        self.db.commit()
        return evidence_id

    def set_state(self, key: str, value: Any) -> None:
        self.db.execute(
            "INSERT INTO local_state(key,value_json,updated_at) VALUES(?,?,?) "
            "ON CONFLICT(key) DO UPDATE SET value_json=excluded.value_json,updated_at=excluded.updated_at",
            (key, json.dumps(value, separators=(",", ":")), time.time()),
        )
        self.db.commit()

    def get_state(self, key: str) -> Any | None:
        row = self.db.execute("SELECT value_json FROM local_state WHERE key=?", (key,)).fetchone()
        return json.loads(row["value_json"]) if row else None

    def request_local_command(
        self,
        capability: str,
        parameters: dict[str, Any],
        *,
        safety_class: str = "read",
        locally_authorized: bool = False,
    ) -> LocalCommand:
        """Create an offline command only when local policy explicitly permits it.

        Critical/control operations must be pre-authorized by local policy. The
        edge agent never turns an AI suggestion into a physical command by itself.
        """
        if not locally_authorized:
            raise PermissionError("Offline command requires explicit local authorization")
        if capability not in self.allowed_offline_capabilities:
            raise PermissionError(f"Capability is not enabled for offline execution: {capability}")
        if safety_class == "critical":
            raise PermissionError("Critical commands are disabled in offline mode")

        command = LocalCommand(
            command_id=str(uuid.uuid4()),
            machine_id=self.machine_id,
            capability=capability,
            parameters=parameters,
            safety_class=safety_class,
            created_at=time.time(),
        )
        self.db.execute(
            "INSERT INTO local_commands(command_id,machine_id,capability,parameters_json,safety_class,status,created_at) VALUES(?,?,?,?,?,?,?)",
            (
                command.command_id,
                command.machine_id,
                command.capability,
                json.dumps(parameters, separators=(",", ":")),
                command.safety_class,
                "authorized_local",
                command.created_at,
            ),
        )
        self.db.commit()
        return command

    def execute_local_command(
        self,
        command_id: str,
        executor: Callable[[str, dict[str, Any]], dict[str, Any]],
    ) -> dict[str, Any]:
        """Execute an already locally-authorized command through a hardware adapter."""
        row = self.db.execute(
            "SELECT capability,parameters_json,status FROM local_commands WHERE command_id=?",
            (command_id,),
        ).fetchone()
        if not row:
            raise KeyError("Unknown local command")
        if row["status"] != "authorized_local":
            raise PermissionError("Command is not in an executable state")

        try:
            result = executor(row["capability"], json.loads(row["parameters_json"]))
            status = "completed_local"
        except Exception as exc:
            result = {"error": str(exc)}
            status = "failed_local"

        self.db.execute(
            "UPDATE local_commands SET status=?,completed_at=? WHERE command_id=?",
            (status, time.time(), command_id),
        )
        self.db.commit()
        return {"command_id": command_id, "status": status, "result": result}

    def pending_sync(self, limit: int = 100) -> list[dict[str, Any]]:
        rows = self.db.execute(
            "SELECT id,kind,payload_json,sequence_no,attempts,next_attempt_at FROM outbox "
            "WHERE synced_at IS NULL AND next_attempt_at <= ? ORDER BY sequence_no LIMIT ?",
            (time.time(), limit),
        ).fetchall()
        return [dict(row) | {"payload": json.loads(row["payload_json"])} for row in rows]

    def acknowledge_sync(self, outbox_id: str) -> None:
        self.db.execute("UPDATE outbox SET synced_at=? WHERE id=?", (time.time(), outbox_id))
        self.db.commit()

    def defer_sync(self, outbox_id: str, *, base_seconds: float = 2.0) -> None:
        row = self.db.execute("SELECT attempts FROM outbox WHERE id=?", (outbox_id,)).fetchone()
        if not row:
            return
        attempts = int(row["attempts"]) + 1
        delay = min(300.0, base_seconds * (2 ** min(attempts, 8)))
        self.db.execute(
            "UPDATE outbox SET attempts=?,next_attempt_at=? WHERE id=?",
            (attempts, time.time() + delay, outbox_id),
        )
        self.db.commit()

    def close(self) -> None:
        self.db.close()
