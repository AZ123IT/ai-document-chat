export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ChatProvider = {
  generateAnswer(messages: ChatMessage[]): Promise<{
    answer: string;
  }>;
};

export function createPlaceholderChatProvider(): ChatProvider {
  return {
    async generateAnswer() {
      return {
        answer:
          "A chat model provider is not configured yet. Configure a server-side chat provider before using document chat.",
      };
    },
  };
}
