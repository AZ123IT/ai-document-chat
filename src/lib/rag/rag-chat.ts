import type { QueryEmbeddingProvider } from "@/lib/ingestion/embedding-provider";
import type {
  ChatMessageRole,
  Database,
  Json,
} from "@/lib/supabase/database.types";

import { buildRagPrompt, type SourceCitation } from "./build-rag-prompt";
import type { ChatProvider } from "./chat-provider";
import {
  retrieveRelevantChunks,
  type SupabaseRetrievalClient,
} from "./retrieve-context";

type SupabaseErrorLike = {
  message: string;
};

type ChatSessionsInsert =
  Database["public"]["Tables"]["chat_sessions"]["Insert"];
type ChatMessagesInsert =
  Database["public"]["Tables"]["chat_messages"]["Insert"];

type ChatSessionInsertResult = {
  id: number;
};

type ChatMessageInsertResult = {
  id: number;
  role: ChatMessageRole;
};

export type SupabaseRagChatClient = SupabaseRetrievalClient & {
  from(table: "chat_sessions"): {
    insert(payload: ChatSessionsInsert): {
      select(columns: string): {
        single(): Promise<{
          data: ChatSessionInsertResult | null;
          error: SupabaseErrorLike | null;
        }> | PromiseLike<{
          data: ChatSessionInsertResult | null;
          error: SupabaseErrorLike | null;
        }>;
      };
    };
    delete(): {
      eq(
        column: "id",
        value: number,
      ): PromiseLike<{
        error: SupabaseErrorLike | null;
      }>;
    };
  };
  from(table: "chat_messages"): {
    insert(payload: ChatMessagesInsert[]): {
      select(columns: string): PromiseLike<{
        data: ChatMessageInsertResult[] | null;
        error: SupabaseErrorLike | null;
      }>;
    };
  };
};

export type RagChatRequest = {
  question: string;
  sessionId?: number;
  documentIds?: number[];
};

export type RagChatResult = {
  answer: string;
  citations: SourceCitation[];
  sessionId: number;
  messageIds: {
    user: number;
    assistant: number;
  };
};

export type RunRagChatOptions = {
  request: unknown;
  supabase: SupabaseRagChatClient;
  embeddingProvider: QueryEmbeddingProvider;
  chatProvider: ChatProvider;
};

export class RagChatValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RagChatValidationError";
  }
}

export async function runRagChat({
  request,
  supabase,
  embeddingProvider,
  chatProvider,
}: RunRagChatOptions): Promise<RagChatResult> {
  const normalizedRequest = parseRagChatRequest(request);
  const chunks = await retrieveRelevantChunks({
    question: normalizedRequest.question,
    supabase,
    embeddingProvider,
    documentIds: normalizedRequest.documentIds,
  });
  const prompt = buildRagPrompt({
    question: normalizedRequest.question,
    chunks,
  });
  const { answer } = await chatProvider.generateAnswer(prompt.messages);
  let createdSessionId: number | undefined;
  let sessionId: number;

  if (normalizedRequest.sessionId === undefined) {
    createdSessionId = await createChatSession(
      supabase,
      normalizedRequest.question,
    );
    sessionId = createdSessionId;
  } else {
    sessionId = normalizedRequest.sessionId;
  }

  let messageIds: RagChatResult["messageIds"];

  try {
    messageIds = await saveChatMessages({
      supabase,
      sessionId,
      question: normalizedRequest.question,
      answer,
      citations: prompt.citations,
    });
  } catch (error) {
    if (createdSessionId !== undefined) {
      await deleteChatSession(supabase, createdSessionId);
    }

    throw error;
  }

  return {
    answer,
    citations: prompt.citations,
    sessionId,
    messageIds,
  };
}

export function parseRagChatRequest(request: unknown): RagChatRequest {
  if (!isRecord(request) || typeof request.question !== "string") {
    throw new RagChatValidationError("Question is required");
  }

  const question = request.question.trim();

  if (!question) {
    throw new RagChatValidationError("Question is required");
  }

  const sessionId = request.sessionId;

  if (
    sessionId !== undefined &&
    (typeof sessionId !== "number" ||
      !Number.isInteger(sessionId) ||
      sessionId <= 0)
  ) {
    throw new RagChatValidationError("Session id must be a positive integer");
  }

  const documentIds = request.documentIds;

  if (
    documentIds !== undefined &&
    (!Array.isArray(documentIds) ||
      !documentIds.every(
        (documentId) => Number.isInteger(documentId) && documentId > 0,
      ))
  ) {
    throw new RagChatValidationError(
      "Document ids must be positive integers",
    );
  }

  return {
    question,
    sessionId,
    documentIds:
      Array.isArray(documentIds) && documentIds.length > 0
        ? documentIds
        : undefined,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function createChatSession(
  supabase: SupabaseRagChatClient,
  question: string,
) {
  const { data, error } = await supabase
    .from("chat_sessions")
    .insert({
      title: createSessionTitle(question),
      metadata: {},
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to create chat session: ${error.message}`);
  }

  if (!data) {
    throw new Error("Failed to create chat session: no session returned");
  }

  return data.id;
}

async function saveChatMessages({
  supabase,
  sessionId,
  question,
  answer,
  citations,
}: {
  supabase: SupabaseRagChatClient;
  sessionId: number;
  question: string;
  answer: string;
  citations: SourceCitation[];
}) {
  const { data, error } = await supabase
    .from("chat_messages")
    .insert([
      {
        session_id: sessionId,
        role: "user",
        content: question,
        citations: [] as Json,
      },
      {
        session_id: sessionId,
        role: "assistant",
        content: answer,
        citations: citations as Json,
      },
    ])
    .select("id, role");

  if (error) {
    throw new Error(`Failed to save chat messages: ${error.message}`);
  }

  if (!data || data.length !== 2) {
    throw new Error("Failed to save chat messages: unexpected insert result");
  }

  const userMessage = data.find((message) => message.role === "user");
  const assistantMessage = data.find((message) => message.role === "assistant");

  if (!userMessage || !assistantMessage) {
    throw new Error("Failed to save chat messages: missing message ids");
  }

  return {
    user: userMessage.id,
    assistant: assistantMessage.id,
  };
}

async function deleteChatSession(
  supabase: SupabaseRagChatClient,
  sessionId: number,
) {
  const { error } = await supabase
    .from("chat_sessions")
    .delete()
    .eq("id", sessionId);

  if (error) {
    throw new Error(`Failed to clean up chat session: ${error.message}`);
  }
}

function createSessionTitle(question: string) {
  return question.length <= 80 ? question : question.slice(0, 77).trimEnd() + "...";
}
