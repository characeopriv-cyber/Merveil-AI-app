import json
import os
import random
import signal
import time
import uuid

import paho.mqtt.client as mqtt

HOST = os.getenv("MQTT_HOST", "localhost")
PORT = int(os.getenv("MQTT_PORT", "1883"))
DEVICE_ID = os.getenv("DEVICE_ID", "sensor-001")
INTERVAL = max(float(os.getenv("PUBLISH_INTERVAL_SECONDS", "5")), 0.5)
TOPIC = f"devices/{DEVICE_ID}/telemetry"

running = True


def stop(_signum, _frame):
    global running
    running = False


signal.signal(signal.SIGTERM, stop)
signal.signal(signal.SIGINT, stop)

client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id=DEVICE_ID)
client.reconnect_delay_set(min_delay=1, max_delay=30)
client.connect_async(HOST, PORT, 60)
client.loop_start()

try:
    sequence = 0
    while running:
        sequence += 1
        payload = {
            "event_id": str(uuid.uuid4()),
            "device_id": DEVICE_ID,
            "sequence": sequence,
            "temperature": round(random.uniform(20, 30), 2),
            "humidity": round(random.uniform(30, 60), 2),
            "timestamp": time.time(),
        }
        info = client.publish(TOPIC, json.dumps(payload), qos=1)
        if info.rc == mqtt.MQTT_ERR_SUCCESS:
            print("Published:", payload, flush=True)
        else:
            print("Publish queued/failed rc:", info.rc, flush=True)
        time.sleep(INTERVAL)
finally:
    client.loop_stop()
    client.disconnect()
