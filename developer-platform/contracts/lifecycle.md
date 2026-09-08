# Project lifecycle contract

A project is never marked successful because a button was clicked.

| State | Meaning |
|---|---|
| draft | Metadata exists; no successful build yet |
| building | An isolated build job is running |
| failed | Latest build exited non-zero; logs/errors are available |
| ready | Latest build completed successfully |
| preview | A real preview deployment exists |
| deployed | A production deployment exists |
| published | Product is approved and discoverable through Interface |

## Required transitions
- draft → building
- building → ready or failed
- ready → preview
- preview → deployed
- deployed → published
- deployed → deployed via rollback to a prior successful version

Every transition must have a durable record, actor, timestamp, source version and execution/deployment identifier where applicable.
