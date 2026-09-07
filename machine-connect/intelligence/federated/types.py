from dataclasses import dataclass
from typing import Any, Mapping

@dataclass(frozen=True)
class FederatedUpdate:
    organization_id: str
    model_id: str
    round_number: int
    sample_count: int
    metrics: Mapping[str, float]
    update_ref: str
    update_hash: str

@dataclass(frozen=True)
class FederatedRound:
    model_id: str
    round_number: int
    min_clients: int
    status: str
    aggregate_ref: str | None = None


def validate_update(update: FederatedUpdate) -> None:
    if not update.organization_id or not update.model_id or not update.update_ref:
        raise ValueError('missing federated update identity')
    if update.round_number < 1 or update.sample_count < 1:
        raise ValueError('invalid federated update counters')
    if len(update.update_hash) != 64 or any(c not in '0123456789abcdef' for c in update.update_hash.lower()):
        raise ValueError('invalid update hash')
