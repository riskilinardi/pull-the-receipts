from functools import lru_cache

from rag.embeddings import Embedder, SentenceTransformerEmbedder
from rag.generation import LLMClient, OpenAIClient
from rag.vector_store import ChromaVectorStore, VectorStore

from .config import get_settings


@lru_cache
def get_embedder() -> Embedder:
    # One instance per process — loading the embedding model is expensive.
    return SentenceTransformerEmbedder(get_settings().embedding_model)


@lru_cache
def get_store() -> VectorStore:
    return ChromaVectorStore(path=get_settings().chroma_path)


@lru_cache
def get_llm() -> LLMClient:
    settings = get_settings()
    return OpenAIClient(model=settings.llm_model, api_key=settings.openai_api_key)