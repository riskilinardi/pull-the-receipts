from dataclasses import dataclass
from typing import Protocol

import chromadb


@dataclass
class StoredChunk:
    id: str
    text: str
    source: str
    page: int | None


@dataclass
class Retrieved:
    chunk: StoredChunk
    score: float


class VectorStore(Protocol):
    def add(self, chunks: list[StoredChunk], embeddings: list[list[float]]) -> None: ...
    def query(self, embedding: list[float], top_k: int) -> list[Retrieved]: ...
    def delete_source(self, source: str) -> None: ...
    def list_documents(self) -> list[tuple[str, int]]: ...


class ChromaVectorStore:
    def __init__(self, path: str = "./chroma", collection: str = "documents"):
        client = chromadb.PersistentClient(path=path)
        self._collection = client.get_or_create_collection(
            name=collection,
            metadata={"hnsw:space": "cosine"},
        )

    def add(self, chunks: list[StoredChunk], embeddings: list[list[float]]) -> None:
        self._collection.upsert(
            ids=[chunk.id for chunk in chunks],
            embeddings=embeddings,
            documents=[chunk.text for chunk in chunks],
            metadatas=[self._metadata(chunk) for chunk in chunks],
        )

    def query(self, embedding: list[float], top_k: int) -> list[Retrieved]:
        result = self._collection.query(query_embeddings=[embedding], n_results=top_k)
        hits = zip(
            result["ids"][0],
            result["documents"][0],
            result["metadatas"][0],
            result["distances"][0],
        )
        return [
            Retrieved(
                chunk=StoredChunk(
                    id=id_,
                    text=text,
                    source=metadata["source"],
                    page=metadata.get("page"),
                ),
                score=1 - distance,  # cosine distance -> similarity
            )
            for id_, text, metadata, distance in hits
        ]

    @staticmethod
    def _metadata(chunk: StoredChunk) -> dict:
        # Chroma rejects None values. So it will omit the page number if it doesnt exist.
        metadata = {"source": chunk.source}
        if chunk.page is not None:
            metadata["page"] = chunk.page
        return metadata
    
    def delete_source(self, source: str) -> None:
        self._collection.delete(where={"source": source})

    def list_documents(self) -> list[tuple[str, int]]:
        result = self._collection.get(include=["metadatas"])
        counts: dict[str, int] = {}
        for metadata in result["metadatas"]:
            source = metadata["source"]
            counts[source] = counts.get(source, 0) + 1
        return sorted(counts.items())