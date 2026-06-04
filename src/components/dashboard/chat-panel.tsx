"use client";

import { FormEvent, useState } from "react";

import type { ChatMessage, ChatResponse, SourceCitation } from "./dashboard-types";

type ChatPanelProps = {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  onSubmit(question: string): Promise<void>;
};

const CHAT_MODEL_LABEL = "deepseek-v4-flash";

export function ChatPanel({
  messages,
  isLoading,
  error,
  onSubmit,
}: ChatPanelProps) {
  const [question, setQuestion] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedQuestion = question.trim();
    if (!trimmedQuestion || isLoading) {
      return;
    }

    setQuestion("");
    await onSubmit(trimmedQuestion);
  }

  return (
    <section className="flex min-h-[680px] flex-col bg-[#f7f6f1]">
      <header className="flex items-center justify-between gap-4 border-b border-zinc-200 bg-white px-5 py-4">
        <div>
          <p className="text-[11px] font-semibold uppercase text-emerald-700">
            Chat workspace
          </p>
          <h2 className="mt-1 text-lg font-semibold text-zinc-950">
            Ask your documents
          </h2>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          {CHAT_MODEL_LABEL}
        </span>
      </header>

      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
        {messages.length === 0 ? (
          <div className="mx-auto mt-12 max-w-md rounded-lg border border-zinc-200 bg-white px-5 py-6 text-center shadow-sm">
            <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
              <SparkIcon />
            </span>
            <p className="mt-3 text-sm font-semibold text-zinc-900">
              Ask a question after uploading a document.
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              The assistant will answer from retrieved chunks and show source
              citations in the evidence panel.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}

        {isLoading ? (
          <div className="flex items-start gap-3">
            <Avatar label="AI" tone="assistant" />
            <p
              className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-600 shadow-sm"
              role="status"
            >
              <span className="mr-2 inline-flex gap-1 align-middle">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-200" />
              </span>
              Generating answer...
            </p>
          </div>
        ) : null}

        {error ? (
          <p
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 shadow-sm"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </div>

      <form
        className="border-t border-zinc-200 bg-white px-4 py-3"
        onSubmit={handleSubmit}
      >
        <label className="sr-only" htmlFor="chat-question">
          Question
        </label>
        <div className="flex gap-2">
          <input
            className="min-h-12 flex-1 rounded-lg border border-zinc-300 bg-white px-4 text-sm text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            id="chat-question"
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask about your indexed documents..."
            type="text"
            value={question}
          />
          <button
            aria-label="Send question"
            className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:shadow-none"
            disabled={isLoading || question.trim().length === 0}
            type="submit"
          >
            <SendIcon />
            Send
          </button>
        </div>
      </form>
    </section>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <article className="flex items-start justify-end gap-3">
        <div className="max-w-[78%] rounded-lg bg-emerald-600 px-4 py-3 text-white shadow-md">
          <p className="text-sm font-semibold leading-6">{message.content}</p>
        </div>
        <Avatar label="U" tone="user" />
      </article>
    );
  }

  return (
    <article className="flex items-start gap-3">
      <Avatar label="AI" tone="assistant" />
      <div className="max-w-[82%] rounded-lg border border-zinc-200 bg-white px-4 py-3 text-zinc-900 shadow-sm">
        <p className="text-sm leading-6">{message.content}</p>
        {message.citations?.length ? (
          <p className="mt-3 text-xs font-medium text-zinc-500">
            {message.citations.length} sources cited
          </p>
        ) : null}
      </div>
    </article>
  );
}

function Avatar({
  label,
  tone,
}: {
  label: string;
  tone: "assistant" | "user";
}) {
  const className =
    tone === "user"
      ? "bg-indigo-50 text-indigo-700 ring-indigo-100"
      : "bg-emerald-50 text-emerald-700 ring-emerald-100";

  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-1 ${className}`}
    >
      {label}
    </span>
  );
}

function SparkIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />
      <path d="m18 15 .8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8z" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="m22 2-7 20-4-9-9-4z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}

export async function sendChatQuestion(question: string): Promise<ChatResponse> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      question,
    }),
  });
  const payload = (await response.json()) as Partial<ChatResponse> & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error ?? "Failed to run document chat");
  }

  return {
    answer: payload.answer ?? "",
    citations: normalizeCitations(payload.citations),
    sessionId: payload.sessionId,
    messageIds: payload.messageIds,
  };
}

function normalizeCitations(citations: unknown): SourceCitation[] {
  return Array.isArray(citations) ? (citations as SourceCitation[]) : [];
}
