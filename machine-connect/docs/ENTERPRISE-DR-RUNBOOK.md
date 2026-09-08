# Machine Connect Enterprise Backup & DR Runbook

## Scope

This runbook covers recovery of the Supabase-backed Machine Connect control plane and the Netlify-hosted frontend. It is an operational procedure, not a claim that multi-region failover is already deployed.

## Recovery priorities

1. Protect machine safety and stop unsafe command dispatch.
2. Preserve audit/security evidence.
3. Restore the database and verify tenant isolation.
4. Restore Core API connectivity.
5. Restore frontend delivery if required.
6. Validate telemetry, command acknowledgement and ontology paths.

## Backup policy

- Keep Supabase managed backups/PITR enabled according to the production plan.
- Maintain an independent export strategy for critical configuration and compliance evidence.
- Never store service-role keys, machine credentials or API secrets in repository backups.
- Record every restore attempt in `machine_connect_retention_runs`/operational evidence systems.

## Restore verification

After restoration verify:

- organizations and organization_members are present;
- machine credentials remain disabled/valid according to policy;
- command and ACK integrity tables are intact;
- telemetry checkpoints and sync queues are consistent;
- ontology entities/relationships remain tenant-isolated;
- compliance evidence hashes remain valid;
- active legal holds are preserved;
- health endpoint returns 200;
- no emergency-stop state was lost.

## Regional DR

A second region is an architecture target. Do not advertise active-active or automatic regional failover until a second production database/API region has been provisioned and a failover drill has passed.

## Quarterly recovery drill

1. Restore into an isolated environment.
2. Run schema/integrity checks.
3. Run Core build and tests.
4. Run tenant-isolation tests.
5. Run k6 smoke/load profile against the isolated API.
6. Record RTO/RPO and defects.
7. Remediate before declaring the drill successful.
