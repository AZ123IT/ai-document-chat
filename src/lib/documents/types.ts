export type SupportedDocumentType = "txt" | "pdf";

export type DocumentInput = {
  fileName: string;
  mimeType?: string;
};

export type ExtractedPage = {
  page_number: number;
  text: string;
};

export type ExtractedDocumentText = {
  text: string;
  pages?: ExtractedPage[];
  metadata: {
    fileName: string;
    fileType: SupportedDocumentType;
    mimeType?: string;
  };
};

export type TextChunk = {
  chunk_index: number;
  content: string;
  start: number;
  end: number;
  page_number?: number;
};

export type ChunkTextOptions = {
  chunkSize: number;
  chunkOverlap: number;
  pageNumber?: number;
};
