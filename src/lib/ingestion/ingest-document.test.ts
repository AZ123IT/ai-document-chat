import { ingestDocument } from "./ingest-document";
import type { EmbeddingProvider } from "./embedding-provider";
import type { SupabaseDocumentIngestionClient } from "./ingest-document";

describe("ingestDocument", () => {
  it("extracts, chunks, embeds, and stores a TXT document", async () => {
    const supabase = createMockSupabase();
    const embeddingProvider: EmbeddingProvider = {
      embedDocuments: vi.fn(async (texts: string[]) =>
        texts.map((_, index) => Array.from({ length: 1536 }, () => index + 0.1)),
      ),
    };

    const result = await ingestDocument({
      file: {
        fileName: "project-notes.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("Alpha beta gamma delta epsilon zeta eta theta."),
      },
      supabase: supabase.client,
      embeddingProvider,
      chunkOptions: {
        chunkSize: 20,
        chunkOverlap: 5,
      },
    });

    expect(result).toEqual({
      documentId: 42,
      chunkCount: 3,
      chunkIds: [100, 101, 102],
    });
    expect(embeddingProvider.embedDocuments).toHaveBeenCalledWith([
      "Alpha beta gamma del",
      "a delta epsilon zeta",
      " zeta eta theta.",
    ]);
    expect(supabase.insertedDocuments).toEqual([
      {
        file_name: "project-notes.txt",
        file_type: "txt",
        mime_type: "text/plain",
        file_size_bytes: 46,
        text_length: 46,
        metadata: {
          page_count: 0,
        },
      },
    ]);
    expect(supabase.insertedChunks).toEqual([
      {
        document_id: 42,
        chunk_index: 0,
        content: "Alpha beta gamma del",
        start_offset: 0,
        end_offset: 20,
        page_number: null,
        embedding: Array.from({ length: 1536 }, () => 0.1),
        metadata: {},
      },
      {
        document_id: 42,
        chunk_index: 1,
        content: "a delta epsilon zeta",
        start_offset: 15,
        end_offset: 35,
        page_number: null,
        embedding: Array.from({ length: 1536 }, () => 1.1),
        metadata: {},
      },
      {
        document_id: 42,
        chunk_index: 2,
        content: " zeta eta theta.",
        start_offset: 30,
        end_offset: 46,
        page_number: null,
        embedding: Array.from({ length: 1536 }, () => 2.1),
        metadata: {},
      },
    ]);
  });

  it("rejects documents with no extractable text", async () => {
    await expect(
      ingestDocument({
        file: {
          fileName: "blank.txt",
          mimeType: "text/plain",
          buffer: Buffer.from("   \n\t"),
        },
        supabase: createMockSupabase().client,
        embeddingProvider: {
          embedDocuments: vi.fn(async () => []),
        },
      }),
    ).rejects.toThrow("Document does not contain extractable text");
  });

  it("surfaces Supabase document insert failures", async () => {
    const supabase = createMockSupabase({
      documentError: { message: "insert failed" },
    });

    await expect(
      ingestDocument({
        file: {
          fileName: "notes.txt",
          mimeType: "text/plain",
          buffer: Buffer.from("Stored text"),
        },
        supabase: supabase.client,
        embeddingProvider: {
          embedDocuments: vi.fn(async () => [
            Array.from({ length: 1536 }, () => 0.2),
          ]),
        },
      }),
    ).rejects.toThrow("Failed to store document: insert failed");
  });

  it("cleans up the document row when chunk insert fails", async () => {
    const supabase = createMockSupabase({
      chunkError: { message: "chunk insert failed" },
    });

    await expect(
      ingestDocument({
        file: {
          fileName: "notes.txt",
          mimeType: "text/plain",
          buffer: Buffer.from("Stored text"),
        },
        supabase: supabase.client,
        embeddingProvider: {
          embedDocuments: vi.fn(async () => [
            Array.from({ length: 1536 }, () => 0.2),
          ]),
        },
      }),
    ).rejects.toThrow("Failed to store document chunks: chunk insert failed");

    expect(supabase.deletedDocumentIds).toEqual([42]);
  });

  it("rejects embeddings with the wrong vector dimension", async () => {
    await expect(
      ingestDocument({
        file: {
          fileName: "notes.txt",
          mimeType: "text/plain",
          buffer: Buffer.from("Stored text"),
        },
        supabase: createMockSupabase().client,
        embeddingProvider: {
          embedDocuments: vi.fn(async () => [[0.1, 0.2]]),
        },
      }),
    ).rejects.toThrow("Embedding at index 0 must have 1536 dimensions");
  });

  it("rejects embeddings with non-finite values", async () => {
    await expect(
      ingestDocument({
        file: {
          fileName: "notes.txt",
          mimeType: "text/plain",
          buffer: Buffer.from("Stored text"),
        },
        supabase: createMockSupabase().client,
        embeddingProvider: {
          embedDocuments: vi.fn(async () => [
            Array.from({ length: 1536 }, (_, index) =>
              index === 7 ? Number.NaN : 0.1,
            ),
          ]),
        },
      }),
    ).rejects.toThrow("Embedding at index 0 contains a non-finite value");
  });
});

type MockSupabaseOptions = {
  documentError?: { message: string };
  chunkError?: { message: string };
};

function createMockSupabase(options: MockSupabaseOptions = {}) {
  const insertedDocuments: unknown[] = [];
  const insertedChunks: unknown[] = [];
  const deletedDocumentIds: number[] = [];

  const client = {
    from: vi.fn((table: string) => {
      if (table === "documents") {
        return {
          insert: vi.fn((payload: unknown) => {
            insertedDocuments.push(payload);

            return {
              select: vi.fn(() => ({
                single: vi.fn(async () => ({
                  data: options.documentError ? null : { id: 42 },
                  error: options.documentError ?? null,
                })),
              })),
            };
          }),
          delete: vi.fn(() => ({
            eq: vi.fn(async (column: string, value: number) => {
              if (column === "id") {
                deletedDocumentIds.push(value);
              }

              return {
                error: null,
              };
            }),
          })),
        };
      }

      if (table === "document_chunks") {
        return {
          insert: vi.fn((payload: unknown[]) => {
            insertedChunks.push(...payload);

            return {
              select: vi.fn(async () => ({
                data: options.chunkError
                  ? null
                  : payload.map((_, index) => ({
                      id: 100 + index,
                      chunk_index: index,
                    })),
                error: options.chunkError ?? null,
              })),
            };
          }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    }),
  };

  return {
    client: client as unknown as SupabaseDocumentIngestionClient,
    insertedDocuments,
    insertedChunks,
    deletedDocumentIds,
  };
}
