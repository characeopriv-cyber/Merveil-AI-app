# Merveil AI

**The Intelligence Beyond Interaction**

Merveil AI is a trusted intelligence and interaction platform built by **IVONIX**. It brings together trusted identity, people, companies, property, communication, discovery, AI and developer infrastructure inside one ecosystem.

The product is designed as more than a social application: Merveil is also a platform that other companies and developers can build on.

## Product Architecture

Merveil is organized into two connected layers:

### 1. Merveil Consumer Experience

The main Merveil experience gives citizens a unified environment for:

- **Merveil Passport** — progressive trusted identity and profile layer, with jurisdiction-aware verification.
- **Connect** — intelligent people discovery, online/offline presence, messaging and trusted connections.
- **World Reels** — broad/global content discovery.
- **Pulse Reels** — specialized real-estate content and intelligence; this is intentionally limited to the real-estate industry.
- **Souk** — marketplace experience.
- **Work** — professional opportunities and ecosystem interactions.
- **Investor** — premium investment and opportunity discovery across areas such as technology, AI, e-commerce and real estate.
- **Arena** — Merveil's engagement/game layer, connected to the credit economy and intelligence experience.
- **Merveil Credits** — an internal utility layer for selected boosts, engagement actions, benefits and future ecosystem services.
- **Connected Life** — OAuth-based integrations intended to connect supported external services to a user's Merveil experience.

### 2. Merveil Developer Platform

The **Developer Platform is the main external entry point for companies and developers**. Specialized platform capabilities are exposed through one professional gateway instead of creating a collection of disconnected external websites.

Developer capabilities include:

- Applications and sandbox environments
- API authentication and application credentials
- Merveil Intelligence APIs
- Identity / Passport APIs
- People and Connect capabilities
- Company capabilities
- Property capabilities
- Communication capabilities
- OAuth client infrastructure
- Signed webhooks
- Application-scoped webhook delivery
- Webhook signing-secret encryption
- Resilient webhook/outbox processing and retries
- Automatic application-side events, including `profile.updated`
- API usage event tracking
- API plans and commercial-plan infrastructure
- Developer usage and application management

**Developer entry point:** `/developer`

Sandbox credentials use `mv_test_*`. Production credentials use `mv_live_*` and are not presented as a free sandbox feature. API secrets must remain server-side; browser/mobile clients should use their own backend and OAuth where delegated access is required.

## Developer Platform Architecture

The developer layer is backed by dedicated API platform data structures including:

- `api_applications`
- `api_oauth_clients`
- `api_webhooks`
- `api_usage_events`
- `api_plans`
- Related API authentication, delivery and platform infrastructure

Webhook delivery is application-scoped so events cannot leak between developer applications. Signing secrets are encrypted consistently across dispatch and retry flows. The outbox processor is resilient so one failing subscriber does not stop delivery to other subscribers.

Supabase triggers provide automatic platform-side events such as `profile.updated`.

## Security Principles

- Server-side API secrets only
- Publishable Supabase credentials separated from server-only service credentials
- Application-scoped authorization and webhook delivery
- Encrypted webhook signing secrets
- OAuth for delegated access
- Sandbox/production credential separation
- Progressive identity verification based on jurisdiction
- Authorized-device and security monitoring architecture
- Audit and moderation infrastructure

## Identity & Passport

Merveil Passport is the trusted profile and verification layer. Passport completion is progressive rather than forcing every user through the entire process during initial onboarding.

Verification adapts to jurisdiction. For example, UAE verification can use Emirates ID, while other jurisdictions can use supported identity documents such as passports or driver's licenses.

Passport also serves as a foundation for professional, company, investor and ecosystem experiences.

## Connect & Communication

Connect is designed around intelligent discovery rather than a conventional social-follow model. The experience supports citizens, circles, messaging and presence, with real-time architecture for online/offline state and communication.

The platform is intended to let Merveil mediate trusted interactions rather than simply reproducing a conventional social network.

## Discovery & Industry Experiences

### World Reels

The global discovery layer for broad content and conversations across the Merveil ecosystem.

### Pulse Reels

A dedicated real-estate intelligence/content experience. **Pulse Reels is specifically for the real-estate industry**, while World Reels remains the broader global discovery experience.

### Investor

A premium opportunity feed for areas including technology, AI, e-commerce and real estate. It is designed as an investment-oriented experience rather than simply another reels feed.

### Souk & Work

Souk provides marketplace functionality, while Work provides professional and opportunity-oriented interactions.

## Arena & Credits

Arena is Merveil's interactive engagement layer, including games built by IVONIX and connected to the Merveil credit economy.

Credits can be used for selected ecosystem actions such as boosts, Super Likes, Connect-related actions, discounts and other approved utilities.

The Arena experience is also designed to evolve into a live intelligence and engagement surface rather than functioning as a standalone casual-games section.

## Connected Life & Integrations

Merveil is designed to support OAuth-based connections with external services where appropriate. The integration architecture can support services such as social networks, professional networks, productivity tools, calendars, media services and mobility/commerce platforms.

Integrations are permission-based and should use OAuth/delegated access rather than exposing third-party credentials to the Merveil frontend.

## Admin & Trust Infrastructure

The platform includes administrative and trust infrastructure for:

- Citizen/account management
- Passport verification
- Authorized-device management
- Security monitoring
- Fraud detection
- Content moderation
- Reports and human review
- Property/investor activity monitoring
- AI detection workflows
- Analytics
- Audit logs

## V1 Scope

The current V1 direction prioritizes the core Merveil product and the developer platform foundation.

**Date Me is intentionally excluded from V1** and should not be treated as a V1 dependency.

The focus is on making the core experience reliable, production-ready and useful before expanding into additional optional experiences.

## Production Infrastructure

Current core infrastructure uses:

- **Frontend / deployment:** Vercel
- **Source control:** GitHub
- **Backend / database / auth infrastructure:** Supabase
- **AI infrastructure:** Anthropic API
- **Production Supabase project:** `dixfybqlepticyudikuz`

Client-side code must use only publishable credentials. Server-only Supabase service credentials must remain in secure deployment environment variables and must never be committed to the repository.

## Developer Onboarding

The intended external-company journey is:

1. Create an organization/application.
2. Start in the sandbox with `mv_test_*` credentials.
3. Make the first Merveil Intelligence request.
4. Configure OAuth and signed webhooks when needed.
5. Review usage and select a commercial plan.
6. Complete the required commercial/payment activation flow.
7. Activate production and issue `mv_live_*` credentials.

## Product Philosophy

Merveil is not being built as another isolated social application.

The long-term architecture is:

**People + Identity + Intelligence + Communication + Property + Companies + Discovery + Developer Infrastructure**

inside one trusted ecosystem.

The consumer product creates the network and intelligence layer. The Developer Platform turns that infrastructure into something external companies and developers can build upon.

---

**Merveil AI — The Intelligence Beyond Interaction**  
**By IVONIX**
