"use client";

import { useEffect, useState } from "react";

import { Conversation } from "@/components/Conversation";
import { DocumentLibrary } from "@/components/DocumentLibrary";
import { deleteDocument, ingestDocument, listDocuments } from "@/lib/api";
import { useConversation } from "@/lib/useConversation";
import type { IngestedDocument } from "@/lib/types";

export default function Home() {
  const [documents, setDocuments] = useState<IngestedDocument[]>([]);
  const { exchanges, isBusy, ask, stop, clear } = useConversation();

  useEffect(() => {
    listDocuments()
      .then(setDocuments)
      .catch(() => {});
  }, []);

  const handleUpload = async (file: File) => {
    const ingested = await ingestDocument(file);
    setDocuments((current) => [
      ...current.filter((doc) => doc.filename !== ingested.filename),
      ingested,
    ]);
  };

  const handleDelete = async (filename: string) => {
    await deleteDocument(filename);
    setDocuments((current) =>
      current.filter((doc) => doc.filename !== filename),
    );
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col lg:h-dvh lg:flex-row lg:overflow-hidden">
      <DocumentLibrary
        documents={documents}
        onUpload={handleUpload}
        onDelete={handleDelete}
      />
      <Conversation
        exchanges={exchanges}
        isBusy={isBusy}
        canAsk={documents.length > 0}
        onAsk={ask}
        onStop={stop}
        onClear={clear}
      />
    </main>
  );
}
