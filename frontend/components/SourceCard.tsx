"use client";

import { useEffect, useRef } from "react";

import type { Source } from "@/lib/types";

interface Props {
  source: Source;
  highlighted: boolean;
  onToggle: () => void;
}

export function SourceCard({ source, highlighted, onToggle }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlighted) {
      ref.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [highlighted]);

  const location = source.page ? `p.${source.page}` : "—";
  const relevance = Math.round(source.score * 100);

  return (
    <div
      ref={ref}
      className={`overflow-hidden rounded-lg border transition-colors ${
        highlighted ? "border-accent bg-accent-soft" : "border-line bg-raised"
      }`}
    >
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
      >
        <span className="flex h-5 min-w-5 items-center justify-center rounded bg-accent px-1 font-mono text-xs text-canvas">
          {source.number}
        </span>
        <span className="flex-1 truncate text-sm font-medium text-ink">
          {source.source}
        </span>
        <span className="font-mono text-xs text-faint">{location}</span>
        <Relevance value={relevance} />
      </button>

      {highlighted && (
        <p className="border-t border-line px-3 py-3 text-sm leading-relaxed text-muted">
          {source.text}
        </p>
      )}
    </div>
  );
}

function Relevance({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-1.5" title={`Relevance ${value}%`}>
      <span className="h-1 w-10 overflow-hidden rounded-full bg-line">
        <span
          className="block h-full rounded-full bg-positive"
          style={{ width: `${value}%` }}
        />
      </span>
      <span className="font-mono text-xs text-faint">{value}</span>
    </span>
  );
}
