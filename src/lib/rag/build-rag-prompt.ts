import type { ChatMessage } from "./chat-provider";
import type { RetrievedChunk } from "./retrieve-context";

export type SourceCitation = {
  label: string;
  chunkId: number;
  documentId: number;
  fileName: string;
  pageNumber: number | null;
  startOffset: number;
  endOffset: number;
  similarity: number;
  snippet: string;
};

export type RagPrompt = {
  messages: ChatMessage[];
  citations: SourceCitation[];
};

export type BuildRagPromptOptions = {
  question: string;
  chunks: RetrievedChunk[];
};

export function buildRagPrompt({
  question,
  chunks,
}: BuildRagPromptOptions): RagPrompt {
  const citations = chunks.map((chunk, index) => ({
    label: String(index + 1),
    chunkId: chunk.id,
    documentId: chunk.documentId,
    fileName: chunk.fileName,
    pageNumber: chunk.pageNumber,
    startOffset: chunk.startOffset,
    endOffset: chunk.endOffset,
    similarity: chunk.similarity,
    snippet: chunk.content,
  }));

  return {
    messages: [
      {
        role: "system",
        content:
          "You are a document-grounded assistant. Answer only from the provided source excerpts. Cite sources with bracketed labels like [1]. If the excerpts do not contain enough information, say that the uploaded documents do not provide enough context.",
      },
      {
        role: "user",
        content: [
          `Question:\n${question}`,
          "Sources:",
          ...chunks.map((chunk, index) => formatSource(chunk, index)),
        ].join("\n\n"),
      },
    ],
    citations,
  };
}

function formatSource(chunk: RetrievedChunk, index: number) {
  return `${formatSourceLabel(chunk, index)}\n${chunk.content}`;
}

function formatSourceLabel(chunk: RetrievedChunk, index: number) {
  const location =
    chunk.pageNumber === null
      ? `${chunk.fileName}, chunk ${chunk.chunkIndex}`
      : `${chunk.fileName}, page ${chunk.pageNumber}, chunk ${chunk.chunkIndex}`;

  return `[${index + 1}] ${location}`;
}
