"""Digital-twin simulation boundary.

Simulation output is telemetry-like evidence. It cannot dispatch physical
commands; consequential actions must return to Machine Connect Core policy.
"""
from __future__ import annotations
from dataclasses import dataclass

@dataclass(frozen=True)
class TwinSnapshot:
    twin_id: str
    observed_at: str
    state: dict[str, float]
    source: str = "simulation"


def build_snapshot(twin_id: str, observed_at: str, state: dict[str, float]) -> TwinSnapshot:
    if not twin_id or not observed_at or not state:
        raise ValueError("invalid twin snapshot")
    if any(not isinstance(v, (int, float)) for v in state.values()):
        raise ValueError("simulation state must be numeric")
    return TwinSnapshot(twin_id=twin_id, observed_at=observed_at, state=dict(state))
