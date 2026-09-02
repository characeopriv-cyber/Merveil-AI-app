# Merveil AI Developer Quickstart

Merveil provides one governed API boundary for intelligence and connected capabilities.

## 1. Create a credential

Use the Developer Portal to create an application and generate an `mv_test_*` credential. Keep credentials server-side and never expose them in browser or mobile client code.

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

if (!response.ok) {
  const error = await response.json();
  throw new Error(`${error.error || 'request_failed'} · request ${error.request_id || 'unknown'}`);
}

const data = await response.json();
console.log(data.reply);
```

You can also send a simple `prompt` instead of `messages`:

```js
body: JSON.stringify({
  capability: 'business',
  prompt: 'Summarize this company opportunity.'
})
```

## 3. Change capability without changing providers

The developer selects the Merveil capability. Merveil handles intelligence provider routing underneath the API boundary.

Examples: `general`, `website`, `real_estate`, `business`, `trading`, `agent`, `vision`, `image`, `video`, `voice`, `game`.

The underlying provider is intentionally abstracted from the developer response. Merveil owns the orchestration and governed API boundary; external model providers may be used underneath today.

## 4. Test safely in sandbox

Use an `mv_test_*` credential while developing. Sandbox requests are rate-limited and quota-metered. Use `X-Request-Id` to trace support issues and inspect `X-RateLimit-*` / `X-Quota-*` response headers.

## 5. Move to production

Validate the integration in sandbox, monitor usage and quota headers, then activate the applicable commercial subscription and use an `mv_live_*` credential. Production keys should only exist in your server-side secret manager.

## 6. Production rules

- Never put API keys in client-side JavaScript, browser bundles or mobile apps.
- Use OAuth where delegated user authorization is required.
- Store webhook signing secrets securely.
- Verify webhook signatures before processing events.
- Use request IDs for support and tracing.
- Respect rate-limit and quota headers.
- Request only the scopes your integration actually needs.

Merveil's principle: **integrate once with Merveil; Merveil evolves the intelligence layer underneath.**
