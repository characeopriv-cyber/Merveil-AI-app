# Merveil Security Implementation Status

This document is intentionally conservative. A feature is marked verified only when its cryptographic or provider-backed behavior is actually implemented and tested.

## Implemented
- Private GitHub repository.
- Verified Supabase Auth identity path; no JWT-sub warm-session authentication.
- Forced RLS and browser privilege removal on sensitive control-plane tables.
- E2EE device/conversation storage primitives and client Web Crypto primitives.
- Honest E2EE UI: the product must not display a verified E2EE claim without a completed cryptographic handshake.
- Pre-send URL scheme/host checks.
- Executable/active-script upload blocking and 100 MB client/server metadata limits.
- Unknown-connection warning before message/call entry.
- Scam/money-language safety signals and progressive enforcement primitives.
- Server-side queues/tables for content scanning, identity risk, notifications and enforcement.

## Still requires external/provider integration before claiming complete
- Malware scanning of actual uploaded bytes (metadata blocking is not malware scanning).
- Image/video/audio policy classification before publication.
- Production KYC document verification and face liveness/anti-spoofing provider.
- Transactional email provider configuration and delivery testing.
- WhatsApp Business/API provider configuration and delivery testing.
- Full application-level E2EE message integration across all message send/read paths.
- End-to-end encrypted call media implementation and independent verification. WebRTC transport encryption alone is not treated as sufficient for the strongest Merveil claim.
- Key rotation, device addition/removal, recovery and identity verification UX for E2EE.

## Product safety rule
Private E2EE content cannot simultaneously be plaintext-inspected by the Merveil server without weakening the E2EE guarantee. Safety checks for private E2EE messages must therefore run client-side before encryption, while public uploads can be scanned server-side before publication.

No user-facing screen should say "100% secure", "AI verified", or "E2EE protected" unless the corresponding implementation and test evidence exists.
