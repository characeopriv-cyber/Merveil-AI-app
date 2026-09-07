# Machine Connect Advanced Modules

These modules extend the Digital Nation Builder without creating a second platform.

## AI Form Builder

Natural-language requests are converted into a constrained JSON form schema. The schema is validated before publication and records are stored in `form_records` JSONB. **The AI never creates SQL tables or arbitrary API routes.** `OPENAI_API_KEY` is server-side only and the model is selected through `OPENAI_FORM_MODEL`.

Flow: prompt -> model provider -> schema validation -> human publish -> React renderer -> validated record API -> workflow.

## Blockchain / provenance land registry

Supabase remains the queryable operational state. Land records are hashed deterministically and an injected `LandRegistryAnchorProvider` can anchor hashes to a permissioned or public ledger. Chain state is treated as a provenance/verification layer, not as a replacement for authoritative government records. Transfers must pass the application's authorization and approval policy.

No citizen private keys or identity documents are written to chain. Sensitive documents remain in private object storage; only references/hashes may be anchored.

## Federated learning

Federated clients send model-update artifacts/references, not raw citizen, patient, or device data. The Python boundary provides validation and weighted aggregation. Production deployments should use secure aggregation/MPC, participant authentication, model/version allow-lists, update-size limits, poisoning detection, and encrypted artifact storage.

## Digital twins

The existing `TwinService` is the state boundary. Domain simulators can consume telemetry and publish predictions/observations. They cannot dispatch machine commands. Consequential actions return to Core's authorization + safety pipeline.

## Citizen AI assistant

Chatbots should call service metadata and service-request APIs. They may explain requirements, collect form data, and prepare a request. Submission must be attributable to the authenticated citizen and policy-controlled. AI must not make final eligibility, benefits, enforcement, medical, or governmental decisions without human review.

## Predictive analytics

Forecast workers operate on tenant-scoped datasets and return predictions plus confidence/evidence references. Forecasts are advisory and do not directly change budgets, infrastructure, healthcare, or machine state.

## SMPC / privacy analytics

Use an explicit computation contract with authenticated participants and minimum participant thresholds. Return aggregate results or references; never expose individual contributions.

## Edge vision

Edge AI may emit observations and evidence references. It does not issue commands, disable infrastructure, or make final enforcement decisions. Retain the existing safety and human-review boundaries.

## Civic voting

`polls` and `votes` implement civic feedback/consultation primitives. They are **not** a claim of election-grade security. Binding elections require a jurisdiction-approved election system and independent security/audit controls. Privacy-preserving commitments/receipts can be used without putting citizen choices on a public chain.

## Cryptographic agility

Identity/signature implementations should expose algorithm identifiers and provider interfaces. Do not hard-code experimental cryptography or invent post-quantum primitives. Production crypto providers should use current standardized algorithms and managed key custody.
