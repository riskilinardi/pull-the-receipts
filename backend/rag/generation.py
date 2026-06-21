from collections.abc import Iterator
from dataclasses import dataclass
from typing import Protocol

from openai import OpenAI

from .vector_store import Retrieved


@dataclass
class Source:
    number: int
    text: str
    source: str
    page: int | None
    score: float


@dataclass
class Answer:
    text: str
    sources: list[Source]


class LLMClient(Protocol):
    def stream(self, system: str, user: str) -> Iterator[str]: ...


class OpenAIClient:
    def __init__(self, model: str = "gpt-4o-mini", api_key: str | None = None):
        self._client = OpenAI(api_key=api_key)
        self._model = model

    def stream(self, system: str, user: str) -> Iterator[str]:
        response = self._client.chat.completions.create(
            model=self._model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=0,
            stream=True,
        )
        for chunk in response:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta


SYSTEM_PROMPT = """You answer questions using only the numbered sources provided.

Rules:
- Every claim must come from the sources. Do not use outside knowledge.
- Cite the source after each claim using its number in brackets, like [1] or [2][3].
- If the sources don't contain the answer, say so directly. Do not guess or fill gaps.
"""


def build_sources(retrieved: list[Retrieved]) -> list[Source]:
    return [
        Source(
            number=number,
            text=hit.chunk.text,
            source=hit.chunk.source,
            page=hit.chunk.page,
            score=hit.score,
        )
        for number, hit in enumerate(retrieved, start=1)
    ]


def build_prompt(question: str, sources: list[Source]) -> str:
    context = "\n\n".join(f"[{s.number}] {s.text}" for s in sources)
    return f"Sources:\n{context}\n\nQuestion: {question}"


def generate_answer(question: str, retrieved: list[Retrieved], llm: LLMClient) -> Answer:
    sources = build_sources(retrieved)
    prompt = build_prompt(question, sources)
    text = "".join(llm.stream(SYSTEM_PROMPT, prompt))
    return Answer(text=text, sources=sources)