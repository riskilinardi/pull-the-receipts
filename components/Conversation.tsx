"use client";

import { useEffect, useRef, useState } from "react";

import type { Exchange } from "@/lib/types";
import { ExchangeView } from "./Exchange";

interface Props {
  exchanges: Exchange[];
  isBusy: boolean;
  canAsk: boolean;
  onAsk: (question: string) => void;
  onStop: () => void;
  onClear: () => void;
}

const EXAMPLES = [
  "What is the main focus on the NEA Annual Report?",
  "What does the NEA report cover? Be detailed.",
  "What is the project details of the FYP project?",
  "What is the weather forecast today?",
];

export function Conversation({
  exchanges,
  isBusy,
  canAsk,
  onAsk,
  onStop,
  onClear,
}: Props) {
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [exchanges]);

  const submit = () => {
    const question = draft.trim();
    if (!question || isBusy) return;
    onAsk(question);
    setDraft("");
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  const hasConversation = exchanges.length > 0;

  return (
    <section className="flex flex-1 flex-col lg:min-h-0">
      {hasConversation && (
        <div className="flex shrink-0 items-center justify-end border-b border-line px-4 py-2.5 lg:px-10">
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-raised px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-danger hover:text-danger"
          >
            <span aria-hidden className="text-sm leading-none">
              ↺
            </span>
            Clear chat
          </button>
        </div>
      )}

      <div className="scroll-area flex px-4 py-6 lg:min-h-0 lg:flex-1 lg:flex-col lg:overflow-y-auto lg:px-10 lg:py-10">
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col">
          {!hasConversation ? (
            <EmptyState canAsk={canAsk} onPick={(q) => canAsk && onAsk(q)} />
          ) : (
            <div className="space-y-8">
              {exchanges.map((exchange) => (
                <ExchangeView key={exchange.id} exchange={exchange} />
              ))}
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      <div className="sticky bottom-0 z-10 shrink-0 border-t border-line bg-canvas px-4 py-3 lg:static lg:px-10 lg:py-4">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-end gap-2 rounded-xl border border-line bg-raised p-2 transition-colors focus-within:border-accent">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              placeholder={
                canAsk ? "Ask a question…" : "Add a document to start asking"
              }
              disabled={!canAsk}
              className="max-h-40 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-ink outline-none placeholder:text-faint disabled:cursor-not-allowed"
            />
            {isBusy ? (
              <button
                onClick={onStop}
                className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-muted transition-colors hover:border-accent hover:text-accent-text"
              >
                Stop
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={!canAsk || draft.trim() === ""}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-canvas transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                Ask
              </button>
            )}
          </div>
          <p className="mt-1.5 px-1 font-mono text-[11px] text-faint">
            Enter to send · Shift + Enter for a new line
          </p>
        </div>
      </div>
    </section>
  );
}

function EmptyState({
  canAsk,
  onPick,
}: {
  canAsk: boolean;
  onPick: (q: string) => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
      <h2 className="font-display text-2xl italic">
        Ask, and see exactly where the answer came from.
      </h2>
      <p className="mt-3 max-w-md text-sm text-muted">
        Every response is built only from the documents in the knowledge base.
        If the answer isn&apos;t in the sources, you&apos;ll be informed
        clearly.
      </p>
      {canAsk && (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              onClick={() => onPick(example)}
              className="rounded-full border border-line bg-raised px-3 py-1.5 text-xs text-muted transition-colors hover:border-accent hover:text-accent-text"
            >
              {example}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
