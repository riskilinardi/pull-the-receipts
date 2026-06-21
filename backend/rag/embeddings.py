from typing import Protocol

from sentence_transformers import SentenceTransformer


class Embedder(Protocol):
    def embed(self, texts: list[str]) -> list[list[float]]: ...


class SentenceTransformerEmbedder:
    def __init__(self, model_name: str = "BAAI/bge-small-en-v1.5"):
        self._model = SentenceTransformer(model_name)

    def embed(self, texts: list[str]) -> list[list[float]]:
        # Normalised vectors would turn cosine similarity into a plain for product. bge-small is trained for it and the Chroma collection expects it.
        embeddings = self._model.encode(texts, normalize_embeddings=True)
        return embeddings.tolist()