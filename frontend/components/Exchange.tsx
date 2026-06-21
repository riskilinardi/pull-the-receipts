"use client";

import { useState } from "react";

import type { Exchange } from "@/lib/types";
import { AnswerBody } from "./AnswerBody";
import { SourceCard } from "./SourceCard";

export function ExchangeView({ exchange }: { exchange: Exchange }) {
  const [activeSource, setActiveSource] = useState<number | null>(null);
  const { question, answer, sources, status } = exchange;

  const toggle = (number: number) =>
    setActiveSource((current) => (current === number ? null : number));

  return (
    <article className="space-y-3" style={{ animation: "rise 0.3s ease-out" }}>
      <div className="flex justify-end">
        <p className="max-w-[85%] rounded-2xl rounded-br-sm border border-accent/20 bg-accent-soft px-4 py-2 text-sm text-ink">
          {question}
        </p>
      </div>

      <div className="rounded-2xl rounded-tl-sm border border-line bg-surface px-4 py-4">
        {status === "searching" ? (
          <Searching />
        ) : status === "error" ? (
          <p className="text-sm text-danger">
            Something went wrong reaching the server. Make sure it&apos;s
            running, then ask again.
          </p>
        ) : (
          <AnswerBody
            text={answer}
            streaming={status === "streaming"}
            activeCitation={activeSource}
            onCitationClick={setActiveSource}
          />
        )}

        {sources.length > 0 && (
          <div className="mt-4 space-y-2 border-t border-line pt-3">
            <h4 className="flex items-baseline gap-2 font-mono text-[11px] uppercase tracking-[0.15em] text-muted">
              Sources
              <span className="text-faint">{sources.length}</span>
            </h4>
            {sources.map((source) => (
              <SourceCard
                key={source.number}
                source={source}
                highlighted={activeSource === source.number}
                onToggle={() => toggle(source.number)}
              />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function Searching() {
  return (
    <div className="flex items-center gap-2 text-sm text-muted">
      <span className="flex gap-1">
        {["0ms", "150ms", "300ms"].map((delay) => (
          <span
            key={delay}
            className="h-1.5 w-1.5 rounded-full bg-muted"
            style={{
              animation: "caret 1s ease-in-out infinite",
              animationDelay: delay,
            }}
          />
        ))}
      </span>
      Searching your documents…
    </div>
  );
}
