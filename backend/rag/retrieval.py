from .embeddings import Embedder
from .vector_store import Retrieved, VectorStore


def retrieve(
    question: str,
    embedder: Embedder,
    store: VectorStore,
    top_k: int = 5,
) -> list[Retrieved]:
    query_embedding = embedder.embed([question])[0]
    return store.query(query_embedding, top_k=top_k)