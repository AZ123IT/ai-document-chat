export type LocalDocument = {
  id: string;
  name: string;
  type: "PDF" | "TXT";
  sizeLabel: string;
  status: "Staged locally";
};

export type SourceCitation = {
  label: string;
  chunkId: number;
  documentId?: number;
  fileName?: string;
  pageNumber?: number | null;
  startOffset?: number;
  endOffset?: number;
  similarity?: number;
  snippet?: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: SourceCitation[];
};

export type ChatResponse = {
  answer: string;
  citations: SourceCitation[];
  sessionId?: number;
  messageIds?: {
    user: number;
    assistant: number;
  };
};
