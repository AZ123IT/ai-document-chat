import type { SupportedDocumentType } from "@/lib/documents/types";

export const MAX_INGESTION_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export type IngestionFileInput = {
  fileName: string;
  mimeType?: string;
  buffer: Buffer;
};

export type ValidatedIngestionFile = {
  fileName: string;
  mimeType?: string;
  fileType: SupportedDocumentType;
  fileSizeBytes: number;
};

export class IngestionFileValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "IngestionFileValidationError";
  }
}

export function validateIngestionFile(
  file: IngestionFileInput,
): ValidatedIngestionFile {
  const fileName = file.fileName.trim();

  if (fileName.length === 0) {
    throw new IngestionFileValidationError("Document file name is required");
  }

  if (file.buffer.byteLength === 0) {
    throw new IngestionFileValidationError("Document file is empty");
  }

  if (file.buffer.byteLength > MAX_INGESTION_FILE_SIZE_BYTES) {
    throw new IngestionFileValidationError("Document file is too large");
  }

  const fileType = getSupportedFileType(fileName, file.mimeType);

  if (!fileType) {
    throw new IngestionFileValidationError(
      "Only PDF and TXT documents are supported",
    );
  }

  return {
    fileName,
    mimeType: file.mimeType,
    fileType,
    fileSizeBytes: file.buffer.byteLength,
  };
}

function getSupportedFileType(
  fileName: string,
  mimeType?: string,
): SupportedDocumentType | null {
  if (mimeType === "application/pdf") {
    return "pdf";
  }

  if (mimeType === "text/plain") {
    return "txt";
  }

  const lowerFileName = fileName.toLowerCase();

  if (lowerFileName.endsWith(".pdf")) {
    return "pdf";
  }

  if (lowerFileName.endsWith(".txt")) {
    return "txt";
  }

  return null;
}
