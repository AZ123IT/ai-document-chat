const createServerSupabaseClientMock = vi.hoisted(() => vi.fn());
const createPlaceholderEmbeddingProviderMock = vi.hoisted(() => vi.fn());
const createPlaceholderChatProviderMock = vi.hoisted(() => vi.fn());
const runRagChatMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: createServerSupabaseClientMock,
}));

vi.mock("@/lib/ingestion/embedding-provider", () => ({
  createPlaceholderEmbeddingProvider: createPlaceholderEmbeddingProviderMock,
}));

vi.mock("@/lib/rag/chat-provider", () => ({
  createPlaceholderChatProvider: createPlaceholderChatProviderMock,
}));

vi.mock("@/lib/rag/rag-chat", async () => {
  const actual = await vi.importActual<typeof import("@/lib/rag/rag-chat")>(
    "@/lib/rag/rag-chat",
  );

  return {
    ...actual,
    runRagChat: runRagChatMock,
  };
});

describe("POST /api/chat", () => {
  beforeEach(() => {
    vi.resetModules();
    createServerSupabaseClientMock.mockReset();
    createPlaceholderEmbeddingProviderMock.mockReset();
    createPlaceholderChatProviderMock.mockReset();
    runRagChatMock.mockReset();
  });

  it("runs the RAG chat service and returns its answer", async () => {
    const supabase = { from: vi.fn(), rpc: vi.fn() };
    const embeddingProvider = { embedQuery: vi.fn() };
    const chatProvider = { generateAnswer: vi.fn() };

    createServerSupabaseClientMock.mockReturnValue(supabase);
    createPlaceholderEmbeddingProviderMock.mockReturnValue(embeddingProvider);
    createPlaceholderChatProviderMock.mockReturnValue(chatProvider);
    runRagChatMock.mockResolvedValue({
      answer: "Grounded answer [1]",
      citations: [{ label: "1", chunkId: 7 }],
      sessionId: 55,
      messageIds: { user: 201, assistant: 202 },
    });

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        body: JSON.stringify({ question: "What is Atlas?" }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      answer: "Grounded answer [1]",
      citations: [{ label: "1", chunkId: 7 }],
      sessionId: 55,
      messageIds: { user: 201, assistant: 202 },
    });
    expect(runRagChatMock).toHaveBeenCalledWith({
      request: { question: "What is Atlas?" },
      supabase,
      embeddingProvider,
      chatProvider,
    });
  });

  it("returns 400 for validation errors", async () => {
    const { RagChatValidationError } = await import("@/lib/rag/rag-chat");
    runRagChatMock.mockRejectedValue(
      new RagChatValidationError("Question is required"),
    );

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        body: JSON.stringify({ question: "" }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Question is required",
    });
  });

  it("returns a generic 500 response for internal failures", async () => {
    runRagChatMock.mockRejectedValue(
      new Error("Failed to retrieve document chunks: database unavailable"),
    );

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/chat", {
        method: "POST",
        body: JSON.stringify({ question: "What is Atlas?" }),
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to run document chat",
    });
  });
});

export {};
