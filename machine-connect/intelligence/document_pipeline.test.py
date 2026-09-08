from document_pipeline import extract_document, extract_entities


def test_plain_text_extraction_is_deterministic():
    result = extract_document(b"Acme Corporation", "text/plain")
    assert result.text == "Acme Corporation"
    assert len(result.sha256) == 64
    assert result.byte_size == len(b"Acme Corporation")


def test_entity_extraction_without_nlp_is_conservative():
    assert extract_entities("Acme Corporation", None) == []
