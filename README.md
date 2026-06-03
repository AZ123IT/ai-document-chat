# AI Document Chat

A full-stack LLM portfolio project for uploading documents, asking questions,
and returning document-grounded answers with source citations.

## Current Status

Milestone 1 is the project foundation only. Document upload, embeddings,
Supabase storage, semantic search, chat, and RAG are intentionally not
implemented yet.

## Stack

- Next.js + TypeScript
- Tailwind CSS
- Vitest + Testing Library

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Verification

```bash
npm run lint
npm test
npm run build
```
