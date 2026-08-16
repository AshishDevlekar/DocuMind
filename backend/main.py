"""
DocuMind backend — Phase 1 + basic Phase 2 retrieval.

Endpoints:
  POST   /upload            upload a PDF, extract + chunk + embed it
  GET    /documents         list uploaded documents
  DELETE /documents/{id}    remove a document and its chunks
  POST   /query             ask a question, get back the most relevant chunks
                             (no LLM answer synthesis yet — that's the next step)

Run with:  uvicorn main:app --reload
"""

import uuid

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ingest import process_pdf
from vectorstore import add_chunks, query_chunks, list_documents, delete_document
from llm import generate_answer

import os

app = FastAPI(title="DocuMind API")

# Localhost is always allowed for local dev. Add your deployed frontend URL
# via the ALLOWED_ORIGINS environment variable (comma-separated) once deployed.
default_origins = ["http://localhost:5173", "http://localhost:3000"]
extra_origins = os.getenv("ALLOWED_ORIGINS", "")
allowed_origins = default_origins + [o.strip() for o in extra_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"status": "DocuMind API is running"}


@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported right now.")

    pdf_bytes = await file.read()
    doc_id = str(uuid.uuid4())

    chunks = process_pdf(pdf_bytes, filename=file.filename, doc_id=doc_id)
    if not chunks:
        raise HTTPException(status_code=400, detail="No extractable text found in this PDF.")

    added = add_chunks(chunks)

    return {
        "doc_id": doc_id,
        "filename": file.filename,
        "chunks_added": added,
    }


@app.get("/documents")
def get_documents():
    return {"documents": list_documents()}


@app.delete("/documents/{doc_id}")
def remove_document(doc_id: str):
    deleted = delete_document(doc_id)
    if deleted == 0:
        raise HTTPException(status_code=404, detail="Document not found.")
    return {"doc_id": doc_id, "chunks_deleted": deleted}


class QueryRequest(BaseModel):
    question: str
    doc_id: str | None = None
    n_results: int = 5


@app.post("/query")
def query_documents(req: QueryRequest):
    """Raw retrieval — returns matching chunks, no LLM involved. Useful for debugging."""
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    matches = query_chunks(req.question, n_results=req.n_results, doc_id=req.doc_id)
    return {"question": req.question, "matches": matches}


@app.post("/ask")
def ask_documents(req: QueryRequest):
    """The real user-facing endpoint — retrieval + an actual written, cited answer."""
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    matches = query_chunks(req.question, n_results=req.n_results, doc_id=req.doc_id)
    result = generate_answer(req.question, matches)
    return {"question": req.question, **result}
