# Merveil Developer Platform — Real Product Architecture

## Boundary
This module is isolated from the Citizen App. Do not import, modify, or refactor citizen-facing components from this module.

## Product lifecycle
Create → Build → Run → Test → Deploy → Publish

## Core domains
- projects: developer-owned projects and templates
- files: source/config files belonging to a project
- builds: immutable build attempts, logs, errors, artifacts
- deployments: production/preview deployments and rollback metadata
- agents: agent definitions and lifecycle state
- agent tools: governed Merveil capabilities and external integrations
- knowledge: indexed project knowledge sources
- environments: server-side environment variable metadata; values remain secret
- API credentials: scoped Merveil credentials, never exposed to browser bundles
- publishing: Interface listing metadata, permissions, pricing and publication status
- usage: build/runtime/API usage and credit metering

## Execution model
The platform UI is orchestration, not a fake simulator. Build and deployment jobs must execute in isolated environments. Arbitrary developer code must never execute inside the Merveil API process.

Preferred execution path:
1. Create project metadata.
2. Generate/write files in project workspace.
3. Validate manifest and dependency graph.
4. Run an isolated build job.
5. Persist real stdout/stderr and exit status.
6. Create a preview deployment from a successful artifact.
7. Promote or rollback through the deployment provider.
8. Publish an approved project to Merveil Interface.

## Security boundary
- Developer owns only their project resources.
- Every API route validates authenticated developer identity and project ownership.
- Secrets are server-side only.
- Merveil capability access is explicit and scoped.
- Build workers are isolated from platform infrastructure and citizen data.
- Citizen App tables and APIs are not modified by this module.

## Definition of done
A developer can create a project, edit files, ask the AI Builder to change real files, build the project, see real errors/logs, run a preview, deploy it, manage versions, and submit the resulting product to Merveil Interface.
