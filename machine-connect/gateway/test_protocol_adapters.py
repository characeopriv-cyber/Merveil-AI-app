import unittest

from protocol_adapters import describe, normalize_telemetry, authorize_capability


class ProtocolAdapterTests(unittest.TestCase):
    def test_known_protocol(self):
        adapter = describe("mqtt")
        self.assertEqual(adapter.protocol.value, "MQTT")
        self.assertTrue(adapter.secure_by_default)

    def test_unknown_protocol_fails_closed(self):
        with self.assertRaises(ValueError):
            describe("PROPRIETARY_UNKNOWN")

    def test_normalization_keeps_payload_and_protocol(self):
        result = normalize_telemetry(
            machine_identity="MC-TEST-001",
            protocol="CAN",
            payload={"rpm": 1200},
        )
        self.assertEqual(result["machine_identity"], "MC-TEST-001")
        self.assertEqual(result["protocol"], "CAN")
        self.assertEqual(result["payload"]["rpm"], 1200)

    def test_capability_gate(self):
        self.assertTrue(authorize_capability(requested_capability="speed", machine_capabilities=["speed", "stop"]))
        self.assertFalse(authorize_capability(requested_capability="fly", machine_capabilities=["speed", "stop"]))


if __name__ == "__main__":
    unittest.main()
