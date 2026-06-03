import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();
const migrationPath = path.join(
  projectRoot,
  "supabase/migrations/20260603000100_create_rag_schema.sql",
);
const typesPath = path.join(
  projectRoot,
  "src/lib/supabase/database.types.ts",
);

const readRequiredFile = (filePath: string) => {
  expect(existsSync(filePath), `${filePath} should exist`).toBe(true);
  return readFileSync(filePath, "utf8");
};

describe("Supabase RAG schema migration", () => {
  it("defines the vector extension and core RAG tables", () => {
    const migration = readRequiredFile(migrationPath);

    expect(migration).toContain("create extension if not exists vector");
    expect(migration).toContain("create table if not exists public.documents");
    expect(migration).toContain(
      "create table if not exists public.document_chunks",
    );
    expect(migration).toContain(
      "create table if not exists public.chat_sessions",
    );
    expect(migration).toContain(
      "create table if not exists public.chat_messages",
    );
  });

  it("stores chunk embeddings and exposes a vector similarity RPC", () => {
    const migration = readRequiredFile(migrationPath);

    expect(migration).toContain("embedding extensions.vector(1536)");
    expect(migration).toContain(
      "create or replace function public.match_document_chunks",
    );
    expect(migration).toContain("query_embedding extensions.vector(1536)");
    expect(migration).toContain("dc.embedding <=> query_embedding");
    expect(migration).toContain("returns table");
  });

  it("adds integrity constraints, indexes, and server-side access defaults", () => {
    const migration = readRequiredFile(migrationPath);

    expect(migration).toContain("foreign key (document_id)");
    expect(migration).toContain("foreign key (session_id)");
    expect(migration).toContain("unique (document_id, chunk_index)");
    expect(migration).toContain("using hnsw");
    expect(migration).toContain(
      "alter table public.documents enable row level security",
    );
    expect(migration).toContain(
      "alter table public.document_chunks enable row level security",
    );
    expect(migration).toContain(
      "alter table public.chat_sessions enable row level security",
    );
    expect(migration).toContain(
      "alter table public.chat_messages enable row level security",
    );
  });
});

describe("Supabase database types", () => {
  it("documents the tables and vector RPC used by later milestones", () => {
    const types = readRequiredFile(typesPath);

    expect(types).toContain("export type Json");
    expect(types).toContain("documents:");
    expect(types).toContain("document_chunks:");
    expect(types).toContain("chat_sessions:");
    expect(types).toContain("chat_messages:");
    expect(types).toContain("match_document_chunks:");
  });
});
