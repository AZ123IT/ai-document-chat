export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type DocumentFileType = "pdf" | "txt";
export type ChatMessageRole = "system" | "user" | "assistant";
export type Embedding = number[];

export type Database = {
  public: {
    Tables: {
      documents: {
        Row: {
          id: number;
          file_name: string;
          file_type: DocumentFileType;
          mime_type: string | null;
          file_size_bytes: number;
          text_length: number;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          file_name: string;
          file_type: DocumentFileType;
          mime_type?: string | null;
          file_size_bytes: number;
          text_length?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          file_name?: string;
          file_type?: DocumentFileType;
          mime_type?: string | null;
          file_size_bytes?: number;
          text_length?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      document_chunks: {
        Row: {
          id: number;
          document_id: number;
          chunk_index: number;
          content: string;
          start_offset: number;
          end_offset: number;
          page_number: number | null;
          embedding: Embedding | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: number;
          document_id: number;
          chunk_index: number;
          content: string;
          start_offset: number;
          end_offset: number;
          page_number?: number | null;
          embedding?: Embedding | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: number;
          document_id?: number;
          chunk_index?: number;
          content?: string;
          start_offset?: number;
          end_offset?: number;
          page_number?: number | null;
          embedding?: Embedding | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "document_chunks_document_id_fkey";
            columns: ["document_id"];
            referencedRelation: "documents";
            referencedColumns: ["id"];
          },
        ];
      };
      chat_sessions: {
        Row: {
          id: number;
          title: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          title?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          title?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      chat_messages: {
        Row: {
          id: number;
          session_id: number;
          role: ChatMessageRole;
          content: string;
          citations: Json;
          created_at: string;
        };
        Insert: {
          id?: number;
          session_id: number;
          role: ChatMessageRole;
          content: string;
          citations?: Json;
          created_at?: string;
        };
        Update: {
          id?: number;
          session_id?: number;
          role?: ChatMessageRole;
          content?: string;
          citations?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chat_messages_session_id_fkey";
            columns: ["session_id"];
            referencedRelation: "chat_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      match_document_chunks: {
        Args: {
          query_embedding: Embedding;
          match_count?: number;
          match_threshold?: number;
          filter_document_ids?: number[] | null;
        };
        Returns: {
          chunk_id: number;
          document_id: number;
          chunk_index: number;
          content: string;
          page_number: number | null;
          start_offset: number;
          end_offset: number;
          file_name: string;
          file_type: DocumentFileType;
          similarity: number;
          metadata: Json;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type Inserts<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type Updates<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
