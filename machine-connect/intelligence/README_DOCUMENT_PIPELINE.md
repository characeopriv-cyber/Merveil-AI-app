# Document intelligence pipeline

The pipeline accepts only PDF and UTF-8 text documents up to 25 MB. It validates the MIME type and size, extracts text, computes a SHA-256 fingerprint, and optionally extracts entities when an explicitly supplied spaCy pipeline is available.

The fallback is intentionally conservative: without an NLP model it returns no entities rather than inventing graph facts.

The processor is data-only and cannot dispatch machine commands.
