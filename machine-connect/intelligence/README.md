# Merveil Physical Intelligence Runtime

Python workers are specialist workloads, not the primary platform API.

## Pipeline

`evidence -> preprocessing -> multimodal model router -> machine identification -> diagnosis -> simulation/repair plan -> safety review`

Supported evidence classes:

- image / live camera frames
- video
- audio
- telemetry
- logs
- manuals and technical documents

Model providers are intentionally abstracted behind a task router. Provider credentials belong in deployment secret stores, never source control.

The runtime must return evidence, hypotheses, confidence and recommended next actions. It must not claim that a physical action occurred unless an authenticated gateway acknowledgement exists.
