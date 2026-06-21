"use client";

import { useRef, useState } from "react";

import { PROTECTED_DOCUMENTS } from "@/lib/api";
import type { IngestedDocument } from "@/lib/types";

interface Props {
  documents: IngestedDocument[];
  onUpload: (file: File) => Promise<void>;
  onDelete: (filename: string) => Promise<void>;
}

export function DocumentLibrary({ documents, onUpload, onDelete }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const send = async (file: File) => {
    setError(null);
    setPending(file.name);
    try {
      await onUpload(file);
    } catch {
      setError(
        `Couldn't process ${file.name}. Check the server and try again.`,
      );
    } finally {
      setPending(null);
    }
  };

  const onPick = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) send(file);
    event.target.value = "";
  };

  const totalChunks = documents.reduce((sum, doc) => sum + doc.chunks, 0);

  return (
    <aside className="scroll-area flex shrink-0 flex-col gap-6 border-b border-line bg-panel px-4 py-6 lg:h-dvh lg:w-80 lg:overflow-y-auto lg:border-b-0 lg:border-r lg:px-6 lg:py-8">
      <div>
        <div className="flex items-baseline justify-between gap-2">
          <h1 className="font-display text-3xl tracking-tight">
            Pull The Receipts
          </h1>
          <a
            href="https://riskilinardi.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 font-mono text-[11px] text-faint transition-colors hover:text-accent-text"
          >
            by RL
          </a>
        </div>
        <p className="mt-2 text-sm text-muted">
          Zero-hallucination answers, grounded in your documents — with the
          receipts to prove it.
        </p>
      </div>

      <div>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={pending !== null}
          className="w-full rounded-lg border border-dashed border-line bg-raised px-4 py-5 text-left transition-colors hover:border-accent disabled:opacity-60"
        >
          <span className="block text-sm font-medium text-ink">
            {pending ? `Processing ${pending}…` : "Add a document"}
          </span>
          <span className="mt-0.5 block text-xs text-faint">
            PDF, text, or markdown
          </span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt,.md"
          onChange={onPick}
          className="hidden"
        />
        {error && <p className="mt-2 text-xs text-danger">{error}</p>}
      </div>

      <div className="min-h-0 flex-1">
        {documents.length === 0 ? (
          <p className="text-sm text-faint">
            No documents yet. Upload one to build the knowledge base.
          </p>
        ) : (
          <>
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="font-mono text-[11px] uppercase tracking-[0.15em] text-muted">
                Knowledge base
              </h2>
              <span className="font-mono text-xs text-faint">
                {totalChunks} chunks
              </span>
            </div>
            <ul className="space-y-1">
              {documents.map((doc) => (
                <DocumentRow
                  key={doc.filename}
                  document={doc}
                  protected={PROTECTED_DOCUMENTS.includes(doc.filename)}
                  onDelete={() => onDelete(doc.filename)}
                />
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="space-y-2 border-t border-line pt-4 text-xs leading-relaxed text-faint">
        <p>
          <span className="text-muted">FYP Project Proposal</span> is based on
          the TogetherSafe project.
        </p>
        <p>
          <span className="text-muted">NEA Annual Report</span> is from{" "}
          <a
            href="https://nea.gov.sg"
            target="_blank"
            rel="noopener noreferrer"
            className="underline transition-colors hover:text-accent-text"
          >
            nea.gov.sg
          </a>
          , made available under the Singapore Open Data Licence v1.0.
        </p>
      </div>
    </aside>
  );
}

function DocumentRow({
  document,
  protected: isProtected,
  onDelete,
}: {
  document: IngestedDocument;
  protected: boolean;
  onDelete: () => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);

  const remove = async () => {
    setRemoving(true);
    try {
      await onDelete();
    } finally {
      setRemoving(false);
      setConfirming(false);
    }
  };

  return (
    <li className="group flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm hover:bg-surface">
      <span className="truncate text-ink">{document.filename}</span>

      {confirming ? (
        <span className="flex shrink-0 items-center gap-2 text-xs">
          <button
            onClick={remove}
            disabled={removing}
            className="font-medium text-danger hover:underline disabled:opacity-50"
          >
            {removing ? "Removing…" : "Remove"}
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="text-faint hover:text-muted"
          >
            Cancel
          </button>
        </span>
      ) : (
        <span className="flex shrink-0 items-center gap-2">
          <span className="font-mono text-xs text-faint">
            {document.chunks}
          </span>
          {!isProtected && (
            <button
              onClick={() => setConfirming(true)}
              aria-label={`Remove ${document.filename}`}
              className="text-faint opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
            >
              ✕
            </button>
          )}
        </span>
      )}
    </li>
  );
}
