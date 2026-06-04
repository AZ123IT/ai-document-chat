"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { ChatPanel, sendChatQuestion } from "@/components/dashboard/chat-panel";
import type {
  ChatMessage,
  DocumentsListResponse,
  LocalDocument,
  SourceCitation,
  UploadDocumentResponse,
} from "@/components/dashboard/dashboard-types";
import { DocumentList } from "@/components/dashboard/document-list";
import { DocumentUploadPanel } from "@/components/dashboard/document-upload-panel";
import { SourceCitations } from "@/components/dashboard/source-citations";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";

export function AppShell() {
  const [documents, setDocuments] = useState<LocalDocument[]>([]);
  const [documentListError, setDocumentListError] = useState<string | null>(null);
  const [isDocumentListLoading, setIsDocumentListLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<LocalDocument | null>(
    null,
  );
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isUploadLoading, setIsUploadLoading] = useState(false);
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

  const refreshDocuments = useCallback(async () => {
    setDocumentListError(null);
    setIsDocumentListLoading(true);

    try {
      setDocuments(await fetchDashboardDocuments());
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load documents";
      setDocumentListError(message);
    } finally {
      setIsDocumentListLoading(false);
    }
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadInitialDocuments() {
      try {
        const nextDocuments = await fetchDashboardDocuments();

        if (isActive) {
          setDocuments(nextDocuments);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to load documents";

        if (isActive) {
          setDocumentListError(message);
        }
      } finally {
        if (isActive) {
          setIsDocumentListLoading(false);
        }
      }
    }

    void loadInitialDocuments();

    return () => {
      isActive = false;
    };
  }, []);

  function handleFileSelected(file: File) {
    const documentType = getSupportedDocumentType(file);

    if (!documentType) {
      setUploadError("Only PDF and TXT files are supported.");
      setUploadSuccess(null);
      setSelectedFile(null);
      setSelectedDocument(null);
      return;
    }

    setUploadError(null);
    setUploadSuccess(null);
    setSelectedFile(file);
    setSelectedDocument({
      id: `${file.name}-${file.size}-${file.lastModified}`,
      name: file.name,
      type: documentType,
      sizeLabel: formatFileSize(file.size),
      status: "staged",
    });
  }

  async function handleUploadSelectedFile() {
    if (!selectedFile) {
      setUploadError("Choose a PDF or TXT document before uploading.");
      return;
    }

    setUploadError(null);
    setUploadSuccess(null);
    setIsUploadLoading(true);

    try {
      const formData = new FormData();
      formData.set("file", selectedFile, selectedFile.name);
      formData.set("fileName", selectedFile.name);

      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as
        | UploadDocumentResponse
        | { error?: string };

      if (!response.ok) {
        throw new Error(
          "error" in payload && payload.error
            ? payload.error
            : "Failed to upload document",
        );
      }

      if (!isUploadDocumentResponse(payload)) {
        throw new Error("Failed to upload document");
      }

      setUploadSuccess(
        `Upload complete. ${payload.ingestion.chunkCount} chunks indexed.`,
      );
      setSelectedFile(null);
      setSelectedDocument(null);
      await refreshDocuments();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to upload document";
      setUploadError(`Unable to upload document: ${message}`);
    } finally {
      setIsUploadLoading(false);
    }
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
              isUploading={isUploadLoading}
              selectedDocument={selectedDocument}
              successMessage={uploadSuccess}
              onFileSelected={handleFileSelected}
              onUpload={handleUploadSelectedFile}
            />
            <DocumentList
              documents={documents}
              error={documentListError}
              isLoading={isDocumentListLoading}
            />
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

async function fetchDashboardDocuments() {
  const response = await fetch("/api/documents");
  const payload = (await response.json()) as
    | DocumentsListResponse
    | { error?: string };

  if (!response.ok) {
    throw new Error(
      "error" in payload && payload.error
        ? payload.error
        : "Failed to load documents",
    );
  }

  if (!isDocumentsListResponse(payload)) {
    throw new Error("Failed to load documents");
  }

  return payload.documents.map(toDashboardDocument);
}

function isDocumentsListResponse(
  payload: DocumentsListResponse | { error?: string },
): payload is DocumentsListResponse {
  return "documents" in payload && Array.isArray(payload.documents);
}

function isUploadDocumentResponse(
  payload: UploadDocumentResponse | { error?: string },
): payload is UploadDocumentResponse {
  return "ingestion" in payload && typeof payload.ingestion.chunkCount === "number";
}

function toDashboardDocument(document: DocumentListItem): LocalDocument {
  return {
    id: String(document.id),
    name: document.fileName,
    type: document.fileType,
    sizeLabel: formatFileSize(document.fileSizeBytes),
    status: document.status,
  };
}

type DocumentListItem = DocumentsListResponse["documents"][number];

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
