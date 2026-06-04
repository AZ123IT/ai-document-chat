import { readFileSync } from "node:fs";
import { join } from "node:path";

const createDeepSeekChatProviderMock = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));

vi.mock("@/lib/rag/deepseek-chat-provider", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/rag/deepseek-chat-provider")
  >("@/lib/rag/deepseek-chat-provider");

  return {
    ...actual,
    createDeepSeekChatProvider: createDeepSeekChatProviderMock,
  };
});

describe("createConfiguredChatProvider", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    createDeepSeekChatProviderMock.mockReset();
    process.env = {
      ...originalEnv,
      LLM_PROVIDER: undefined,
      DEEPSEEK_API_KEY: undefined,
      DEEPSEEK_BASE_URL: undefined,
      DEEPSEEK_CHAT_MODEL: undefined,
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("defaults to the mock provider when LLM_PROVIDER is unset", async () => {
    const { createConfiguredChatProvider } = await import(
      "./chat-provider-factory"
    );

    const provider = createConfiguredChatProvider();
    const result = await provider.generateAnswer([]);

    expect(result.answer).toContain("chat model provider is not configured");
    expect(createDeepSeekChatProviderMock).not.toHaveBeenCalled();
  });

  it("uses the mock provider when LLM_PROVIDER is mock", async () => {
    process.env.LLM_PROVIDER = "mock";

    const { createConfiguredChatProvider } = await import(
      "./chat-provider-factory"
    );

    const provider = createConfiguredChatProvider();
    const result = await provider.generateAnswer([]);

    expect(result.answer).toContain("chat model provider is not configured");
    expect(createDeepSeekChatProviderMock).not.toHaveBeenCalled();
  });

  it("selects the DeepSeek provider when LLM_PROVIDER is deepseek", async () => {
    const deepSeekProvider = { generateAnswer: vi.fn() };
    createDeepSeekChatProviderMock.mockReturnValue(deepSeekProvider);
    process.env.LLM_PROVIDER = "deepseek";
    process.env.DEEPSEEK_API_KEY = "test-deepseek-key";
    process.env.DEEPSEEK_BASE_URL = "https://deepseek.test";
    process.env.DEEPSEEK_CHAT_MODEL = "deepseek-test-model";

    const { createConfiguredChatProvider } = await import(
      "./chat-provider-factory"
    );

    expect(createConfiguredChatProvider()).toBe(deepSeekProvider);
    expect(createDeepSeekChatProviderMock).toHaveBeenCalledWith({
      apiKey: "test-deepseek-key",
      baseUrl: "https://deepseek.test",
      model: "deepseek-test-model",
    });
  });

  it("throws a safe server-side configuration error when the DeepSeek API key is missing", async () => {
    process.env.LLM_PROVIDER = "deepseek";

    const { ChatProviderConfigurationError, createConfiguredChatProvider } =
      await import("./chat-provider-factory");

    expect(() => createConfiguredChatProvider()).toThrow(
      ChatProviderConfigurationError,
    );
    expect(() => createConfiguredChatProvider()).toThrow(
      "DeepSeek chat provider is not configured",
    );
    expect(createDeepSeekChatProviderMock).not.toHaveBeenCalled();
  });

  it("does not expose DeepSeek configuration through NEXT_PUBLIC variables", async () => {
    process.env.LLM_PROVIDER = "deepseek";
    process.env.DEEPSEEK_API_KEY = "server-only-key";
    process.env[`NEXT_PUBLIC_${"DEEPSEEK"}_API_KEY`] = "leaked-key";

    const { createConfiguredChatProvider } = await import(
      "./chat-provider-factory"
    );

    createConfiguredChatProvider();

    expect(createDeepSeekChatProviderMock).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: "server-only-key",
      }),
    );
    expect(createDeepSeekChatProviderMock).not.toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: "leaked-key",
      }),
    );
  });

  it("keeps provider configuration in a server-only module", () => {
    const source = readFileSync(
      join(process.cwd(), "src/lib/rag/chat-provider-factory.ts"),
      {
        encoding: "utf8",
      },
    );

    expect(source).toMatch(/^import "server-only";/);
    expect(source).not.toContain(`NEXT_PUBLIC_${"DEEPSEEK"}`);
  });
});

export {};
