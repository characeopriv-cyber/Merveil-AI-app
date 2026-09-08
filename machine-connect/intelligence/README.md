# Machine Connect Intelligence Runtime

Background analytics and document processing workers are isolated from the NestJS control plane.

Safety boundaries:
- Never execute machine commands.
- Treat uploaded files as untrusted input.
- Bound file size, extracted text, and entity counts.
- Preserve source provenance for every extraction.
