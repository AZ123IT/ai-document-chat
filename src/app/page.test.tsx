import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { DocumentResponse } from "@/components/dashboard/dashboard-types";

import Home from "./page";

describe("Home", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the dashboard shell", async () => {
    mockFetch({
      documents: [],
    });

    render(<Home />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "AI Document Chat",
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Upload document" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Documents" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ask your documents" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Source citations" })).toBeInTheDocument();
    expect(screen.getByText("deepseek-v4-flash")).toBeInTheDocument();
    expect(screen.queryByText("claude-sonnet-4")).not.toBeInTheDocument();
    expect(await screen.findByText("No documents indexed")).toBeInTheDocument();
  });

  it("loads documents from GET /api/documents on mount", async () => {
    const fetchMock = mockFetch({
      documents: [
        createDocument({
          id: 9,
          fileName: "indexed-notes.pdf",
          fileType: "PDF",
          fileSizeBytes: 4096,
        }),
      ],
    });

    render(<Home />);

    expect(await screen.findByText("indexed-notes.pdf")).toBeInTheDocument();
    expect(screen.getByText("PDF - 4.0 KB")).toBeInTheDocument();
    expect(screen.getByText("ready")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/documents");
  });

  it("stages a selected PDF file without uploading immediately", async () => {
    const user = userEvent.setup();
    const fetchMock = mockFetch({
      documents: [],
    });

    render(<Home />);
    await screen.findByText("No documents indexed");

    const file = new File(["Research notes"], "atlas-notes.pdf", {
      type: "application/pdf",
    });
    await user.upload(screen.getByLabelText("Choose document"), file);

    expect(screen.getByText("atlas-notes.pdf")).toBeInTheDocument();
    expect(screen.getByText("PDF - 14 B")).toBeInTheDocument();
    expect(screen.getByText("staged")).toBeInTheDocument();
    expect(getFetchCalls(fetchMock, "/api/documents", "POST")).toHaveLength(0);
  });

  it("stages a selected TXT file without uploading immediately", async () => {
    const user = userEvent.setup();
    const fetchMock = mockFetch({
      documents: [],
    });

    render(<Home />);
    await screen.findByText("No documents indexed");

    const file = new File(["Research notes"], "atlas-notes.txt", {
      type: "text/plain",
    });
    await user.upload(screen.getByLabelText("Choose document"), file);

    expect(screen.getByText("atlas-notes.txt")).toBeInTheDocument();
    expect(screen.getByText("TXT - 14 B")).toBeInTheDocument();
    expect(screen.getByText("staged")).toBeInTheDocument();
    expect(getFetchCalls(fetchMock, "/api/documents", "POST")).toHaveLength(0);
  });

  it("selecting a valid file and clicking upload calls POST /api/documents", async () => {
    const user = userEvent.setup();
    const uploadedDocument = createDocument({
      id: 12,
      fileName: "atlas-notes.txt",
      fileType: "TXT",
      fileSizeBytes: 14,
    });
    const fetchMock = mockFetch({
      documents: [],
      documentsAfterUpload: [uploadedDocument],
      uploadResponse: {
        document: {
          id: 12,
          fileName: "atlas-notes.txt",
          fileType: "TXT",
          mimeType: "text/plain",
          fileSizeBytes: 14,
          status: "ready",
        },
        ingestion: {
          chunkCount: 2,
        },
      },
    });

    render(<Home />);
    await screen.findByText("No documents indexed");

    await user.upload(
      screen.getByLabelText("Choose document"),
      new File(["Research notes"], "atlas-notes.txt", {
        type: "text/plain",
      }),
    );
    await user.click(screen.getByRole("button", { name: "Upload document" }));

    await waitFor(() => {
      expect(getFetchCalls(fetchMock, "/api/documents", "POST")).toHaveLength(1);
    });
    const uploadBody = getFetchCalls(fetchMock, "/api/documents", "POST")[0]?.[1]
      ?.body;
    expect(uploadBody).toBeInstanceOf(FormData);
    expect((uploadBody as FormData).get("file")).toBeInstanceOf(File);
  });

  it("successful upload refreshes the document list and status", async () => {
    const user = userEvent.setup();
    const uploadedDocument = createDocument({
      id: 12,
      fileName: "atlas-notes.txt",
      fileType: "TXT",
      fileSizeBytes: 14,
    });
    mockFetch({
      documents: [],
      documentsAfterUpload: [uploadedDocument],
      uploadResponse: {
        document: {
          id: 12,
          fileName: "atlas-notes.txt",
          fileType: "TXT",
          mimeType: "text/plain",
          fileSizeBytes: 14,
          status: "ready",
        },
        ingestion: {
          chunkCount: 2,
        },
      },
    });

    render(<Home />);
    await screen.findByText("No documents indexed");

    await user.upload(
      screen.getByLabelText("Choose document"),
      new File(["Research notes"], "atlas-notes.txt", {
        type: "text/plain",
      }),
    );
    await user.click(screen.getByRole("button", { name: "Upload document" }));

    expect(await screen.findByText("Upload complete. 2 chunks indexed.")).toBeInTheDocument();
    expect(await screen.findByText("atlas-notes.txt")).toBeInTheDocument();
    expect(screen.getByText("ready")).toBeInTheDocument();
  });

  it("failed upload shows a clear error", async () => {
    const user = userEvent.setup();
    mockFetch({
      documents: [],
      uploadStatus: 500,
      uploadResponse: {
        error: "Failed to upload document",
      },
    });

    render(<Home />);
    await screen.findByText("No documents indexed");

    await user.upload(
      screen.getByLabelText("Choose document"),
      new File(["Research notes"], "atlas-notes.txt", {
        type: "text/plain",
      }),
    );
    await user.click(screen.getByRole("button", { name: "Upload document" }));

    expect(
      await screen.findByText(
        "Unable to upload document: Failed to upload document",
      ),
    ).toBeInTheDocument();
  });

  it("shows a validation message for unsupported file types", async () => {
    const fetchMock = mockFetch({
      documents: [],
    });

    render(<Home />);
    await screen.findByText("No documents indexed");

    const file = new File(["spreadsheet"], "budget.csv", {
      type: "text/csv",
    });
    fireEvent.change(screen.getByLabelText("Choose document"), {
      target: {
        files: [file],
      },
    });

    expect(
      screen.getByText("Only PDF and TXT files are supported."),
    ).toBeInTheDocument();
    expect(screen.queryByText("budget.csv")).not.toBeInTheDocument();
    expect(getFetchCalls(fetchMock, "/api/documents", "POST")).toHaveLength(0);
  });

  it("rejects files when the extension and MIME type do not match", async () => {
    const fetchMock = mockFetch({
      documents: [],
    });

    render(<Home />);
    await screen.findByText("No documents indexed");

    const file = new File(["Not really a PDF"], "notes.pdf", {
      type: "text/plain",
    });
    fireEvent.change(screen.getByLabelText("Choose document"), {
      target: {
        files: [file],
      },
    });

    expect(
      screen.getByText("Only PDF and TXT files are supported."),
    ).toBeInTheDocument();
    expect(screen.queryByText("notes.pdf")).not.toBeInTheDocument();
    expect(getFetchCalls(fetchMock, "/api/documents", "POST")).toHaveLength(0);
  });

  it("clears the previously staged file after an invalid file selection", async () => {
    const user = userEvent.setup();
    const fetchMock = mockFetch({
      documents: [],
    });

    render(<Home />);
    await screen.findByText("No documents indexed");

    await user.upload(
      screen.getByLabelText("Choose document"),
      new File(["Research notes"], "atlas-notes.txt", {
        type: "text/plain",
      }),
    );
    expect(screen.getByText("atlas-notes.txt")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Upload document" }),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Choose document"), {
      target: {
        files: [new File(["name,total"], "budget.csv", { type: "text/csv" })],
      },
    });

    expect(
      screen.getByText("Only PDF and TXT files are supported."),
    ).toBeInTheDocument();
    expect(screen.queryByText("atlas-notes.txt")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Upload document" }),
    ).not.toBeInTheDocument();
    expect(getFetchCalls(fetchMock, "/api/documents", "POST")).toHaveLength(0);
  });

  it("submits a chat question and renders the answer with source citations", async () => {
    const user = userEvent.setup();
    let resolveChatFetch: (response: Response) => void = () => {};
    const chatPromise = new Promise<Response>((resolve) => {
      resolveChatFetch = resolve;
    });
    const fetchMock = mockFetch({
      documents: [],
      chatResponse: () => chatPromise,
    });

    render(<Home />);
    await screen.findByText("No documents indexed");

    await user.type(
      screen.getByLabelText("Question"),
      "How does Atlas answer questions?",
    );
    await user.click(screen.getByRole("button", { name: "Send question" }));

    expect(getFetchCalls(fetchMock, "/api/documents", "POST")).toHaveLength(0);
    expect(fetchMock).toHaveBeenCalledWith("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: "How does Atlas answer questions?",
      }),
    });
    expect(screen.getByText("Generating answer...")).toBeInTheDocument();

    resolveChatFetch(
      Response.json({
        answer: "Atlas answers from uploaded document chunks. [1]",
        citations: [
          {
            label: "1",
            chunkId: 7,
            documentId: 3,
            fileName: "atlas.pdf",
            pageNumber: 2,
            startOffset: 10,
            endOffset: 54,
            similarity: 0.91,
            snippet: "Atlas answers from uploaded document chunks.",
          },
        ],
        sessionId: 55,
        messageIds: { user: 201, assistant: 202 },
      }),
    );

    expect(
      await screen.findByText("Atlas answers from uploaded document chunks. [1]"),
    ).toBeInTheDocument();
    expect(screen.getByText("atlas.pdf")).toBeInTheDocument();
    expect(screen.getByText("Page 2")).toBeInTheDocument();
    expect(
      screen.getByText("Atlas answers from uploaded document chunks."),
    ).toBeInTheDocument();
  });

  it("shows a clear error message when chat fails", async () => {
    const user = userEvent.setup();
    mockFetch({
      documents: [],
      chatResponse: () =>
        Promise.resolve(
          Response.json(
            {
              error: "Failed to run document chat",
            },
            {
              status: 500,
            },
          ),
        ),
    });

    render(<Home />);
    await screen.findByText("No documents indexed");

    await user.type(screen.getByLabelText("Question"), "What failed?");
    await user.click(screen.getByRole("button", { name: "Send question" }));

    expect(
      await screen.findByText(
        "Unable to answer right now: Failed to run document chat",
      ),
    ).toBeInTheDocument();
  });
});

type FetchMockOptions = {
  documents: DocumentResponse[];
  documentsAfterUpload?: DocumentResponse[];
  uploadStatus?: number;
  uploadResponse?: unknown;
  chatResponse?: () => Promise<Response>;
};

function mockFetch({
  documents,
  documentsAfterUpload,
  uploadStatus = 201,
  uploadResponse,
  chatResponse,
}: FetchMockOptions) {
  let uploadSucceeded = false;

  return vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => {
    const url = getRequestUrl(input);
    const method = init?.method ?? "GET";

    if (url === "/api/documents" && method === "POST") {
      uploadSucceeded = uploadStatus >= 200 && uploadStatus < 300;

      return Promise.resolve(
        Response.json(
          uploadResponse ?? {
            document: null,
            ingestion: { chunkCount: 0 },
          },
          { status: uploadStatus },
        ),
      );
    }

    if (url === "/api/documents") {
      return Promise.resolve(
        Response.json({
          documents: uploadSucceeded
            ? (documentsAfterUpload ?? documents)
            : documents,
        }),
      );
    }

    if (url === "/api/chat" && method === "POST" && chatResponse) {
      return chatResponse();
    }

    throw new Error(`Unexpected fetch call: ${method} ${url}`);
  });
}

function getFetchCalls(
  fetchMock: ReturnType<typeof mockFetch>,
  url: string,
  method: string,
) {
  return fetchMock.mock.calls.filter(([input, init]) => {
    return getRequestUrl(input) === url && init?.method === method;
  });
}

function getRequestUrl(input: RequestInfo | URL) {
  return typeof input === "string" ? input : input.toString();
}

function createDocument(
  overrides: Partial<DocumentResponse> = {},
): DocumentResponse {
  return {
    id: 1,
    fileName: "indexed-notes.txt",
    fileType: "TXT",
    mimeType: "text/plain",
    fileSizeBytes: 1024,
    textLength: 500,
    status: "ready",
    createdAt: "2026-06-04T00:00:00.000Z",
    ...overrides,
  };
}
