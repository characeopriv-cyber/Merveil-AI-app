"""Provider-neutral secure aggregation contract.

Cryptographic secure aggregation is delegated to a reviewed provider. This
file intentionally does not implement ad-hoc encryption or expose raw client
updates to application code.
"""
from typing import Protocol, Sequence

class SecureAggregator(Protocol):
    def aggregate(self, protected_updates: Sequence[bytes]) -> bytes: ...


def validate_update(update: bytes, max_bytes: int = 10_000_000) -> bytes:
    if not update or len(update) > max_bytes:
        raise ValueError("invalid protected model update")
    return update
