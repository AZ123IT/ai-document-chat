# AI Document Chat

A full-stack LLM portfolio project for uploading documents, asking questions,
and returning document-grounded answers with source citations.

## Current Status

The local portfolio MVP now includes document processing, Supabase schema and
ingestion, semantic retrieval, RAG chat, a dashboard UI, document upload/list
API routes, and an optional DeepSeek chat provider.

## Stack

- Next.js + TypeScript
- Tailwind CSS
- Supabase Postgres + pgvector
- DeepSeek-compatible chat provider interface
- Vitest + Testing Library

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

See [docs/local-setup.md](docs/local-setup.md) and
[docs/demo-checklist.md](docs/demo-checklist.md) for the full local demo flow.

## Verification

```bash
npm run lint
npm test
npm run build
npm run verify
```
