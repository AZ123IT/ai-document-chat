import { retrieveRelevantChunks } from "./retrieve-context";
import type { QueryEmbeddingProvider } from "@/lib/ingestion/embedding-provider";
import type { SupabaseRetrievalClient } from "./retrieve-context";

describe("retrieveRelevantChunks", () => {
  it("embeds the question and calls the match_document_chunks RPC", async () => {
    const queryEmbedding = Array.from({ length: 1536 }, (_, index) => index / 1000);
    const embeddingProvider: QueryEmbeddingProvider = {
      embedQuery: vi.fn(async () => queryEmbedding),
    };
    const supabase: SupabaseRetrievalClient = {
      rpc: vi.fn(async () => ({
        data: [
          {
            chunk_id: 7,
            document_id: 3,
            chunk_index: 0,
            content: "Project Atlas uses document-grounded answers.",
            page_number: 2,
            start_offset: 10,
            end_offset: 54,
            file_name: "atlas.pdf",
            file_type: "pdf" as const,
            similarity: 0.91,
            metadata: { document: { title: "Atlas" }, chunk: {} },
          },
        ],
        error: null,
      })),
    };

    const result = await retrieveRelevantChunks({
      question: "How does Atlas answer questions?",
      embeddingProvider,
      supabase,
      matchCount: 4,
      matchThreshold: 0.7,
      documentIds: [3, 4],
    });

    expect(embeddingProvider.embedQuery).toHaveBeenCalledWith(
      "How does Atlas answer questions?",
    );
    expect(supabase.rpc).toHaveBeenCalledWith("match_document_chunks", {
      query_embedding: queryEmbedding,
      match_count: 4,
      match_threshold: 0.7,
      filter_document_ids: [3, 4],
    });
    expect(result).toEqual([
      {
        id: 7,
        documentId: 3,
        chunkIndex: 0,
        content: "Project Atlas uses document-grounded answers.",
        pageNumber: 2,
        startOffset: 10,
        endOffset: 54,
        fileName: "atlas.pdf",
        fileType: "pdf",
        similarity: 0.91,
        metadata: { document: { title: "Atlas" }, chunk: {} },
      },
    ]);
  });

  it("treats an empty document id list as no document filter", async () => {
    const queryEmbedding = Array.from({ length: 1536 }, () => 0.1);
    const supabase: SupabaseRetrievalClient = {
      rpc: vi.fn(async () => ({
        data: [],
        error: null,
      })),
    };

    await retrieveRelevantChunks({
      question: "Search everything",
      embeddingProvider: {
        embedQuery: vi.fn(async () => queryEmbedding),
      },
      supabase,
      documentIds: [],
    });

    expect(supabase.rpc).toHaveBeenCalledWith("match_document_chunks", {
      query_embedding: queryEmbedding,
      match_count: 5,
      match_threshold: 0.75,
      filter_document_ids: null,
    });
  });

  it("rejects query embeddings with the wrong vector dimension", async () => {
    const supabase: SupabaseRetrievalClient = {
      rpc: vi.fn(),
    };

    await expect(
      retrieveRelevantChunks({
        question: "Bad embedding",
        embeddingProvider: {
          embedQuery: vi.fn(async () => [0.1, 0.2]),
        },
        supabase,
      }),
    ).rejects.toThrow("Query embedding must have 1536 dimensions");
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("rejects query embeddings with non-finite values", async () => {
    const supabase: SupabaseRetrievalClient = {
      rpc: vi.fn(),
    };

    await expect(
      retrieveRelevantChunks({
        question: "Bad embedding",
        embeddingProvider: {
          embedQuery: vi.fn(async () =>
            Array.from({ length: 1536 }, (_, index) =>
              index === 3 ? Number.NaN : 0.1,
            ),
          ),
        },
        supabase,
      }),
    ).rejects.toThrow("Query embedding contains a non-finite value");
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("surfaces RPC failures", async () => {
    await expect(
      retrieveRelevantChunks({
        question: "What failed?",
        embeddingProvider: {
          embedQuery: vi.fn(async () => Array.from({ length: 1536 }, () => 0.1)),
        },
        supabase: {
          rpc: vi.fn(async () => ({
            data: null,
            error: { message: "RPC failed" },
          })),
        },
      }),
    ).rejects.toThrow("Failed to retrieve document chunks: RPC failed");
  });
});
