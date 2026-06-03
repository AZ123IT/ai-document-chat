import type { QueryEmbeddingProvider } from "@/lib/ingestion/embedding-provider";
import type {
  Database,
  DocumentFileType,
  Json,
} from "@/lib/supabase/database.types";

type MatchDocumentChunksArgs =
  Database["public"]["Functions"]["match_document_chunks"]["Args"];
type MatchDocumentChunksRow =
  Database["public"]["Functions"]["match_document_chunks"]["Returns"][number];

type SupabaseErrorLike = {
  message: string;
};

export type SupabaseRetrievalClient = {
  rpc(
    functionName: "match_document_chunks",
    args: MatchDocumentChunksArgs,
  ): PromiseLike<{
    data: MatchDocumentChunksRow[] | null;
    error: SupabaseErrorLike | null;
  }>;
};

export type RetrievedChunk = {
  id: number;
  documentId: number;
  chunkIndex: number;
  content: string;
  pageNumber: number | null;
  startOffset: number;
  endOffset: number;
  fileName: string;
  fileType: DocumentFileType;
  similarity: number;
  metadata: Json;
};

export type RetrieveRelevantChunksOptions = {
  question: string;
  embeddingProvider: QueryEmbeddingProvider;
  supabase: SupabaseRetrievalClient;
  matchCount?: number;
  matchThreshold?: number;
  documentIds?: number[];
};

const DEFAULT_MATCH_COUNT = 5;
const DEFAULT_MATCH_THRESHOLD = 0.75;

export async function retrieveRelevantChunks({
  question,
  embeddingProvider,
  supabase,
  matchCount = DEFAULT_MATCH_COUNT,
  matchThreshold = DEFAULT_MATCH_THRESHOLD,
  documentIds,
}: RetrieveRelevantChunksOptions): Promise<RetrievedChunk[]> {
  const queryEmbedding = await embeddingProvider.embedQuery(question);
  const { data, error } = await supabase.rpc("match_document_chunks", {
    query_embedding: queryEmbedding,
    match_count: matchCount,
    match_threshold: matchThreshold,
    filter_document_ids: documentIds ?? null,
  });

  if (error) {
    throw new Error(`Failed to retrieve document chunks: ${error.message}`);
  }

  return (data ?? []).map(mapRetrievedChunk);
}

function mapRetrievedChunk(row: MatchDocumentChunksRow): RetrievedChunk {
  return {
    id: row.chunk_id,
    documentId: row.document_id,
    chunkIndex: row.chunk_index,
    content: row.content,
    pageNumber: row.page_number,
    startOffset: row.start_offset,
    endOffset: row.end_offset,
    fileName: row.file_name,
    fileType: row.file_type,
    similarity: row.similarity,
    metadata: row.metadata,
  };
}
