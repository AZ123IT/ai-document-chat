import { Buffer } from "node:buffer";

import { createPlaceholderEmbeddingProvider } from "@/lib/ingestion/embedding-provider";
import { IngestionFileValidationError } from "@/lib/ingestion/file-validation";
import { ingestDocument } from "@/lib/ingestion/ingest-document";
import type { Tables } from "@/lib/supabase/database.types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type DocumentRow = Pick<
  Tables<"documents">,
  | "id"
  | "file_name"
  | "file_type"
  | "mime_type"
  | "file_size_bytes"
  | "text_length"
  | "created_at"
>;

type UploadedDocumentFileType = "PDF" | "TXT";

class DocumentUploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DocumentUploadValidationError";
  }
}

export async function GET() {
  try {
    const { data, error } = await createServerSupabaseClient()
      .from("documents")
      .select(
        "id, file_name, file_type, mime_type, file_size_bytes, text_length, created_at",
      )
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to load documents: ${error.message}`);
    }

    return Response.json({
      documents: (data ?? []).map(toDocumentResponse),
    });
  } catch (error) {
    console.error("GET /api/documents failed", error);

    return Response.json(
      {
        error: "Failed to load documents",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { file, fileName } = await parseDocumentUploadFile(request);
    const fileType = getSupportedUploadFileType(fileName, file.type);

    if (!fileType) {
      throw new DocumentUploadValidationError(
        "Only PDF and TXT documents are supported",
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await ingestDocument({
      file: {
        fileName,
        mimeType: file.type || undefined,
        buffer,
      },
      supabase: createServerSupabaseClient(),
      embeddingProvider: createPlaceholderEmbeddingProvider(),
    });

    return Response.json(
      {
        document: {
          id: result.documentId,
          fileName,
          fileType,
          mimeType: file.type || null,
          fileSizeBytes: buffer.byteLength,
          status: "ready",
        },
        ingestion: {
          chunkCount: result.chunkCount,
          chunkIds: result.chunkIds,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (
      error instanceof DocumentUploadValidationError ||
      error instanceof IngestionFileValidationError
    ) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    console.error("POST /api/documents failed", error);

    return Response.json(
      {
        error: "Failed to upload document",
      },
      { status: 500 },
    );
  }
}

async function parseDocumentUploadFile(request: Request) {
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch {
    throw new DocumentUploadValidationError("Invalid document upload request");
  }

  const file = formData.get("file");

  if (!isFile(file)) {
    throw new DocumentUploadValidationError("Document file is required");
  }

  return {
    file,
    fileName: getUploadFileName(formData, file),
  };
}

function isFile(value: FormDataEntryValue | null): value is File {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as File).name === "string" &&
    typeof (value as File).arrayBuffer === "function"
  );
}

function toDocumentResponse(row: DocumentRow) {
  return {
    id: row.id,
    fileName: row.file_name,
    fileType: toApiFileType(row.file_type),
    mimeType: row.mime_type,
    fileSizeBytes: row.file_size_bytes,
    textLength: row.text_length,
    status: "ready" as const,
    createdAt: row.created_at,
  };
}

function toApiFileType(fileType: DocumentRow["file_type"]) {
  return fileType.toUpperCase() as UploadedDocumentFileType;
}

function getUploadFileName(formData: FormData, file: File) {
  const explicitFileName = formData.get("fileName");

  if (typeof explicitFileName === "string" && explicitFileName.trim()) {
    return explicitFileName.trim();
  }

  return file.name;
}

function getSupportedUploadFileType(
  fileName: string,
  mimeType: string,
): UploadedDocumentFileType | null {
  const extensionFileType = getSupportedExtensionUploadFileType(fileName);
  const mimeFileType = getSupportedMimeUploadFileType(mimeType);

  if (mimeType && !mimeFileType) {
    return null;
  }

  if (extensionFileType && mimeFileType && extensionFileType !== mimeFileType) {
    return null;
  }

  return extensionFileType ?? mimeFileType;
}

function getSupportedExtensionUploadFileType(
  fileName: string,
): UploadedDocumentFileType | null {
  const normalizedFileName = fileName.toLowerCase();

  if (normalizedFileName.endsWith(".pdf")) {
    return "PDF";
  }

  if (normalizedFileName.endsWith(".txt")) {
    return "TXT";
  }

  return null;
}

function getSupportedMimeUploadFileType(
  mimeType: string,
): UploadedDocumentFileType | null {
  const normalizedMimeType = mimeType.trim().toLowerCase();

  if (normalizedMimeType === "application/pdf") {
    return "PDF";
  }

  if (normalizedMimeType === "text/plain") {
    return "TXT";
  }

  return null;
}
