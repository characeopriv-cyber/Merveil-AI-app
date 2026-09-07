"""Citizen service assistant contract.

The assistant may explain services and prepare requests. Submission must use
the authenticated service-request API; sender_id is never treated as identity.
"""
from dataclasses import dataclass

@dataclass(frozen=True)
class ServiceRequestDraft:
    service_type: str
    description: str
    requires_confirmation: bool = True


def draft_request(service_type: str, description: str) -> ServiceRequestDraft:
    service_type, description = service_type.strip(), description.strip()
    if not service_type or not description or len(description) > 5000:
        raise ValueError("invalid service request")
    return ServiceRequestDraft(service_type, description)
