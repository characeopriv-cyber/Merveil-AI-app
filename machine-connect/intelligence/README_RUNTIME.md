# Machine Connect Intelligence Runtime

The intelligence runtime is a deliberately small, separately deployable processing boundary for document extraction.

## Contract

`POST /extract` accepts JSON:

- `mimeType`: `application/pdf` or `text/plain`
- `contentBase64`: base64 encoded document bytes

Optional authentication is enabled with `MC_INTELLIGENCE_RUNTIME_TOKEN`; when set, callers must send `x-runtime-token`.

The response contains:

- `text` — extracted text
- `sha256` — SHA-256 of the original bytes
- `byteSize` — original byte count
- `entities` — conservative extracted entities (empty unless an NLP model is explicitly supplied)

The runtime does not create ontology records or infer relationships. Core remains responsible for tenant authorization, validation, persistence, entity matching, and document/entity links.

## Run

```bash
MC_INTELLIGENCE_RUNTIME_TOKEN='set-in-deployment-secret-store' python runtime_server.py
```

The token must be supplied through the deployment environment, never committed to source control.

## Test

```bash
python -m unittest runtime_server.test
```
