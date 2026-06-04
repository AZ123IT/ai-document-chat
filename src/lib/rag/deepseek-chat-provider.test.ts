import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { ChatMessage } from "./chat-provider";
import { createDeepSeekChatProvider } from "./deepseek-chat-provider";

vi.mock("server-only", () => ({}));

describe("createDeepSeekChatProvider", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("sends an OpenAI-compatible chat completions request", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        choices: [
          {
            message: {
              content: "DeepSeek grounded answer",
            },
          },
        ],
      }),
    );
    const messages: ChatMessage[] = [
      { role: "system", content: "Use context only." },
      { role: "user", content: "What does the document say?" },
    ];

    const provider = createDeepSeekChatProvider({
      apiKey: "test-deepseek-key",
      baseUrl: "https://deepseek.test/",
      model: "deepseek-test-model",
    });
    const result = await provider.generateAnswer(messages);

    expect(result).toEqual({ answer: "DeepSeek grounded answer" });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://deepseek.test/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-deepseek-key",
        },
        body: JSON.stringify({
          model: "deepseek-test-model",
          messages,
          stream: false,
        }),
      },
    );
  });

  it("uses default DeepSeek base URL and model when optional config is omitted", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        choices: [
          {
            message: {
              content: "Default config answer",
            },
          },
        ],
      }),
    );

    const provider = createDeepSeekChatProvider({
      apiKey: "test-deepseek-key",
    });
    await provider.generateAnswer([{ role: "user", content: "Hello" }]);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.deepseek.com/chat/completions",
      expect.objectContaining({
        body: JSON.stringify({
          model: "deepseek-v4-flash",
          messages: [{ role: "user", content: "Hello" }],
          stream: false,
        }),
      }),
    );
  });

  it("handles non-OK provider responses with a safe error", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json(
        {
          error: {
            message: "Invalid API key",
          },
        },
        {
          status: 401,
        },
      ),
    );
    const provider = createDeepSeekChatProvider({
      apiKey: "test-deepseek-key",
    });

    await expect(
      provider.generateAnswer([{ role: "user", content: "Hello" }]),
    ).rejects.toThrow("DeepSeek chat request failed");
  });

  it("handles malformed provider responses safely", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        choices: [],
      }),
    );
    const provider = createDeepSeekChatProvider({
      apiKey: "test-deepseek-key",
    });

    await expect(
      provider.generateAnswer([{ role: "user", content: "Hello" }]),
    ).rejects.toThrow("DeepSeek chat response was malformed");
  });

  it("keeps the DeepSeek provider in a server-only module", () => {
    const source = readFileSync(
      join(process.cwd(), "src/lib/rag/deepseek-chat-provider.ts"),
      {
        encoding: "utf8",
      },
    );

    expect(source).toMatch(/^import "server-only";/);
  });
});
