import { buildRagPrompt } from "./build-rag-prompt";
import type { RetrievedChunk } from "./retrieve-context";

describe("buildRagPrompt", () => {
  it("builds grounded prompt messages and citation metadata", () => {
    const chunks: RetrievedChunk[] = [
      {
        id: 7,
        documentId: 3,
        chunkIndex: 0,
        content: "Atlas answers with citations.",
        pageNumber: 2,
        startOffset: 10,
        endOffset: 39,
        fileName: "atlas.pdf",
        fileType: "pdf",
        similarity: 0.91,
        metadata: {},
      },
      {
        id: 8,
        documentId: 4,
        chunkIndex: 1,
        content: "It should say when context is missing.",
        pageNumber: null,
        startOffset: 40,
        endOffset: 79,
        fileName: "notes.txt",
        fileType: "txt",
        similarity: 0.82,
        metadata: {},
      },
    ];

    const result = buildRagPrompt({
      question: "How should Atlas answer?",
      chunks,
    });

    expect(result.messages).toEqual([
      {
        role: "system",
        content: expect.stringContaining("document-grounded assistant"),
      },
      {
        role: "user",
        content: expect.stringContaining("Question:\nHow should Atlas answer?"),
      },
    ]);
    expect(result.messages[1].content).toContain(
      "[1] atlas.pdf, page 2, chunk 0",
    );
    expect(result.messages[1].content).toContain("[2] notes.txt, chunk 1");
    expect(result.citations).toEqual([
      {
        label: "1",
        chunkId: 7,
        documentId: 3,
        fileName: "atlas.pdf",
        pageNumber: 2,
        startOffset: 10,
        endOffset: 39,
        similarity: 0.91,
        snippet: "Atlas answers with citations.",
      },
      {
        label: "2",
        chunkId: 8,
        documentId: 4,
        fileName: "notes.txt",
        pageNumber: null,
        startOffset: 40,
        endOffset: 79,
        similarity: 0.82,
        snippet: "It should say when context is missing.",
      },
    ]);
  });
});
