# @merveil-ai/sdk

Official JavaScript SDK for Merveil AI API v1.

## Install

```bash
npm install @merveil-ai/sdk
```

## Quick start

```js
import Merveil from '@merveil-ai/sdk';

const merveil = new Merveil({
  apiKey: process.env.MERVEIL_API_KEY
});

const result = await merveil.ai({
  capability: 'real_estate',
  messages: [
    { role: 'user', content: 'Analyze this property opportunity.' }
  ]
});

console.log(result.reply);
```

Use `mv_test_*` keys for sandbox development and `mv_live_*` keys for production. Keep API keys server-side.

The SDK automatically sends/accepts request IDs, supports bounded retries for transient failures, honors `Retry-After`, and exposes structured `MerveilError` objects.

## Available helpers

`health`, `catalog`, `ai`, `profile`, `passport`, `verification`, `connect`, `createConnection`, `messages`, `call`, `createCall`, `world`, `createWorld`, `properties`, `createProperty`, `companies`, `createCompany`, `investors`, `webhooks`, `createWebhook`, `deleteWebhook`, `oauth`, `usage`, `apps`, `organization`, `createOrganization`, `billing`, `updateBilling`.
