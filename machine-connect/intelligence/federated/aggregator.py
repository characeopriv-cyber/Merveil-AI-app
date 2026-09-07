"""Privacy-aware federated aggregation boundary.

The aggregator receives references to encrypted/model-update artifacts. Raw
training data never enters this service. Production deployments should place
secure aggregation or MPC between clients and the aggregate operation.
"""
from typing import Iterable
from .types import FederatedUpdate, validate_update


def weighted_average(updates: Iterable[FederatedUpdate]) -> dict[str, float]:
    items = list(updates)
    if not items:
        raise ValueError('at least one update is required')
    for update in items:
        validate_update(update)
    total = sum(x.sample_count for x in items)
    if total <= 0:
        raise ValueError('invalid sample count')
    keys = set().union(*(x.metrics.keys() for x in items))
    return {key: sum(x.metrics.get(key, 0.0) * x.sample_count for x in items) / total for key in keys}
