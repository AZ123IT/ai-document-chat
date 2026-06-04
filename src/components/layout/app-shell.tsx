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
      { label: "docs", value: documentCount },
      { label: "messages", value: messages.length },
      { label: "sources", value: citations.length },
    ],
    [citations.length, documentCount, messages.length],
  );

  function handleFileSelected(file: File) {
    const documentType = getSupportedDocumentType(file);

    if (!documentType) {
      setUploadError("Only PDF and TXT files are supported.");
      return;
    }

    setUploadError(null);
    setDocuments([
      {
        id: `${file.name}-${file.size}-${file.lastModified}`,
        name: file.name,
        type: documentType,
        sizeLabel: formatFileSize(file.size),
        status: "staged",
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
    <main className="dashboard-backdrop min-h-screen text-zinc-950">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-3 py-3 sm:px-5 lg:px-6">
        <header className="rounded-lg border border-zinc-800 bg-[#0d1117] px-4 py-3 text-white shadow-[0_18px_55px_rgba(13,17,23,0.18)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_0_5px_rgba(52,211,153,0.12)]" />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase text-zinc-400">
                  RAG portfolio app
                </p>
                <h1 className="truncate text-lg font-semibold text-white sm:text-xl">
                  {APP_NAME}
                </h1>
              </div>
            </div>

            <dl className="flex flex-wrap gap-2">
              {dashboardStats.map((stat) => (
                <div
                  className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 shadow-inner"
                  key={stat.label}
                >
                  <dt className="sr-only">{stat.label}</dt>
                  <dd className="text-xs font-semibold text-zinc-100">
                    {stat.value}
                    <span className="ml-1 text-zinc-300">{stat.label}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </header>

        <section className="mt-3 grid flex-1 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-[0_24px_70px_rgba(24,24,27,0.12)] sm:grid-cols-[320px_minmax(0,1fr)] lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="space-y-0 divide-y divide-zinc-200 bg-zinc-50/80">
            <DocumentUploadPanel
              error={uploadError}
              onFileSelected={handleFileSelected}
            />
            <DocumentList documents={documents} />
            <SourceCitations citations={citations} />
          </aside>

          <ChatPanel
            error={chatError}
            isLoading={isChatLoading}
            messages={messages}
            onSubmit={handleChatSubmit}
          />
        </section>
        <p className="px-1 py-3 text-xs text-zinc-500">{APP_DESCRIPTION}</p>
      </div>
    </main>
  );
}

function getSupportedDocumentType(file: File): LocalDocument["type"] | null {
  const fileName = file.name.toLowerCase();
  const extensionType = getSupportedExtensionDocumentType(fileName);
  const mimeType = getSupportedMimeDocumentType(file.type);

  if (file.type && !mimeType) {
    return null;
  }

  if (extensionType && mimeType && extensionType !== mimeType) {
    return null;
  }

  return extensionType ?? mimeType;
}

function getSupportedExtensionDocumentType(
  fileName: string,
): LocalDocument["type"] | null {
  if (fileName.endsWith(".pdf")) {
    return "PDF";
  }

  if (fileName.endsWith(".txt")) {
    return "TXT";
  }

  return null;
}

function getSupportedMimeDocumentType(
  mimeType: string,
): LocalDocument["type"] | null {
  const normalizedMimeType = mimeType.trim().toLowerCase();

  if (normalizedMimeType === "application/pdf") {
    return "PDF";
  }

  if (normalizedMimeType === "text/plain") {
    return "TXT";
  }

  return null;
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
