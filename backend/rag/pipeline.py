from pathlib import Path

from .chunking import chunk_text
from .embeddings import Embedder
from .generation import Answer, LLMClient, generate_answer
from .loaders import load_document
from .retrieval import retrieve
from .vector_store import StoredChunk, VectorStore


def ingest_file(path: Path, embedder: Embedder, store: VectorStore) -> int:
    chunks = _build_chunks(path)
    if not chunks:
        return 0

    embeddings = embedder.embed([chunk.text for chunk in chunks])
    store.add(chunks, embeddings)
    return len(chunks)


def answer_question(
    question: str,
    embedder: Embedder,
    store: VectorStore,
    llm: LLMClient,
    top_k: int = 5,
) -> Answer:
    retrieved = retrieve(question, embedder, store, top_k=top_k)
    return generate_answer(question, retrieved, llm)


def _build_chunks(path: Path) -> list[StoredChunk]:
    chunks = []
    for document in load_document(path):
        for chunk in chunk_text(document.text):
            chunks.append(
                StoredChunk(
                    id=_chunk_id(document.source, document.page, chunk.index),
                    text=chunk.text,
                    source=document.source,
                    page=document.page,
                )
            )
    return chunks


def _chunk_id(source: str, page: int | None, index: int) -> str:
    return f"{source}:p{page or 0}:c{index}"