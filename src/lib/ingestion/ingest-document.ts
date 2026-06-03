import { chunkExtractedDocument } from "@/lib/documents/chunk-text";
import { extractDocumentText } from "@/lib/documents/extract-text";
import type { ChunkTextOptions } from "@/lib/documents/types";
import type { Database } from "@/lib/supabase/database.types";

import {
  createPlaceholderEmbeddingProvider,
  type EmbeddingProvider,
} from "./embedding-provider";
import {
  type IngestionFileInput,
  validateIngestionFile,
} from "./file-validation";

type SupabaseErrorLike = {
  message: string;
};

type DocumentsInsert = Database["public"]["Tables"]["documents"]["Insert"];
type DocumentChunksInsert =
  Database["public"]["Tables"]["document_chunks"]["Insert"];

type DocumentInsertResult = {
  id: number;
};

type ChunkInsertResult = {
  id: number;
  chunk_index: number;
};

export type SupabaseDocumentIngestionClient = {
  from(table: "documents"): {
    insert(payload: DocumentsInsert): {
      select(columns: string): {
        single(): Promise<{
          data: DocumentInsertResult | null;
          error: SupabaseErrorLike | null;
        }>;
      };
    };
  };
  from(table: "document_chunks"): {
    insert(payload: DocumentChunksInsert[]): {
      select(columns: string): Promise<{
        data: ChunkInsertResult[] | null;
        error: SupabaseErrorLike | null;
      }>;
    };
  };
};

export type IngestDocumentOptions = {
  file: IngestionFileInput;
  supabase: SupabaseDocumentIngestionClient;
  embeddingProvider?: EmbeddingProvider;
  chunkOptions?: Pick<ChunkTextOptions, "chunkSize" | "chunkOverlap">;
};

export type IngestDocumentResult = {
  documentId: number;
  chunkCount: number;
  chunkIds: number[];
};

const DEFAULT_CHUNK_OPTIONS = {
  chunkSize: 1000,
  chunkOverlap: 200,
} satisfies Pick<ChunkTextOptions, "chunkSize" | "chunkOverlap">;

export async function ingestDocument({
  file,
  supabase,
  embeddingProvider = createPlaceholderEmbeddingProvider(),
  chunkOptions = DEFAULT_CHUNK_OPTIONS,
}: IngestDocumentOptions): Promise<IngestDocumentResult> {
  const validatedFile = validateIngestionFile(file);
  const extractedDocument = await extractDocumentText(file.buffer, {
    fileName: validatedFile.fileName,
    mimeType: validatedFile.mimeType,
  });

  if (extractedDocument.text.trim().length === 0) {
    throw new Error("Document does not contain extractable text");
  }

  const chunks = chunkExtractedDocument(extractedDocument, chunkOptions);

  if (chunks.length === 0) {
    throw new Error("Document does not contain extractable text");
  }

  const embeddings = await embeddingProvider.embedDocuments(
    chunks.map((chunk) => chunk.content),
  );

  if (embeddings.length !== chunks.length) {
    throw new Error("Embedding provider returned the wrong number of embeddings");
  }

  const { data: storedDocument, error: documentError } = await supabase
    .from("documents")
    .insert({
      file_name: validatedFile.fileName,
      file_type: validatedFile.fileType,
      mime_type: validatedFile.mimeType ?? null,
      file_size_bytes: validatedFile.fileSizeBytes,
      text_length: extractedDocument.text.length,
      metadata: {
        page_count: extractedDocument.pages?.length ?? 0,
      },
    })
    .select("id")
    .single();

  if (documentError) {
    throw new Error(`Failed to store document: ${documentError.message}`);
  }

  if (!storedDocument) {
    throw new Error("Failed to store document: no document returned");
  }

  const chunkRows = chunks.map((chunk, index) => ({
    document_id: storedDocument.id,
    chunk_index: chunk.chunk_index,
    content: chunk.content,
    start_offset: chunk.start,
    end_offset: chunk.end,
    page_number: chunk.page_number ?? null,
    embedding: embeddings[index],
    metadata: {},
  }));

  const { data: storedChunks, error: chunksError } = await supabase
    .from("document_chunks")
    .insert(chunkRows)
    .select("id, chunk_index");

  if (chunksError) {
    throw new Error(`Failed to store document chunks: ${chunksError.message}`);
  }

  if (!storedChunks || storedChunks.length !== chunks.length) {
    throw new Error("Failed to store document chunks: unexpected insert result");
  }

  return {
    documentId: storedDocument.id,
    chunkCount: storedChunks.length,
    chunkIds: storedChunks
      .toSorted((left, right) => left.chunk_index - right.chunk_index)
      .map((chunk) => chunk.id),
  };
}
