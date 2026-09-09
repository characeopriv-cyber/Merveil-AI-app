# Merveil Machine / PULSE service deployment

This directory is the isolated service deployment for a second Vercel project using the same GitHub repository.

## Vercel setup

Set the Vercel project's **Root Directory** to `deployments/machine-pulse-services`.

This deployment intentionally contains only two Serverless Functions:

- `/api/machine-connect` — authenticated bridge to the Supabase `machine-connect-api` Edge Function.
- `/api/pulse-intelligence` — authenticated, evidence-only PULSE Intelligence API.

The main Merveil deployment remains the primary web application. This split lets the service plane scale independently and keeps each Hobby deployment below Vercel's 12-function limit.

Both deployments use the same GitHub `main` branch and the same Supabase backend. No physical machine state or intelligence result is simulated here.
