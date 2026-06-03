"use client";

import { useMemo, useState } from "react";

import { ChatPanel, sendChatQuestion } from "@/components/dashboard/chat-panel";
import type {
  ChatMessage,
  LocalDocument,
  SourceCitation,
} from "@/components/dashboard/dashboard-types";
import { DocumentList } from "@/components/dashboard/document-list";
import { DocumentUploadPanel } from "@/components/dashboard/document-upload-panel";
import { SourceCitations } from "@/components/dashboard/source-citations";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";

export function AppShell() {
  const [documents, setDocuments] = useState<LocalDocument[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [citations, setCitations] = useState<SourceCitation[]>([]);
  const [chatError, setChatError] = useState<string | null>(null);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const documentCount = documents.length;
  const dashboardStats = useMemo(
    () => [
      { label: "documents", value: documentCount },
      { label: "messages", value: messages.length },
      { label: "sources", value: citations.length },
    ],
    [citations.length, documentCount, messages.length],
  );

  function handleFileSelected(file: File) {
    if (!isSupportedDocument(file)) {
      setUploadError("Only PDF and TXT files are supported.");
      return;
    }

    setUploadError(null);
    setDocuments([
      {
        id: `${file.name}-${file.size}-${file.lastModified}`,
        name: file.name,
        type: getDocumentType(file),
        sizeLabel: formatFileSize(file.size),
        status: "Ready for future upload API",
      },
    ]);
  }

  async function handleChatSubmit(question: string) {
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: question,
    };

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setChatError(null);
    setIsChatLoading(true);

    try {
      const response = await sendChatQuestion(question);
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response.answer,
        citations: response.citations,
      };

      setMessages((currentMessages) => [...currentMessages, assistantMessage]);
      setCitations(response.citations);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to run document chat";
      setChatError(`Unable to answer right now: ${message}`);
    } finally {
      setIsChatLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-stone-100 text-zinc-950">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="rounded-lg border border-zinc-200 bg-white px-5 py-5 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                RAG portfolio app
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
                {APP_NAME}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base">
                {APP_DESCRIPTION}
              </p>
            </div>

            <dl className="grid grid-cols-3 gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-2">
              {dashboardStats.map((stat) => (
                <div className="min-w-20 px-3 py-2 text-center" key={stat.label}>
                  <dt className="text-xs font-medium uppercase text-zinc-500">
                    {stat.label}
                  </dt>
                  <dd className="mt-1 text-xl font-semibold text-zinc-950">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </header>

        <section className="grid flex-1 gap-4 py-4 lg:grid-cols-[390px_minmax(0,1fr)]">
          <div className="space-y-4">
            <DocumentUploadPanel
              error={uploadError}
              onFileSelected={handleFileSelected}
            />
            <DocumentList documents={documents} />
            <SourceCitations citations={citations} />
          </div>

          <ChatPanel
            error={chatError}
            isLoading={isChatLoading}
            messages={messages}
            onSubmit={handleChatSubmit}
          />
        </section>
      </div>
    </main>
  );
}

function isSupportedDocument(file: File) {
  const fileName = file.name.toLowerCase();
  const type = file.type.toLowerCase();

  return (
    type === "application/pdf" ||
    type === "text/plain" ||
    fileName.endsWith(".pdf") ||
    fileName.endsWith(".txt")
  );
}

function getDocumentType(file: File): LocalDocument["type"] {
  return file.name.toLowerCase().endsWith(".pdf") ||
    file.type.toLowerCase() === "application/pdf"
    ? "PDF"
    : "TXT";
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
