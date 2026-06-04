const createServerSupabaseClientMock = vi.hoisted(() => vi.fn());
const createPlaceholderEmbeddingProviderMock = vi.hoisted(() => vi.fn());
const createConfiguredChatProviderMock = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: createServerSupabaseClientMock,
}));

vi.mock("@/lib/ingestion/embedding-provider", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/ingestion/embedding-provider")
  >("@/lib/ingestion/embedding-provider");

  return {
    ...actual,
    createPlaceholderEmbeddingProvider: createPlaceholderEmbeddingProviderMock,
  };
});

vi.mock("@/lib/rag/chat-provider-factory", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/rag/chat-provider-factory")
  >("@/lib/rag/chat-provider-factory");

  return {
    ...actual,
    createConfiguredChatProvider: createConfiguredChatProviderMock,
  };
});

describe("POST /api/chat request validation", () => {
  beforeEach(() => {
    vi.resetModules();
    createServerSupabaseClientMock.mockReset();
    createPlaceholderEmbeddingProviderMock.mockReset();
    createConfiguredChatProviderMock.mockReset();
  });

  it.each([{}, null, { question: 123 }])(
    "returns 400 for invalid body shape %# before creating server clients",
    async (body) => {
      const { POST } = await import("./route");
      const response = await POST(
        new Request("http://localhost/api/chat", {
          method: "POST",
          body: JSON.stringify(body),
        }),
      );

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: "Question is required",
      });
      expect(createServerSupabaseClientMock).not.toHaveBeenCalled();
      expect(createPlaceholderEmbeddingProviderMock).not.toHaveBeenCalled();
      expect(createConfiguredChatProviderMock).not.toHaveBeenCalled();
    },
  );
});

export {};
