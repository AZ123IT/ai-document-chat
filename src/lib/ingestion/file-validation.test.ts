import {
  MAX_INGESTION_FILE_SIZE_BYTES,
  validateIngestionFile,
} from "./file-validation";

describe("validateIngestionFile", () => {
  it("accepts TXT files and normalizes their metadata", () => {
    const result = validateIngestionFile({
      fileName: "notes.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("Project notes"),
    });

    expect(result).toEqual({
      fileName: "notes.txt",
      mimeType: "text/plain",
      fileType: "txt",
      fileSizeBytes: 13,
    });
  });

  it("accepts PDFs by extension when MIME type is missing", () => {
    const result = validateIngestionFile({
      fileName: "paper.PDF",
      buffer: Buffer.from("%PDF sample"),
    });

    expect(result.fileType).toBe("pdf");
    expect(result.mimeType).toBeUndefined();
  });

  it("rejects unsupported files", () => {
    expect(() =>
      validateIngestionFile({
        fileName: "notes.md",
        mimeType: "text/markdown",
        buffer: Buffer.from("# Notes"),
      }),
    ).toThrow("Only PDF and TXT documents are supported");
  });

  it("rejects empty files", () => {
    expect(() =>
      validateIngestionFile({
        fileName: "empty.txt",
        mimeType: "text/plain",
        buffer: Buffer.alloc(0),
      }),
    ).toThrow("Document file is empty");
  });

  it("rejects oversized files", () => {
    expect(() =>
      validateIngestionFile({
        fileName: "large.txt",
        mimeType: "text/plain",
        buffer: Buffer.alloc(MAX_INGESTION_FILE_SIZE_BYTES + 1),
      }),
    ).toThrow("Document file is too large");
  });
});
