import json
import shutil
import tempfile
from collections.abc import Iterator
from pathlib import Path

from fastapi import APIRouter, Depends, UploadFile
from fastapi import HTTPException
from fastapi.responses import StreamingResponse

from rag.embeddings import Embedder
from rag.generation import SYSTEM_PROMPT, LLMClient, build_prompt, build_sources
from rag.pipeline import ingest_file
from rag.retrieval import retrieve
from rag.vector_store import VectorStore

from .config import get_settings
from .dependencies import get_embedder, get_llm, get_store
from .schemas import AskRequest, DocumentInfo, IngestResponse, SourceModel

router = APIRouter()


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.post("/documents", response_model=IngestResponse)
def upload_document(
    file: UploadFile,
    embedder: Embedder = Depends(get_embedder),
    store: VectorStore = Depends(get_store),
) -> IngestResponse:
    with tempfile.TemporaryDirectory() as tmp_dir:
        # Keep original filename so citations report the real source.
        path = Path(tmp_dir) / (file.filename or "upload")
        with path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        chunks_added = ingest_file(path, embedder, store)
    return IngestResponse(filename=path.name, chunks_added=chunks_added)


@router.post("/ask")
def ask(
    request: AskRequest,
    embedder: Embedder = Depends(get_embedder),
    store: VectorStore = Depends(get_store),
    llm: LLMClient = Depends(get_llm),
) -> StreamingResponse:
    stream = _answer_stream(request.question, embedder, store, llm)
    return StreamingResponse(stream, media_type="text/event-stream")

@router.delete("/documents/{filename}")
def delete_document(
    filename: str,
    store: VectorStore = Depends(get_store),
) -> dict[str, str]:
    if filename in get_settings().protected_documents:
        raise HTTPException(status_code=403, detail="This document can't be removed.")
    store.delete_source(filename)
    return {"deleted": filename}


def _answer_stream(
    question: str,
    embedder: Embedder,
    store: VectorStore,
    llm: LLMClient,
) -> Iterator[str]:
    retrieved = retrieve(question, embedder, store, top_k=get_settings().top_k)
    sources = build_sources(retrieved)
    # Sources are known before generation, so send them first. The client can display them while the answer is being generated.
    yield _event("sources", [SourceModel.model_validate(s).model_dump() for s in sources])

    prompt = build_prompt(question, sources)
    for token in llm.stream(SYSTEM_PROMPT, prompt):
        yield _event("token", {"text": token})
    yield _event("done", {})
    
def _event(name: str, data: object) -> str:
    return f"event: {name}\ndata: {json.dumps(data)}\n\n"

@router.get("/documents", response_model=list[DocumentInfo])
def list_documents(store: VectorStore = Depends(get_store)) -> list[DocumentInfo]:
    return [
        DocumentInfo(filename=filename, chunks=chunks)
        for filename, chunks in store.list_documents()
    ]