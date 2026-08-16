DocuMind — AI Document Q&A Assistant

DocuMind is a Retrieval-Augmented Generation (RAG) application that lets you upload a PDF and ask questions about it in plain English. It returns a written answer grounded in the document's actual content, with citations back to the source page — instead of relying purely on an LLM's memory, it retrieves the relevant passages first and generates an answer from them.
Live demo: docu-mind-ruddy.vercel.app

Why I built this

My other projects lean toward classic ML and computer vision. DocuMind was built to demonstrate applied LLM engineering — specifically the RAG pattern that underlies most real-world AI document tools (search assistants, internal knowledge bases, contract review tools, etc.) — and to get hands-on experience deploying a decoupled frontend/backend architecture to production.

How it works
Upload — a PDF is uploaded and parsed with PyMuPDF, then split into overlapping text chunks.
Embed & store — each chunk is embedded using a local embedding model and stored in a ChromaDB vector store, so no external API is needed just to index a document.
Retrieve — when a question is asked, the most semantically relevant chunks are retrieved from ChromaDB via vector similarity search.
Generate — those chunks, plus the question, are sent to an LLM (via the Groq API) to generate a grounded, cited answer.
Respond — the answer is returned to the chat interface along with the source page(s) it was drawn from.

Tech stack

Backend

FastAPI (Python) — REST API
PyMuPDF — PDF text extraction
ChromaDB — local vector database
Groq API (llama-3.1-8b-instant) — LLM-generated answers
Deployed on Render

Frontend

React + Vite
Tailwind CSS v4
lucide-react (icons)


The frontend and backend are deployed independently and communicate over HTTPS, with CORS explicitly configured on the backend to only accept requests from the deployed frontend's domain. Secrets (API keys) are stored as environment variables on the hosting platform and are never committed to source control.

Project structure
documind/
├── backend/
│   ├── main.py          # FastAPI app — /upload, /documents, /query, /ask endpoints
│   ├── ingest.py         # PDF text extraction + chunking
│   ├── vectorstore.py    # ChromaDB setup + similarity search
│   ├── llm.py            # Groq API call — generates the final answer
│   └── requirements.txt
└── frontend/
    └── src/
        ├── api.js
        ├── App.jsx
        └── components/
            ├── Sidebar.jsx
            ├── ChatWindow.jsx
            └── SourceCitations.jsx

Running locally
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
# create a .env file with GROQ_API_KEY=your_key_here
uvicorn main:app --reload

Frontend
cd frontend
npm install
# create a .env file with VITE_API_BASE=http://127.0.0.1:8000
npm run dev

What I'd improve with more time
Persistent storage for the vector database (e.g. a managed Postgres + pgvector, or a paid persistent disk)
Streaming responses instead of waiting for the full answer
Support for multiple simultaneous documents in one conversation
Swappable LLM backend (Groq / Claude / self-hosted via Ollama)

Author

Ashish Devlekar

Deployed on Vercel

Architecture
