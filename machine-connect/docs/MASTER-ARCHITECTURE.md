# Merveil Machine Connect — Master Architecture

## Product boundary

Machine Connect is the Merveil ecosystem's physical-intelligence platform. It is a separate application/deployment boundary while remaining part of the same ecosystem.

## Core flow

Client surfaces -> API/Auth -> Machine Registry + Event Fabric -> Physical Intelligence -> Digital Twin/Simulation -> Safety/Policy -> Command Executor -> Edge/Protocol Adapter -> Physical System -> Telemetry/Evidence.

## Intelligence surfaces

- Machine identification from visual, audio, telemetry and documentation evidence.
- Multimodal inspection and diagnosis.
- Predictive maintenance.
- Repair and rebuild planning.
- Simulation and what-if analysis.
- Robotics development and testing.
- Legacy-machine integration through appropriate gateways.
- Satellite-connected device and virtual/simulated satellite workflows.
- Voice-first engineering interaction.

## Universal connectivity

Machine Connect uses adapters to normalize MQTT, WebSocket, HTTP, OPC UA, Modbus, CAN, BLE, Zigbee, LoRaWAN, Serial, USB, GPIO, SIP, satellite and custom transports into a common capability model.

## Safety

AI recommendations are never equivalent to physical execution. Execution requires authenticated machine identity, authorized capability, policy checks, safety interlocks, command expiry and an auditable gateway acknowledgement. Emergency-stop mechanisms remain authoritative outside the AI layer.

## Data

PostgreSQL/Supabase is the transactional system of record. Time-series storage is used for high-volume telemetry. Object storage holds media/evidence. Redis is reserved for ephemeral state, locks and rate limits. Kafka is introduced only where event volume warrants it; EMQX is the primary MQTT connectivity layer.

## Runtime split

NestJS/Node.js is the primary platform API and orchestration runtime. Python/FastAPI is the specialist physical-intelligence runtime for multimodal analysis, ML and engineering workloads. Edge gateways run on Linux/Docker or suitable industrial runtimes.

## Non-goals

Machine Connect does not imply that arbitrary proprietary hardware can be controlled without an adapter, documented interface, lawful authorization, or appropriate physical safety system. The platform must never manufacture a false execution acknowledgement.
