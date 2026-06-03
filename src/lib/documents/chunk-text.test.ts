import { chunkExtractedDocument, chunkText } from "./chunk-text";
import type { ExtractedDocumentText } from "./types";

describe("chunkText", () => {
  it("creates deterministic chunks with character offsets", () => {
    const result = chunkText(
      "Alpha beta gamma. Delta epsilon zeta. Eta theta iota.",
      {
        chunkSize: 24,
        chunkOverlap: 6,
      },
    );

    expect(result).toEqual([
      {
        chunk_index: 0,
        content: "Alpha beta gamma. Delta ",
        start: 0,
        end: 24,
        page_number: undefined,
      },
      {
        chunk_index: 1,
        content: "Delta epsilon zeta. Eta ",
        start: 18,
        end: 42,
        page_number: undefined,
      },
      {
        chunk_index: 2,
        content: ". Eta theta iota.",
        start: 36,
        end: 53,
        page_number: undefined,
      },
    ]);
  });

  it("preserves page numbers when chunking extracted pages", () => {
    const result = chunkText("First page text.\n\nSecond page text.", {
      chunkSize: 80,
      chunkOverlap: 0,
      pageNumber: 2,
    });

    expect(result).toEqual([
      {
        chunk_index: 0,
        content: "First page text.\n\nSecond page text.",
        start: 0,
        end: 35,
        page_number: 2,
      },
    ]);
  });

  it("rejects invalid chunk settings", () => {
    expect(() =>
      chunkText("sample text", {
        chunkSize: 10,
        chunkOverlap: 10,
      }),
    ).toThrow("chunkOverlap must be smaller than chunkSize");
  });
});

describe("chunkExtractedDocument", () => {
  it("chunks each extracted page and keeps global chunk indexes", () => {
    const document: ExtractedDocumentText = {
      text: "First page text.\n\nSecond page text.",
      pages: [
        { page_number: 1, text: "First page text." },
        { page_number: 2, text: "Second page text." },
      ],
      metadata: {
        fileName: "sample.pdf",
        fileType: "pdf",
        mimeType: "application/pdf",
      },
    };

    const result = chunkExtractedDocument(document, {
      chunkSize: 80,
      chunkOverlap: 0,
    });

    expect(result).toEqual([
      {
        chunk_index: 0,
        content: "First page text.",
        start: 0,
        end: 16,
        page_number: 1,
      },
      {
        chunk_index: 1,
        content: "Second page text.",
        start: 0,
        end: 17,
        page_number: 2,
      },
    ]);
  });
});
