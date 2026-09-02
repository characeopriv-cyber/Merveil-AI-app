# Merveil AI Developer Quickstart

Merveil provides one governed API boundary for intelligence and connected capabilities.

## 1. Create a credential
Use the Developer Portal to create an application and generate an `mv_test_*` credential. Keep credentials server-side and never expose them in browser code.

## 2. Call Merveil Intelligence

```js
const response = await fetch('https://api.merveil.ai/api/v1/ai', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': process.env.MERVEIL_API_KEY,
    'X-Request-Id': crypto.randomUUID()
  },
  body: JSON.stringify({
    capability: 'real_estate',
    messages: [
      { role: 'user', content: 'Analyze this property opportunity.' }
    ]
  })
});

const data = await response.json();
```

## 3. Change capability without changing providers

The developer selects the Merveil capability. Merveil handles the intelligence provider routing underneath the API boundary.

Examples: `general`, `real_estate`, `business`, `trading`, `agent`, `vision`, `image`, `video`, `voice`, `game`.

## 4. Move to production

Validate the integration in sandbox, monitor usage and quota headers, then create/activate the commercial subscription and use an `mv_live_*` credential.

## 5. Production rules

- Never put API keys in client-side JavaScript.
- Use OAuth where delegated user authorization is required.
- Store webhook signing secrets securely.
- Verify webhook signatures before processing events.
- Use request IDs for support and tracing.
- Respect rate-limit and quota headers.

Merveil's principle: **integrate once with Merveil; Merveil evolves the intelligence layer underneath.**
