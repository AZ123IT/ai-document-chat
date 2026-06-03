import { runRagChat } from "./rag-chat";
import type { QueryEmbeddingProvider } from "@/lib/ingestion/embedding-provider";
import type { ChatProvider } from "./chat-provider";
import type { SupabaseRagChatClient } from "./rag-chat";

describe("runRagChat", () => {
  it("retrieves context, generates an answer, saves messages, and returns citations", async () => {
    const supabase = createMockRagSupabase();
    const embeddingProvider: QueryEmbeddingProvider = {
      embedQuery: vi.fn(async () => Array.from({ length: 1536 }, () => 0.1)),
    };
    const chatProvider: ChatProvider = {
      generateAnswer: vi.fn(async (messages) => ({
        answer: `Grounded answer from ${messages.length} messages. [1]`,
      })),
    };

    const result = await runRagChat({
      request: {
        question: "How does Atlas answer?",
        documentIds: [3],
      },
      supabase: supabase.client,
      embeddingProvider,
      chatProvider,
    });

    expect(result.answer).toBe("Grounded answer from 2 messages. [1]");
    expect(result.sessionId).toBe(55);
    expect(result.messageIds).toEqual({
      user: 201,
      assistant: 202,
    });
    expect(result.citations).toEqual([
      {
        label: "1",
        chunkId: 7,
        documentId: 3,
        fileName: "atlas.pdf",
        pageNumber: 2,
        startOffset: 10,
        endOffset: 54,
        similarity: 0.91,
        snippet: "Project Atlas uses document-grounded answers.",
      },
    ]);
    expect(supabase.insertedSessions).toEqual([
      {
        title: "How does Atlas answer?",
        metadata: {},
      },
    ]);
    expect(supabase.insertedMessages).toEqual([
      {
        session_id: 55,
        role: "user",
        content: "How does Atlas answer?",
      },
      {
        session_id: 55,
        role: "assistant",
        content: "Grounded answer from 2 messages. [1]",
        citations: result.citations,
      },
    ]);
    expect(supabase.client.rpc).toHaveBeenCalledWith("match_document_chunks", {
      query_embedding: Array.from({ length: 1536 }, () => 0.1),
      match_count: 5,
      match_threshold: 0.75,
      filter_document_ids: [3],
    });
  });

  it("uses no document filter when documentIds are missing or empty", async () => {
    const missingFilterSupabase = createMockRagSupabase();
    const emptyFilterSupabase = createMockRagSupabase();
    const embeddingProvider: QueryEmbeddingProvider = {
      embedQuery: vi.fn(async () => Array.from({ length: 1536 }, () => 0.1)),
    };
    const chatProvider: ChatProvider = {
      generateAnswer: vi.fn(async () => ({ answer: "Answer [1]" })),
    };

    await runRagChat({
      request: {
        question: "How does Atlas answer?",
      },
      supabase: missingFilterSupabase.client,
      embeddingProvider,
      chatProvider,
    });
    await runRagChat({
      request: {
        question: "How does Atlas answer?",
        documentIds: [],
      },
      supabase: emptyFilterSupabase.client,
      embeddingProvider,
      chatProvider,
    });

    expect(missingFilterSupabase.client.rpc).toHaveBeenCalledWith(
      "match_document_chunks",
      expect.objectContaining({
        filter_document_ids: null,
      }),
    );
    expect(emptyFilterSupabase.client.rpc).toHaveBeenCalledWith(
      "match_document_chunks",
      expect.objectContaining({
        filter_document_ids: null,
      }),
    );
  });

  it("requires a non-empty question", async () => {
    await expect(
      runRagChat({
        request: { question: "   " },
        supabase: createMockRagSupabase().client,
        embeddingProvider: {
          embedQuery: vi.fn(async () => Array.from({ length: 1536 }, () => 0.1)),
        },
        chatProvider: {
          generateAnswer: vi.fn(async () => ({ answer: "unused" })),
        },
      }),
    ).rejects.toThrow("Question is required");
  });

  it.each([{}, null, { question: 123 }])(
    "rejects invalid request body shape %#",
    async (request) => {
      await expect(
        runRagChat({
          request,
          supabase: createMockRagSupabase().client,
          embeddingProvider: {
            embedQuery: vi.fn(async () =>
              Array.from({ length: 1536 }, () => 0.1),
            ),
          },
          chatProvider: {
            generateAnswer: vi.fn(async () => ({ answer: "unused" })),
          },
        }),
      ).rejects.toThrow("Question is required");
    },
  );

  it("cleans up a newly-created session when message persistence fails", async () => {
    const supabase = createMockRagSupabase({
      messageError: { message: "message insert failed" },
    });

    await expect(
      runRagChat({
        request: {
          question: "How does Atlas answer?",
        },
        supabase: supabase.client,
        embeddingProvider: {
          embedQuery: vi.fn(async () => Array.from({ length: 1536 }, () => 0.1)),
        },
        chatProvider: {
          generateAnswer: vi.fn(async () => ({ answer: "Answer [1]" })),
        },
      }),
    ).rejects.toThrow("Failed to save chat messages: message insert failed");

    expect(supabase.deletedSessionIds).toEqual([55]);
  });
});

type MockRagSupabaseOptions = {
  messageError?: { message: string };
};

function createMockRagSupabase(options: MockRagSupabaseOptions = {}) {
  const insertedSessions: unknown[] = [];
  const insertedMessages: unknown[] = [];
  const deletedSessionIds: number[] = [];

  const client = {
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
          file_type: "pdf",
          similarity: 0.91,
          metadata: {},
        },
      ],
      error: null,
    })),
    from: vi.fn((table: string) => {
      if (table === "chat_sessions") {
        return {
          insert: vi.fn((payload: unknown) => {
            insertedSessions.push(payload);

            return {
              select: vi.fn(() => ({
                single: vi.fn(async () => ({
                  data: { id: 55 },
                  error: null,
                })),
              })),
            };
          }),
          delete: vi.fn(() => ({
            eq: vi.fn(async (column: string, value: number) => {
              if (column === "id") {
                deletedSessionIds.push(value);
              }

              return {
                error: null,
              };
            }),
          })),
        };
      }

      if (table === "chat_messages") {
        return {
          insert: vi.fn((payload: unknown[]) => {
            insertedMessages.push(...payload);

            return {
              select: vi.fn(async () => ({
                data: options.messageError
                  ? null
                  : [
                  { id: 201, role: "user" },
                  { id: 202, role: "assistant" },
                    ],
                error: options.messageError ?? null,
              })),
            };
          }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    }),
  };

  return {
    client: client as unknown as SupabaseRagChatClient,
    insertedSessions,
    insertedMessages,
    deletedSessionIds,
  };
}
