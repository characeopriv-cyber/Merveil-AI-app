# Modbus Adapter Boundary

Modbus TCP/RTU is normalized into Machine Connect telemetry and capabilities.

Adapter responsibilities:
- establish and monitor the Modbus connection
- validate register maps and value ranges
- publish normalized telemetry
- translate approved capability commands

The adapter does not authenticate end users, approve commands, or override Core safety policy. Connection parameters and credentials are runtime secrets/configuration only.
