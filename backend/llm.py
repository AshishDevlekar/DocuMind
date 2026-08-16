"""
Takes the raw chunks returned by vectorstore.query_chunks() and turns them
into an actual written answer, with citations back to source pages.

Uses Groq (free, fast) — get a key at https://console.groq.com/keys
and put it in a .env file as GROQ_API_KEY=your_key_here
"""

import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

_api_key = os.getenv("GROQ_API_KEY")
_client = Groq(api_key=_api_key) if _api_key else None

# Fast + free-tier friendly. Swap for a bigger Groq model later if you want
# higher quality answers at the cost of speed.
MODEL = "llama-3.1-8b-instant"


def generate_answer(question: str, matches: list[dict]) -> dict:
    """
    matches: the list returned by vectorstore.query_chunks()
    Returns: {"answer": str, "sources": [{"index", "filename", "page"}]}
    """
    if _client is None:
        return {
            "answer": (
                "No GROQ_API_KEY found. Add one to a .env file in the backend "
                "folder to enable AI-generated answers."
            ),
            "sources": [],
        }

    if not matches:
        return {
            "answer": "I couldn't find anything relevant to that question in the uploaded documents.",
            "sources": [],
        }

    context_blocks = [
        f"[{i}] (Page {m['page']}, {m['filename']}):\n{m['text']}"
        for i, m in enumerate(matches, start=1)
    ]
    context = "\n\n".join(context_blocks)

    prompt = f"""Answer the question using ONLY the context below. If the answer isn't
contained in the context, say so clearly rather than guessing. Cite sources
inline using the bracketed numbers, e.g. [1], matching the context blocks below.

Context:
{context}

Question: {question}

Answer:"""

    response = _client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": "You are a precise assistant that answers strictly from the "
                           "provided context and always cites sources using [1], [2], etc.",
            },
            {"role": "user", "content": prompt},
        ],
        temperature=0.2,
        max_tokens=600,
    )

    answer_text = response.choices[0].message.content

    sources = [
        {"index": i + 1, "filename": m["filename"], "page": m["page"]}
        for i, m in enumerate(matches)
    ]

    return {"answer": answer_text, "sources": sources}
