import json

from fastapi.testclient import TestClient

from api.dependencies import get_embedder, get_llm, get_store
from api.main import app
from rag.vector_store import Retrieved, StoredChunk


class FakeEmbedder:
    def embed(self, texts):
        return [[0.0, 1.0] for _ in texts]


class FakeStore:
    def __init__(self):
        self.added = []

    def add(self, chunks, embeddings):
        self.added.append((chunks, embeddings))

    def query(self, embedding, top_k):
        chunk = StoredChunk(id="c0", text="grounding text", source="doc.pdf", page=1)
        return [Retrieved(chunk=chunk, score=0.9)]


class FakeLLM:
    def stream(self, system, user):
        yield "Grounded "
        yield "answer [1]."


client = TestClient(app)


def test_upload_ingests_and_reports_real_filename():
    store = FakeStore()
    app.dependency_overrides[get_embedder] = lambda: FakeEmbedder()
    app.dependency_overrides[get_store] = lambda: store
    try:
        files = {"file": ("notes.txt", b"First sentence. Second sentence.", "text/plain")}
        response = client.post("/documents", files=files)
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    body = response.json()
    assert body["filename"] == "notes.txt"
    assert body["chunks_added"] >= 1
    assert store.added


def test_ask_streams_sources_then_answer():
    app.dependency_overrides[get_embedder] = lambda: FakeEmbedder()
    app.dependency_overrides[get_store] = lambda: FakeStore()
    app.dependency_overrides[get_llm] = lambda: FakeLLM()
    try:
        response = client.post("/ask", json={"question": "what is x?"})
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    events = _parse_sse(response.text)
    names = [name for name, _ in events]

    assert names[0] == "sources"
    assert "token" in names
    assert names[-1] == "done"
    assert events[0][1][0]["source"] == "doc.pdf"

    answer = "".join(data["text"] for name, data in events if name == "token")
    assert answer == "Grounded answer [1]."


def _parse_sse(raw):
    events = []
    for block in raw.strip().split("\n\n"):
        name_line, data_line = block.split("\n")
        events.append((
            name_line.removeprefix("event: "),
            json.loads(data_line.removeprefix("data: ")),
        ))
    return events