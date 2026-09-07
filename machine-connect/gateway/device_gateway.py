"""Merveil Machine Connect device-gateway adapter.

This adapter is intentionally transport-only: it publishes authorized commands to
MQTT and forwards device telemetry to the Machine Connect API. Hardware safety,
device certificates and broker ACLs must be configured before production use.
"""
import json
import os
from typing import Any

import paho.mqtt.client as mqtt
import requests

MQTT_URL = os.environ.get("MACHINE_CONNECT_MQTT_URL", "")
MQTT_USERNAME = os.environ.get("MACHINE_CONNECT_MQTT_USERNAME", "")
MQTT_PASSWORD = os.environ.get("MACHINE_CONNECT_MQTT_PASSWORD", "")
API_URL = os.environ.get("MACHINE_CONNECT_API_URL", "http://127.0.0.1:8000")


def build_client() -> mqtt.Client:
    if not MQTT_URL:
        raise RuntimeError("MACHINE_CONNECT_MQTT_URL is required")
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, protocol=mqtt.MQTTv5)
    if MQTT_USERNAME:
        client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
    return client


def publish_authorized_command(client: mqtt.Client, machine_identity: str, command: dict[str, Any]) -> None:
    """Send only a command already authorized by Machine Connect."""
    topic = f"merveil/machines/{machine_identity}/commands"
    client.publish(topic, json.dumps(command), qos=1)


def forward_telemetry(machine_id: str, payload: dict[str, Any]) -> None:
    response = requests.post(
        f"{API_URL}/api/v1/machines/{machine_id}/telemetry",
        json={"machine_id": machine_id, **payload},
        timeout=5,
    )
    response.raise_for_status()


def run() -> None:
    client = build_client()
    client.connect(os.environ.get("MACHINE_CONNECT_MQTT_HOST", "127.0.0.1"), int(os.environ.get("MACHINE_CONNECT_MQTT_PORT", "1883")), 60)
    client.loop_forever()


if __name__ == "__main__":
    run()
