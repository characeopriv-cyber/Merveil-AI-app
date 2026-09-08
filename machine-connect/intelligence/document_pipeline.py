from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

MAX_DOCUMENT_BYTES = 25 * 1024 * 1024
ALLOWED_MIME_TYPES = {"application/pdf", "text/plain"}

@dataclass(frozen=True)
class ExtractedDocument:
    text: str
    sha256: str
    byte_size: int

@dataclass(frozen=True)
class ExtractedEntity:
    name: str
    entity_type: str


def validate_document(data: bytes, mime_type: str) -> None:
    if mime_type not in ALLOWED_MIME_TYPES:
        raise ValueError("unsupported document type")
    if len(data) > MAX_DOCUMENT_BYTES:
        raise ValueError("document exceeds 25 MB limit")


def extract_document(data: bytes, mime_type: str) -> ExtractedDocument:
    validate_document(data, mime_type)
    digest = hashlib.sha256(data).hexdigest()
    if mime_type == "text/plain":
        text = data.decode("utf-8", errors="replace")
    else:
        import fitz
        document = fitz.open(stream=data, filetype="pdf")
        try:
            text = "\n".join(page.get_text("text") for page in document)
        finally:
            document.close()
    return ExtractedDocument(text=text.strip(), sha256=digest, byte_size=len(data))


def normalize_name(value: str) -> str:
    return re.sub(r"\s+", " ", value.strip())


def extract_entities(text: str, nlp=None) -> list[ExtractedEntity]:
    if not text:
        return []
    if nlp is not None:
        doc = nlp(text)
        return _dedupe(ExtractedEntity(normalize_name(ent.text), ent.label_) for ent in doc.ents if ent.text.strip())
    return []


def _dedupe(items: Iterable[ExtractedEntity]) -> list[ExtractedEntity]:
    seen: set[tuple[str, str]] = set()
    result: list[ExtractedEntity] = []
    for item in items:
        key = (item.name.casefold(), item.entity_type)
        if key not in seen:
            seen.add(key)
            result.append(item)
    return result
