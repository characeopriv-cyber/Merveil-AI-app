import tempfile
import unittest
from pathlib import Path

from pulse_edge_agent import PulseEdgeAgent


class PulseEdgeAgentTest(unittest.TestCase):
    def test_telemetry_survives_without_cloud(self):
        with tempfile.TemporaryDirectory() as tmp:
            agent = PulseEdgeAgent(Path(tmp) / "pulse.db", "machine-1")
            evidence_id = agent.record_telemetry({"temperature": 42.5})
            pending = agent.pending_sync()
            self.assertEqual(len(pending), 1)
            self.assertEqual(pending[0]["payload"]["machine_id"], "machine-1")
            self.assertEqual(pending[0]["payload"]["data"]["temperature"], 42.5)
            self.assertTrue(evidence_id)
            agent.close()

    def test_offline_command_requires_explicit_authorization(self):
        with tempfile.TemporaryDirectory() as tmp:
            agent = PulseEdgeAgent(
                Path(tmp) / "pulse.db",
                "machine-1",
                allowed_offline_capabilities={"diagnostic.read"},
            )
            with self.assertRaises(PermissionError):
                agent.request_local_command("diagnostic.read", {}, locally_authorized=False)
            command = agent.request_local_command("diagnostic.read", {}, locally_authorized=True)
            result = agent.execute_local_command(command.command_id, lambda cap, params: {"ok": True})
            self.assertEqual(result["status"], "completed_local")
            agent.close()

    def test_critical_commands_are_never_executed_offline(self):
        with tempfile.TemporaryDirectory() as tmp:
            agent = PulseEdgeAgent(
                Path(tmp) / "pulse.db",
                "machine-1",
                allowed_offline_capabilities={"machine.stop"},
            )
            with self.assertRaises(PermissionError):
                agent.request_local_command("machine.stop", {}, safety_class="critical", locally_authorized=True)
            agent.close()


if __name__ == "__main__":
    unittest.main()
