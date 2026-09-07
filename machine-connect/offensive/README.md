# Machine Connect Offensive Workers

This directory contains **isolated assessment workers**. Workers never receive arbitrary shell commands from the API and never bypass Machine Connect authorization.

## Security boundary

`Dashboard/API -> authorization -> approval -> job envelope -> isolated worker -> normalized result -> Supabase`

Workers are intended for assets explicitly authorized by the organization. Production deployment should place them on a dedicated network segment with egress allow-lists, resource limits, read-only configuration, non-root containers, and short-lived credentials.

## Worker contracts

- `contracts/job.ts` — immutable assessment job envelope.
- `contracts/result.ts` — normalized result envelope.
- `workers/nmap-worker.ts` — safe discovery adapter boundary; execution is deliberately injected rather than built from user-controlled shell input.
- `workers/zap-worker.py` — web scanner adapter boundary; execution is limited to an authorized target URL.

The worker layer is intentionally a boundary first. Real scanner binaries/APIs are deployed separately and are not exposed directly to the public Merveil frontend.
