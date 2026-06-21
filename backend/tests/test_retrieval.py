from rag.retrieval import retrieve
from rag.vector_store import Retrieved, StoredChunk


class FakeEmbedder:
    def __init__(self):
        self.embedded: list[str] = []

    def embed(self, texts):
        self.embedded.extend(texts)
        return [[0.1, 0.2, 0.3] for _ in texts]


class FakeStore:
    def __init__(self, results):
        self._results = results
        self.last_query = None
        self.last_top_k = None

    def add(self, chunks, embeddings): ...

    def query(self, embedding, top_k):
        self.last_query = embedding
        self.last_top_k = top_k
        return self._results[:top_k]


def _retrieved(i):
    chunk = StoredChunk(id=f"c{i}", text=f"chunk {i}", source="doc.pdf", page=i)
    return Retrieved(chunk=chunk, score=1.0 - i * 0.1)


def test_retrieve_embeds_the_question():
    embedder = FakeEmbedder()
    retrieve("what is x?", embedder, FakeStore([_retrieved(0)]))
    assert embedder.embedded == ["what is x?"]


def test_retrieve_passes_query_embedding_to_store():
    store = FakeStore([_retrieved(0)])
    retrieve("q", FakeEmbedder(), store)
    assert store.last_query == [0.1, 0.2, 0.3]


def test_retrieve_respects_top_k():
    store = FakeStore([_retrieved(i) for i in range(5)])
    results = retrieve("q", FakeEmbedder(), store, top_k=3)
    assert store.last_top_k == 3
    assert len(results) == 3