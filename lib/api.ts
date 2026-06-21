import type { IngestedDocument, Source } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const PROTECTED_DOCUMENTS = [
  "FYP-Project-Proposal.pdf",
  "NEA-Annual-Report-2023-2024.pdf",
];

export async function ingestDocument(file: File): Promise<IngestedDocument> {
  const body = new FormData();
  body.append("file", file);

  const response = await fetch(`${API_URL}/documents`, {
    method: "POST",
    body,
  });
  if (!response.ok) {
    throw new Error(`Upload failed (${response.status})`);
  }

  const data = await response.json();
  return { filename: data.filename, chunks: data.chunks_added };
}

export type AnswerEvent =
  | { type: "sources"; sources: Source[] }
  | { type: "token"; text: string }
  | { type: "done" };

export async function* streamAnswer(
  question: string,
  signal?: AbortSignal,
): AsyncGenerator<AnswerEvent> {
  const response = await fetch(`${API_URL}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
    signal,
  });

  if (!response.ok || !response.body) {
    throw new Error(`Request failed (${response.status})`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // Events are separated by newlines. Parse only complete events, and keep the rest in the buffer for the next iteration.
    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() ?? "";

    for (const block of blocks) {
      const event = parseEvent(block);
      if (event) yield event;
    }
  }
}

function parseEvent(block: string): AnswerEvent | null {
  const lines = block.split("\n");
  const name = lines
    .find((line) => line.startsWith("event:"))
    ?.slice(6)
    .trim();
  const payload = lines
    .find((line) => line.startsWith("data:"))
    ?.slice(5)
    .trim();
  if (!name || !payload) return null;

  const data = JSON.parse(payload);
  switch (name) {
    case "sources":
      return { type: "sources", sources: data };
    case "token":
      return { type: "token", text: data.text };
    case "done":
      return { type: "done" };
    default:
      return null;
  }
}

export async function deleteDocument(filename: string): Promise<void> {
  const response = await fetch(
    `${API_URL}/documents/${encodeURIComponent(filename)}`,
    {
      method: "DELETE",
    },
  );
  if (!response.ok) {
    throw new Error(`Delete failed (${response.status})`);
  }
}

export async function listDocuments(): Promise<IngestedDocument[]> {
  const response = await fetch(`${API_URL}/documents`);
  if (!response.ok) {
    throw new Error(`Failed to load documents (${response.status})`);
  }
  return response.json();
}
