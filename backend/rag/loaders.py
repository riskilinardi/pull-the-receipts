# To get the text out from the documents including the page number for pdfs. 

from dataclasses import dataclass
from pathlib import Path

from pypdf import PdfReader


@dataclass
class SourceDocument:
    text: str
    source: str
    page: int | None = None


def load_document(path: Path) -> list[SourceDocument]:
    suffix = path.suffix.lower()
    if suffix == ".pdf":
        return _load_pdf(path)
    if suffix in {".txt", ".md"}:
        return [SourceDocument(text=path.read_text(encoding="utf-8"), source=path.name)]
    raise ValueError(f"Unsupported file type: {suffix}")


def _load_pdf(path: Path) -> list[SourceDocument]:
    reader = PdfReader(path)
    pages = []
    for number, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        if text.strip():
            pages.append(SourceDocument(text=text, source=path.name, page=number))
    return pages