"""Universal protocol boundary for Machine Connect.

Adapters normalize very different physical interfaces into one capability model.
This module intentionally does not execute hardware commands. Real execution must
happen in a provisioned gateway after identity, authorization and safety checks.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Mapping


class Protocol(str, Enum):
    MQTT = "MQTT"
    WEBSOCKET = "WEBSOCKET"
    HTTP = "HTTP"
    SERIAL = "SERIAL"
    USB = "USB"
    BLE = "BLE"
    CAN = "CAN"
    MODBUS = "MODBUS"
    OPC_UA = "OPC_UA"
    SIP = "SIP"
    SATELLITE = "SATELLITE"


@dataclass(frozen=True)
class Capability:
    name: str
    kind: str  # sensor | actuator | command | telemetry
    schema: Mapping[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class AdapterDescriptor:
    protocol: Protocol
    transport: str
    secure_by_default: bool
    capabilities: tuple[Capability, ...] = ()


ADAPTERS: dict[Protocol, AdapterDescriptor] = {
    Protocol.MQTT: AdapterDescriptor(Protocol.MQTT, "broker", True),
    Protocol.WEBSOCKET: AdapterDescriptor(Protocol.WEBSOCKET, "stream", True),
    Protocol.HTTP: AdapterDescriptor(Protocol.HTTP, "request", True),
    Protocol.SERIAL: AdapterDescriptor(Protocol.SERIAL, "local", False),
    Protocol.USB: AdapterDescriptor(Protocol.USB, "local", False),
    Protocol.BLE: AdapterDescriptor(Protocol.BLE, "radio", True),
    Protocol.CAN: AdapterDescriptor(Protocol.CAN, "vehicle-bus", False),
    Protocol.MODBUS: AdapterDescriptor(Protocol.MODBUS, "industrial-bus", False),
    Protocol.OPC_UA: AdapterDescriptor(Protocol.OPC_UA, "industrial-network", True),
    Protocol.SIP: AdapterDescriptor(Protocol.SIP, "telephony", True),
    Protocol.SATELLITE: AdapterDescriptor(Protocol.SATELLITE, "satellite-gateway", True),
}


def describe(protocol: str) -> AdapterDescriptor:
    """Return a known adapter descriptor or fail closed."""
    try:
        return ADAPTERS[Protocol(protocol.upper())]
    except (KeyError, ValueError) as exc:
        raise ValueError(f"Unsupported Machine Connect protocol: {protocol}") from exc


def normalize_telemetry(
    *, machine_identity: str, protocol: str, payload: Mapping[str, Any]
) -> dict[str, Any]:
    """Normalize ingress metadata without trusting device-provided identity."""
    descriptor = describe(protocol)
    return {
        "machine_identity": machine_identity,
        "protocol": descriptor.protocol.value,
        "transport": descriptor.transport,
        "secure_transport_expected": descriptor.secure_by_default,
        "payload": dict(payload),
    }


def authorize_capability(
    *, requested_capability: str, machine_capabilities: list[str]
) -> bool:
    """Capability gate used before a command reaches a physical gateway."""
    return requested_capability in set(machine_capabilities)
