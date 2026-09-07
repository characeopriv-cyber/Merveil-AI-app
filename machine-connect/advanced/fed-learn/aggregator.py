"""Privacy-preserving federated aggregation boundary for Machine Connect.

This module deliberately aggregates bounded numeric model updates only. It does
not ingest raw citizen, patient, camera, or device datasets.
"""
from __future__ import annotations
from typing import Sequence


def fedavg(updates: Sequence[tuple[Sequence[float], int]]) -> list[float]:
    if not updates:
        raise ValueError("at least one update is required")
    width = len(updates[0][0])
    if width == 0 or any(len(weights) != width for weights, _ in updates):
        raise ValueError("incompatible model update shapes")
    if any(samples <= 0 for _, samples in updates):
        raise ValueError("sample counts must be positive")
    total = sum(samples for _, samples in updates)
    return [sum(weights[i] * samples for weights, samples in updates) / total for i in range(width)]
