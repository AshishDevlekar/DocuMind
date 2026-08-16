"""
Wraps ChromaDB so the rest of the app doesn't need to know the details.
Uses Chroma's built-in local embedding model (all-MiniLM-L6-v2), so this
works with ZERO API keys and ZERO cost — good for local development.
"""

import chromadb

# Persists to disk in ./chroma_data so your data survives a server restart.
_client = chromadb.PersistentClient(path="./chroma_data")

_collection = _client.get_or_create_collection(
    name="documind_chunks",
    metadata={"hnsw:space": "cosine"},
)


def add_chunks(chunks: list[dict]) -> int:
    """
    chunks: list of dicts with keys id, doc_id, filename, page, text
    Returns the number of chunks added.
    """
    if not chunks:
        return 0

    _collection.add(
        ids=[c["id"] for c in chunks],
        documents=[c["text"] for c in chunks],
        metadatas=[
            {"doc_id": c["doc_id"], "filename": c["filename"], "page": c["page"]}
            for c in chunks
        ],
    )
    return len(chunks)


def query_chunks(question: str, n_results: int = 5, doc_id: str | None = None) -> list[dict]:
    """
    Returns the most semantically relevant chunks for a question.
    Optionally scoped to a single doc_id.
    """
    where_filter = {"doc_id": doc_id} if doc_id else None

    results = _collection.query(
        query_texts=[question],
        n_results=n_results,
        where=where_filter,
    )

    matches = []
    for text, meta, distance in zip(
        results["documents"][0], results["metadatas"][0], results["distances"][0]
    ):
        matches.append({
            "text": text,
            "filename": meta["filename"],
            "page": meta["page"],
            "relevance": round(1 - distance, 3),  # cosine distance -> similarity
        })
    return matches


def list_documents() -> list[dict]:
    """Returns a de-duplicated list of uploaded documents."""
    all_items = _collection.get()
    seen = {}
    for meta in all_items["metadatas"]:
        doc_id = meta["doc_id"]
        if doc_id not in seen:
            seen[doc_id] = {"doc_id": doc_id, "filename": meta["filename"], "chunks": 0}
        seen[doc_id]["chunks"] += 1
    return list(seen.values())


def delete_document(doc_id: str) -> int:
    """Deletes all chunks belonging to a document. Returns count deleted."""
    existing = _collection.get(where={"doc_id": doc_id})
    count = len(existing["ids"])
    if count:
        _collection.delete(where={"doc_id": doc_id})
    return count
