"use client";

import { FormEvent, useState } from "react";

import type { ChatMessage, ChatResponse, SourceCitation } from "./dashboard-types";

type ChatPanelProps = {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  onSubmit(question: string): Promise<void>;
};

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
    <section className="flex min-h-[560px] flex-col rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-200 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
          chat
        </p>
        <h2 className="mt-2 text-lg font-semibold text-zinc-950">
          Ask your documents
        </h2>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {messages.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-5 text-sm text-zinc-500">
            Ask a question after staging a document.
          </div>
        ) : (
          messages.map((message) => (
            <article
              className={
                message.role === "user"
                  ? "ml-auto max-w-[85%] rounded-lg bg-zinc-950 px-4 py-3 text-white"
                  : "max-w-[92%] rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-900"
              }
              key={message.id}
            >
              <p className="text-sm leading-6">{message.content}</p>
            </article>
          ))
        )}

        {isLoading ? (
          <p
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
            role="status"
          >
            Generating answer...
          </p>
        ) : null}

        {error ? (
          <p
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </div>

      <form className="border-t border-zinc-200 p-5" onSubmit={handleSubmit}>
        <label
          className="text-sm font-semibold text-zinc-950"
          htmlFor="chat-question"
        >
          Question
        </label>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            className="min-h-11 flex-1 rounded-lg border border-zinc-300 bg-white px-4 text-sm text-zinc-950 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            id="chat-question"
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask about a staged document"
            type="text"
            value={question}
          />
          <button
            className="min-h-11 rounded-lg bg-zinc-950 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
            disabled={isLoading || question.trim().length === 0}
            type="submit"
          >
            Send question
          </button>
        </div>
      </form>
    </section>
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
