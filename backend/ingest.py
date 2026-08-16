"""
Handles turning a raw PDF into a list of text chunks, each tagged with
the page number it came from. This is the "ingest" half of the RAG pipeline.
"""

import fitz  # PyMuPDF
import uuid


def extract_text_by_page(pdf_bytes: bytes) -> list[dict]:
    """
    Opens a PDF from raw bytes and returns a list like:
    [{"page": 1, "text": "..."}, {"page": 2, "text": "..."}]
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    pages = []
    for page_number, page in enumerate(doc, start=1):
        text = page.get_text().strip()
        if text:  # skip blank pages
            pages.append({"page": page_number, "text": text})
    doc.close()
    return pages


def chunk_text(text: str, max_words: int = 220, overlap_words: int = 40) -> list[str]:
    """
    Splits a block of text into overlapping word-based chunks.
    Overlap helps avoid losing context at chunk boundaries.
    """
    words = text.split()
    if len(words) <= max_words:
        return [text]

    chunks = []
    start = 0
    while start < len(words):
        end = start + max_words
        chunk = " ".join(words[start:end])
        chunks.append(chunk)
        start += max_words - overlap_words
    return chunks


def process_pdf(pdf_bytes: bytes, filename: str, doc_id: str) -> list[dict]:
    """
    Full pipeline: PDF bytes -> list of chunk records ready for the vector store.
    Each record has: id, doc_id, filename, page, text
    """
    pages = extract_text_by_page(pdf_bytes)
    records = []

    for page in pages:
        for chunk in chunk_text(page["text"]):
            records.append({
                "id": str(uuid.uuid4()),
                "doc_id": doc_id,
                "filename": filename,
                "page": page["page"],
                "text": chunk,
            })

    return records
