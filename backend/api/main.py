from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from rag.pipeline import ingest_file
from .config import get_settings
from .dependencies import get_embedder, get_store
from .routes import router

SEED_DIR = Path(__file__).resolve().parent.parent / "seed"


def _seed_documents() -> None:
    if not SEED_DIR.is_dir():
        return
    embedder, store = get_embedder(), get_store()
    for pdf in sorted(SEED_DIR.glob("*.pdf")):
        ingest_file(pdf, embedder, store)


@asynccontextmanager
async def lifespan(app: FastAPI):
    _seed_documents()
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="Pull The Receipts", lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(router)
    return app


app = create_app()