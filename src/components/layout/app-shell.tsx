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
        status: "Staged locally",
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
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-[0_20px_60px_rgba(24,24,27,0.08)]">
          <div className="border-b border-zinc-100 bg-zinc-950 px-5 py-2 text-[11px] font-semibold uppercase text-zinc-100">
            RAG portfolio app
          </div>
          <div className="flex flex-col gap-6 px-5 py-6 lg:flex-row lg:items-end lg:justify-between lg:px-6">
            <div>
              <p className="text-xs font-semibold uppercase text-emerald-700">
                Document-grounded AI workspace
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-zinc-950 sm:text-4xl">
                {APP_NAME}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600 sm:text-base">
                {APP_DESCRIPTION}
              </p>
            </div>

            <dl className="grid grid-cols-3 gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-2 shadow-inner">
              {dashboardStats.map((stat) => (
                <div
                  className="min-w-20 rounded-md bg-white px-3 py-2 text-center shadow-sm ring-1 ring-zinc-200/80"
                  key={stat.label}
                >
                  <dt className="text-[11px] font-semibold uppercase text-zinc-500">
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

        <section className="grid flex-1 gap-5 py-5 lg:grid-cols-[400px_minmax(0,1fr)]">
          <div className="space-y-5">
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
