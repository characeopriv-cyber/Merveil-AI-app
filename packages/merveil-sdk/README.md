# @merveil-ai/sdk

Official JavaScript SDK for the Merveil AI Intelligence Layer.

## Install

```bash
npm install @merveil-ai/sdk
```

## First request

```js
import Merveil from '@merveil-ai/sdk';

const merveil = new Merveil({ apiKey: process.env.MERVEIL_API_KEY });

const answer = await merveil.ai({
  capability: 'real_estate',
  messages: [{ role: 'user', content: 'Summarize this property opportunity.' }]
});

console.log(answer.data?.reply ?? answer.reply);
```

## One integration, multiple intelligence capabilities

Use the same client and key for `general`, `website`, `game`, `agent`, `real_estate`, `business`, `trading`, `vision`, `image`, `video`, and `voice` capabilities. Merveil handles the intelligence routing underneath the API.

The SDK also exposes first-class helpers for Passport, verification, Connect, calls, companies, properties, World, investors, credits, applications, webhooks, OAuth, usage, billing and organizations.

## Production notes

- Never expose a live Merveil API key in browser code. Use your server or a trusted backend.
- Use `mv_test_*` keys for development and `mv_live_*` for production.
- The SDK automatically sends `X-Request-Id` and retries transient `408`, `429`, and `5xx` responses with bounded backoff.
- `MerveilError` exposes `status`, `code`, `requestId`, and `details` for operational handling.

Merveil AI — The Intelligence Layer Beyond Interaction.
