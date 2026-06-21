import { useCallback, useRef, useState } from "react";

import { streamAnswer } from "./api";
import type { Exchange } from "./types";

export function useConversation() {
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const patch = useCallback((id: string, change: Partial<Exchange>) => {
    setExchanges((current) =>
      current.map((exchange) =>
        exchange.id === id ? { ...exchange, ...change } : exchange,
      ),
    );
  }, []);

  const ask = useCallback(
    async (question: string) => {
      const id = crypto.randomUUID();
      setExchanges((current) => [
        ...current,
        { id, question, answer: "", sources: [], status: "searching" },
      ]);
      setIsBusy(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        for await (const event of streamAnswer(question, controller.signal)) {
          if (event.type === "sources") {
            patch(id, { sources: event.sources, status: "streaming" });
          } else if (event.type === "token") {
            setExchanges((current) =>
              current.map((exchange) =>
                exchange.id === id
                  ? { ...exchange, answer: exchange.answer + event.text }
                  : exchange,
              ),
            );
          }
        }
        patch(id, { status: "complete" });
      } catch {
        patch(id, { status: controller.signal.aborted ? "complete" : "error" });
      } finally {
        setIsBusy(false);
        abortRef.current = null;
      }
    },
    [patch],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clear = useCallback(() => {
    abortRef.current?.abort();
    setExchanges([]);
  }, []);

  return { exchanges, isBusy, ask, stop, clear };
}
