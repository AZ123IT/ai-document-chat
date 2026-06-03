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

  const extensionFileType = getSupportedExtensionFileType(fileName);
  const mimeFileType = getSupportedMimeFileType(file.mimeType);

  if (file.mimeType && !mimeFileType) {
    throw new IngestionFileValidationError(
      "Only PDF and TXT documents are supported",
    );
  }

  if (
    extensionFileType &&
    mimeFileType &&
    extensionFileType !== mimeFileType
  ) {
    throw new IngestionFileValidationError(
      "Document file type does not match MIME type",
    );
  }

  const fileType = extensionFileType ?? mimeFileType;

  if (!fileType) {
    throw new IngestionFileValidationError(
      "Only PDF and TXT documents are supported",
    );
  }

  validateFileContents(file.buffer, fileType);

  return {
    fileName,
    mimeType: file.mimeType,
    fileType,
    fileSizeBytes: file.buffer.byteLength,
  };
}

function getSupportedMimeFileType(
  mimeType?: string,
): SupportedDocumentType | null {
  if (mimeType === "application/pdf") {
    return "pdf";
  }

  if (mimeType === "text/plain") {
    return "txt";
  }

  return null;
}

function getSupportedExtensionFileType(
  fileName: string,
): SupportedDocumentType | null {
  const lowerFileName = fileName.toLowerCase();

  if (lowerFileName.endsWith(".pdf")) {
    return "pdf";
  }

  if (lowerFileName.endsWith(".txt")) {
    return "txt";
  }

  return null;
}

function validateFileContents(buffer: Buffer, fileType: SupportedDocumentType) {
  if (
    fileType === "pdf" &&
    buffer.subarray(0, 5).toString("ascii") !== "%PDF-"
  ) {
    throw new IngestionFileValidationError(
      "PDF document is missing a valid PDF header",
    );
  }

  if (fileType === "txt" && buffer.includes(0)) {
    throw new IngestionFileValidationError(
      "TXT document appears to contain binary data",
    );
  }
}
