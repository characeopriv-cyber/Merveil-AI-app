"""Safe domain-analysis boundary.

This worker performs analysis/recommendations only. It never sends commands to
machines, medical devices, grid equipment, vehicles, public infrastructure,
or satellites. Consequential actions must return to the Core safety pipeline.
"""
from typing import Any


def analyze(domain: str, observations: list[dict[str, Any]]) -> dict[str, Any]:
    if domain not in {
        "healthcare", "agriculture", "energy", "city", "supply_chain",
        "environment", "space",
    }:
        raise ValueError("unsupported domain")

    return {
        "domain": domain,
        "observation_count": len(observations),
        "findings": [],
        "recommendations": [],
        "execution_allowed": False,
        "requires_policy_evaluation": True,
    }
