import { createPlaceholderEmbeddingProvider } from "@/lib/ingestion/embedding-provider";
import { createPlaceholderChatProvider } from "@/lib/rag/chat-provider";
import { RagChatValidationError, runRagChat } from "@/lib/rag/rag-chat";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await runRagChat({
      request: body,
      supabase: createServerSupabaseClient(),
      embeddingProvider: createPlaceholderEmbeddingProvider(),
      chatProvider: createPlaceholderChatProvider(),
    });

    return Response.json(result);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return Response.json({ error: "Invalid JSON request body" }, { status: 400 });
    }

    if (error instanceof RagChatValidationError) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to run document chat",
      },
      { status: 500 },
    );
  }
}
