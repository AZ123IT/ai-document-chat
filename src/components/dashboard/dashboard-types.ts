export type LocalDocument = {
  id: string;
  name: string;
  type: "PDF" | "TXT";
  sizeLabel: string;
  status: "staged" | "ready";
};

export type DocumentResponse = {
  id: number;
  fileName: string;
  fileType: "PDF" | "TXT";
  mimeType: string | null;
  fileSizeBytes: number;
  textLength: number;
  status: "ready";
  createdAt: string;
};

export type DocumentsListResponse = {
  documents: DocumentResponse[];
};

export type UploadDocumentResponse = {
  document: {
    id: number;
    fileName: string;
    fileType: "PDF" | "TXT";
    mimeType: string | null;
    fileSizeBytes: number;
    status: "ready";
  };
  ingestion: {
    chunkCount: number;
  };
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
