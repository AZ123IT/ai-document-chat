import "server-only";

import type { ChatMessage, ChatProvider } from "./chat-provider";

export const DEFAULT_DEEPSEEK_BASE_URL = "https://api.deepseek.com";
export const DEFAULT_DEEPSEEK_CHAT_MODEL = "deepseek-chat";

export type DeepSeekChatProviderOptions = {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  fetcher?: typeof fetch;
};

type DeepSeekChatCompletionsResponse = {
  choices?: Array<{
    message?: {
      content?: unknown;
    };
  }>;
};

export class DeepSeekChatProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DeepSeekChatProviderError";
  }
}

export function createDeepSeekChatProvider({
  apiKey,
  baseUrl = DEFAULT_DEEPSEEK_BASE_URL,
  model = DEFAULT_DEEPSEEK_CHAT_MODEL,
  fetcher = fetch,
}: DeepSeekChatProviderOptions): ChatProvider {
  const normalizedBaseUrl = baseUrl.replace(/\/+$/, "");

  return {
    async generateAnswer(messages: ChatMessage[]) {
      const response = await fetcher(
        `${normalizedBaseUrl}/chat/completions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages,
            stream: false,
          }),
        },
      );

      if (!response.ok) {
        throw new DeepSeekChatProviderError("DeepSeek chat request failed");
      }

      const payload = (await response.json()) as DeepSeekChatCompletionsResponse;
      const answer = payload.choices?.[0]?.message?.content;

      if (typeof answer !== "string" || answer.trim().length === 0) {
        throw new DeepSeekChatProviderError(
          "DeepSeek chat response was malformed",
        );
      }

      return {
        answer,
      };
    },
  };
}
