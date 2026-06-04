import { createPlaceholderEmbeddingProvider } from "@/lib/ingestion/embedding-provider";
import {
  ChatProviderConfigurationError,
  createConfiguredChatProvider,
} from "@/lib/rag/chat-provider-factory";
import {
  RagChatValidationError,
  parseRagChatRequest,
  runRagChat,
} from "@/lib/rag/rag-chat";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const chatRequest = parseRagChatRequest(body);
    const result = await runRagChat({
      request: chatRequest,
      supabase: createServerSupabaseClient(),
      embeddingProvider: createPlaceholderEmbeddingProvider(),
      chatProvider: createConfiguredChatProvider(),
    });

    return Response.json(result);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json({ error: "Invalid JSON request body" }, { status: 400 });
    }

    if (error instanceof RagChatValidationError) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof ChatProviderConfigurationError) {
      console.error("POST /api/chat chat provider configuration failed", error);

      return Response.json(
        {
          error: "Chat provider is not configured",
        },
        { status: 500 },
      );
    }

    console.error("POST /api/chat failed", error);

    return Response.json(
      {
        error: "Failed to run document chat",
      },
      { status: 500 },
    );
  }
}
