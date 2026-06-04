const createServerSupabaseClientMock = vi.hoisted(() => vi.fn());
const createPlaceholderEmbeddingProviderMock = vi.hoisted(() => vi.fn());
const ingestDocumentMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: createServerSupabaseClientMock,
}));

vi.mock("@/lib/ingestion/embedding-provider", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/ingestion/embedding-provider")
  >("@/lib/ingestion/embedding-provider");

  return {
    ...actual,
    createPlaceholderEmbeddingProvider: createPlaceholderEmbeddingProviderMock,
  };
});

vi.mock("@/lib/ingestion/ingest-document", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/ingestion/ingest-document")
  >("@/lib/ingestion/ingest-document");

  return {
    ...actual,
    ingestDocument: ingestDocumentMock,
  };
});

describe("GET /api/documents", () => {
  beforeEach(() => {
    vi.resetModules();
    createServerSupabaseClientMock.mockReset();
    createPlaceholderEmbeddingProviderMock.mockReset();
    ingestDocumentMock.mockReset();
  });

  it("returns safe document DTOs ordered newest first", async () => {
    const rows = [
      {
        id: 2,
        file_name: "newer-notes.txt",
        file_type: "txt",
        mime_type: "text/plain",
        file_size_bytes: 2048,
        text_length: 600,
        metadata: { internal: "not returned" },
        created_at: "2026-06-04T01:00:00.000Z",
        updated_at: "2026-06-04T01:05:00.000Z",
      },
      {
        id: 1,
        file_name: "older-paper.pdf",
        file_type: "pdf",
        mime_type: "application/pdf",
        file_size_bytes: 4096,
        text_length: 1200,
        metadata: { page_count: 3 },
        created_at: "2026-06-03T23:00:00.000Z",
        updated_at: "2026-06-03T23:05:00.000Z",
      },
    ];
    const order = vi.fn().mockResolvedValue({ data: rows, error: null });
    const select = vi.fn().mockReturnValue({ order });
    const from = vi.fn().mockReturnValue({ select });
    createServerSupabaseClientMock.mockReturnValue({ from });

    const { GET } = await import("./route");
    const response = await GET();

    expect(response.status).toBe(200);
    expect(from).toHaveBeenCalledWith("documents");
    expect(select).toHaveBeenCalledWith(
      "id, file_name, file_type, mime_type, file_size_bytes, text_length, created_at",
    );
    expect(order).toHaveBeenCalledWith("created_at", { ascending: false });
    await expect(response.json()).resolves.toEqual({
      documents: [
        {
          id: 2,
          fileName: "newer-notes.txt",
          fileType: "TXT",
          mimeType: "text/plain",
          fileSizeBytes: 2048,
          textLength: 600,
          status: "ready",
          createdAt: "2026-06-04T01:00:00.000Z",
        },
        {
          id: 1,
          fileName: "older-paper.pdf",
          fileType: "PDF",
          mimeType: "application/pdf",
          fileSizeBytes: 4096,
          textLength: 1200,
          status: "ready",
          createdAt: "2026-06-03T23:00:00.000Z",
        },
      ],
    });
  });

  it("handles Supabase errors with a generic 500 response", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const order = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "permission denied for table documents" },
    });
    const select = vi.fn().mockReturnValue({ order });
    const from = vi.fn().mockReturnValue({ select });
    createServerSupabaseClientMock.mockReturnValue({ from });

    const { GET } = await import("./route");
    const response = await GET();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to load documents",
    });
  });
});

describe("POST /api/documents", () => {
  beforeEach(() => {
    vi.resetModules();
    createServerSupabaseClientMock.mockReset();
    createPlaceholderEmbeddingProviderMock.mockReset();
    ingestDocumentMock.mockReset();
  });

  it.each([
    {
      file: new File(["Project notes"], "project-notes.txt", {
        type: "text/plain",
      }),
      fileType: "TXT",
    },
    {
      file: new File(["%PDF-1.7\n"], "paper.pdf", {
        type: "application/pdf",
      }),
      fileType: "PDF",
    },
  ])(
    "accepts FormData with a valid $fileType file and calls ingestion",
    async ({ file, fileType }) => {
      const supabase = { from: vi.fn() };
      const embeddingProvider = { embedDocuments: vi.fn(), embedQuery: vi.fn() };
      createServerSupabaseClientMock.mockReturnValue(supabase);
      createPlaceholderEmbeddingProviderMock.mockReturnValue(embeddingProvider);
      ingestDocumentMock.mockResolvedValue({
        documentId: 42,
        chunkCount: 2,
        chunkIds: [7, 8],
      });
      const formData = new FormData();
      formData.set("file", file);
      formData.set("fileName", file.name);

      const { POST } = await import("./route");
      const response = await POST(
        new Request("http://localhost/api/documents", {
          method: "POST",
          body: formData,
        }),
      );

      expect(response.status).toBe(201);
      const ingestionCall = ingestDocumentMock.mock.calls[0]?.[0];
      expect(ingestionCall).toMatchObject({
        file: {
          fileName: file.name,
          mimeType: file.type,
        },
        supabase,
        embeddingProvider,
      });
      expect(Buffer.isBuffer(ingestionCall.file.buffer)).toBe(true);
      expect(ingestionCall.file.buffer.byteLength).toBeGreaterThan(0);
      await expect(response.json()).resolves.toEqual({
        document: {
          id: 42,
          fileName: file.name,
          fileType,
          mimeType: file.type,
          fileSizeBytes: ingestionCall.file.buffer.byteLength,
          status: "ready",
        },
        ingestion: {
          chunkCount: 2,
          chunkIds: [7, 8],
        },
      });
    },
  );

  it("rejects missing file with 400", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/documents", {
        method: "POST",
        body: new FormData(),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Document file is required",
    });
    expect(createServerSupabaseClientMock).not.toHaveBeenCalled();
    expect(ingestDocumentMock).not.toHaveBeenCalled();
  });

  it("rejects unsupported file type with 400", async () => {
    const formData = new FormData();
    formData.set(
      "file",
      new File(["name,total"], "budget.csv", { type: "text/csv" }),
    );
    formData.set("fileName", "budget.csv");

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/documents", {
        method: "POST",
        body: formData,
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Only PDF and TXT documents are supported",
    });
    expect(createServerSupabaseClientMock).not.toHaveBeenCalled();
    expect(ingestDocumentMock).not.toHaveBeenCalled();
  });

  it("handles ingestion validation errors safely", async () => {
    const { IngestionFileValidationError } = await import(
      "@/lib/ingestion/file-validation"
    );
    const formData = new FormData();
    formData.set(
      "file",
      new File(["not actually a pdf"], "paper.pdf", {
        type: "application/pdf",
      }),
    );
    formData.set("fileName", "paper.pdf");
    createServerSupabaseClientMock.mockReturnValue({ from: vi.fn() });
    createPlaceholderEmbeddingProviderMock.mockReturnValue({
      embedDocuments: vi.fn(),
      embedQuery: vi.fn(),
    });
    ingestDocumentMock.mockRejectedValue(
      new IngestionFileValidationError("PDF document is missing a valid PDF header"),
    );

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/documents", {
        method: "POST",
        body: formData,
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "PDF document is missing a valid PDF header",
    });
  });

  it("handles unexpected internal errors with a generic 500 response", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const formData = new FormData();
    formData.set(
      "file",
      new File(["Project notes"], "project-notes.txt", {
        type: "text/plain",
      }),
    );
    formData.set("fileName", "project-notes.txt");
    createServerSupabaseClientMock.mockReturnValue({ from: vi.fn() });
    createPlaceholderEmbeddingProviderMock.mockReturnValue({
      embedDocuments: vi.fn(),
      embedQuery: vi.fn(),
    });
    ingestDocumentMock.mockRejectedValue(new Error("service role key leaked"));

    const { POST } = await import("./route");
    const response = await POST(
      new Request("http://localhost/api/documents", {
        method: "POST",
        body: formData,
      }),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Failed to upload document",
    });
  });
});

export {};
