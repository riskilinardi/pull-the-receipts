from dataclasses import dataclass
import re


@dataclass(frozen=True)
class Chunk:
    text: str
    index: int


_SENTENCE_BOUNDARY = re.compile(r"(?<=[.!?])\s+")


def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 150) -> list[Chunk]:
    sentences = _split_sentences(text, max_len=chunk_size)
    if not sentences:
        return []

    bodies: list[str] = []
    current: list[str] = []
    length = 0

    for sentence in sentences:
        if length + len(sentence) > chunk_size and current:
            bodies.append(" ".join(current))
            current, length = _carry_overlap(current, overlap)
        current.append(sentence)
        length += len(sentence) + 1

    if current:
        bodies.append(" ".join(current))

    return [Chunk(text=body, index=i) for i, body in enumerate(bodies)]


def _split_sentences(text: str, max_len: int) -> list[str]:
    cleaned = re.sub(r"\s+", " ", text).strip()
    sentences = (s for s in _SENTENCE_BOUNDARY.split(cleaned) if s)
    # PDFs sometimes have long runs with no sentence punctuation. Cap them to avoid creating huge chunks that will exceed the chunk budget.
    return [piece for s in sentences for piece in _hard_wrap(s, max_len)]


def _hard_wrap(sentence: str, max_len: int) -> list[str]:
    if len(sentence) <= max_len:
        return [sentence]
    return [sentence[i : i + max_len] for i in range(0, len(sentence), max_len)]


def _carry_overlap(sentences: list[str], overlap: int) -> tuple[list[str], int]:
    carried: list[str] = []
    length = 0
    for sentence in reversed(sentences):
        if length + len(sentence) > overlap:
            break
        carried.insert(0, sentence)
        length += len(sentence) + 1
    return carried, length