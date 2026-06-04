import "server-only";

import {
  DEFAULT_DEEPSEEK_BASE_URL,
  DEFAULT_DEEPSEEK_CHAT_MODEL,
  createDeepSeekChatProvider,
} from "./deepseek-chat-provider";
import {
  createPlaceholderChatProvider,
  type ChatProvider,
} from "./chat-provider";

type LlmProvider = "mock" | "deepseek";

export class ChatProviderConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChatProviderConfigurationError";
  }
}

export function createConfiguredChatProvider(): ChatProvider {
  const provider = getConfiguredLlmProvider();

  if (provider === "mock") {
    return createPlaceholderChatProvider();
  }

  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();

  if (!apiKey) {
    throw new ChatProviderConfigurationError(
      "DeepSeek chat provider is not configured",
    );
  }

  return createDeepSeekChatProvider({
    apiKey,
    baseUrl: process.env.DEEPSEEK_BASE_URL?.trim() || DEFAULT_DEEPSEEK_BASE_URL,
    model:
      process.env.DEEPSEEK_CHAT_MODEL?.trim() || DEFAULT_DEEPSEEK_CHAT_MODEL,
  });
}

function getConfiguredLlmProvider(): LlmProvider {
  const provider = process.env.LLM_PROVIDER?.trim().toLowerCase();

  if (!provider || provider === "mock") {
    return "mock";
  }

  if (provider === "deepseek") {
    return "deepseek";
  }

  throw new ChatProviderConfigurationError("Unsupported LLM provider");
}
