import type { ChunkTextOptions, ExtractedDocumentText, TextChunk } from "./types";

export function chunkText(text: string, options: ChunkTextOptions): TextChunk[] {
  validateChunkOptions(options);

  if (text.length === 0) {
    return [];
  }

  const chunks: TextChunk[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + options.chunkSize, text.length);

    chunks.push({
      chunk_index: chunks.length,
      content: text.slice(start, end),
      start,
      end,
      page_number: options.pageNumber,
    });

    if (end === text.length) {
      break;
    }

    start = end - options.chunkOverlap;
  }

  return chunks;
}

export function chunkExtractedDocument(
  document: ExtractedDocumentText,
  options: Omit<ChunkTextOptions, "pageNumber">,
): TextChunk[] {
  const sourceParts =
    document.pages && document.pages.length > 0
      ? document.pages.map((page) => ({
          text: page.text,
          pageNumber: page.page_number,
        }))
      : [{ text: document.text, pageNumber: undefined }];

  const chunks = sourceParts.flatMap((part) =>
    chunkText(part.text, {
      ...options,
      pageNumber: part.pageNumber,
    }),
  );

  return chunks.map((chunk, index) => ({
    ...chunk,
    chunk_index: index,
  }));
}

function validateChunkOptions(options: ChunkTextOptions) {
  if (!Number.isInteger(options.chunkSize) || options.chunkSize <= 0) {
    throw new Error("chunkSize must be a positive integer");
  }

  if (!Number.isInteger(options.chunkOverlap) || options.chunkOverlap < 0) {
    throw new Error("chunkOverlap must be a non-negative integer");
  }

  if (options.chunkOverlap >= options.chunkSize) {
    throw new Error("chunkOverlap must be smaller than chunkSize");
  }
}
