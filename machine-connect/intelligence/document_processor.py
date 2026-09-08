"""Safe document-processing primitives for Machine Connect intelligence.

This module is deliberately storage-agnostic: callers provide bytes and a tenant
context. It never executes document contents and never performs machine control.
PDF extraction requires PyMuPDF; NLP enrichment is optional and can be enabled
when spaCy/model assets are installed.
"""
from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass
from typing import Iterable

MAX_DOCUMENT_BYTES = 25 * 1024 * 1024
ALLOWED_MIME_TYPES = {"text/plain", "application/pdf"}


@dataclass(frozen=True)
class ExtractedEntity:
    text: str
    label: str


def validate_document(data: bytes, mime_type: str) -> None:
    if mime_type not in ALLOWED_MIME_TYPES:
        raise ValueError("unsupported document type")
    if not data:
        raise ValueError("document is empty")
    if len(data) > MAX_DOCUMENT_BYTES:
        raise ValueError("document exceeds 25 MB limit")


def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def extract_text(data: bytes, mime_type: str) -> str:
    validate_document(data, mime_type)
    if mime_type == "text/plain":
        return data.decode("utf-8", errors="replace").strip()

    try:
        import fitz  # PyMuPDF
    except ImportError as exc:
        raise RuntimeError("PDF processing requires PyMuPDF") from exc

    with fitz.open(stream=data, filetype="pdf") as pdf:
        return "\n".join(page.get_text("text") for page in pdf).strip()


def extract_entities(text: str) -> list[ExtractedEntity]:
    """Return conservative NLP entities when spaCy is installed.

    The fallback intentionally returns no inferred entities rather than guessing.
    """
    if not text.strip():
        return []
    try:
        import spacy
        nlp = spacy.load("en_core_web_sm")
    except (ImportError, OSError):
        return []

    doc = nlp(text[:1_000_000])
    allowed = {"PERSON", "ORG", "GPE", "PRODUCT", "DATE"}
    seen: set[tuple[str, str]] = set()
    entities: list[ExtractedEntity] = []
    for ent in doc.ents:
        value = re.sub(r"\s+", " ", ent.text).strip()
        key = (value.casefold(), ent.label_)
        if ent.label_ in allowed and value and key not in seen:
            seen.add(key)
            entities.append(ExtractedEntity(value, ent.label_))
    return entities
