import { Fragment } from "react";

interface Props {
  text: string;
  streaming: boolean;
  activeCitation: number | null;
  onCitationClick: (number: number) => void;
}

type Segment =
  | { kind: "text"; value: string }
  | { kind: "citation"; number: number };

const CITATION = /\[(\d+)\]/g;

export function AnswerBody({
  text,
  streaming,
  activeCitation,
  onCitationClick,
}: Props) {
  return (
    <p className="text-[15px] leading-relaxed text-ink">
      {toSegments(text).map((segment, index) =>
        segment.kind === "text" ? (
          <Fragment key={index}>{segment.value}</Fragment>
        ) : (
          <button
            key={index}
            onClick={() => onCitationClick(segment.number)}
            className={`mx-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded px-1 align-text-top font-mono text-xs transition-colors ${
              activeCitation === segment.number
                ? "bg-accent text-canvas"
                : "bg-accent-soft text-accent-text hover:bg-accent hover:text-canvas"
            }`}
          >
            {segment.number}
          </button>
        ),
      )}
      {streaming && (
        <span
          className="ml-0.5 inline-block h-4 w-px translate-y-0.5 bg-accent"
          style={{ animation: "caret 1s step-end infinite" }}
        />
      )}
    </p>
  );
}

function toSegments(text: string): Segment[] {
  const segments: Segment[] = [];
  let cursor = 0;

  for (const match of text.matchAll(CITATION)) {
    const start = match.index ?? 0;
    if (start > cursor) {
      segments.push({ kind: "text", value: text.slice(cursor, start) });
    }
    segments.push({ kind: "citation", number: Number(match[1]) });
    cursor = start + match[0].length;
  }

  if (cursor < text.length) {
    segments.push({ kind: "text", value: text.slice(cursor) });
  }

  return segments;
}
