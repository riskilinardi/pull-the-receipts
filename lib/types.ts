export interface Source {
  number: number;
  text: string;
  source: string;
  page: number | null;
  score: number;
}

export interface IngestedDocument {
  filename: string;
  chunks: number;
}

export type ExchangeStatus = "searching" | "streaming" | "complete" | "error";

export interface Exchange {
  id: string;
  question: string;
  answer: string;
  sources: Source[];
  status: ExchangeStatus;
}

export const PROTECTED_DOCUMENTS = [
  "FYP-Project-Proposal.pdf",
  "NEA-Annual-Report-2023-2024.pdf",
];
