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
      buffer: Buffer.from("%PDF-1.4 sample"),
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

  it("rejects MIME and extension mismatches", () => {
    expect(() =>
      validateIngestionFile({
        fileName: "notes.txt",
        mimeType: "application/pdf",
        buffer: Buffer.from("%PDF-1.4 sample"),
      }),
    ).toThrow("Document file type does not match MIME type");
  });

  it("rejects PDFs without a PDF header", () => {
    expect(() =>
      validateIngestionFile({
        fileName: "paper.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("not actually a pdf"),
      }),
    ).toThrow("PDF document is missing a valid PDF header");
  });

  it("rejects TXT files that contain NUL bytes", () => {
    expect(() =>
      validateIngestionFile({
        fileName: "notes.txt",
        mimeType: "text/plain",
        buffer: Buffer.from([0x48, 0x00, 0x69]),
      }),
    ).toThrow("TXT document appears to contain binary data");
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
