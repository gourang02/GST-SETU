# =========================================
# FILE: init_rag.py
# =========================================

import os
import google.generativeai as genai
from dotenv import load_dotenv

from vector_db import get_chroma_collection

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables.")

genai.configure(api_key=GEMINI_API_KEY)

EMBEDDING_MODEL = "models/gemini-embedding-001"
RULES_FILE_PATH = os.path.join("knowledge", "tax_rules.txt")


def load_rules(file_path: str) -> list[str]:
    """Reads tax_rules.txt and returns a list of non-empty rule chunks."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Could not find rules file at: {file_path}")

    with open(file_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    chunks = [
        line.strip() for line in lines
        if line.strip() and not line.strip().startswith("#")
    ]
    return chunks


def embed_chunk(chunk: str) -> list[float]:
    """Generates an embedding vector for a single rule chunk using Gemini."""
    response = genai.embed_content(
        model=EMBEDDING_MODEL,
        content=chunk,
        task_type="retrieval_document"
    )
    return response["embedding"]


def main() -> None:
    print("Loading tax rules from file...")
    chunks = load_rules(RULES_FILE_PATH)
    print(f"Loaded {len(chunks)} rule chunks.")

    collection = get_chroma_collection()

    ids = []
    embeddings = []
    documents = []

    for idx, chunk in enumerate(chunks):
        rule_id = f"rule_{idx + 1}"
        print(f"Embedding {rule_id}: {chunk[:60]}...")

        try:
            vector = embed_chunk(chunk)
        except Exception as e:
            print(f"FAILED to embed {rule_id}: {str(e)}")
            raise

        ids.append(rule_id)
        embeddings.append(vector)
        documents.append(chunk)

    print("Upserting into ChromaDB collection 'indian_tax_laws'...")
    collection.upsert(
        ids=ids,
        embeddings=embeddings,
        documents=documents
    )

    print(f"RAG initialization complete. {len(ids)} rules indexed.")


if __name__ == "__main__":
    main()