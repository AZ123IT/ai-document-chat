# Troubleshooting

## The App Starts But Upload Fails

Check that Supabase values are present in `.env.local` and that the migration
was run through the Supabase SQL Editor. The app expects these tables:

- `documents`
- `document_chunks`
- `chat_sessions`
- `chat_messages`

Also confirm the uploaded file is a PDF or TXT file. The backend rejects
unsupported file types, mismatched MIME types, PDFs without a PDF header, and
TXT files containing NUL bytes.

## Chat Returns A Provider Configuration Error

If using mock mode, set:

```bash
LLM_PROVIDER=mock
```

If using DeepSeek, set these values privately in `.env.local`:

```bash
LLM_PROVIDER=deepseek
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_CHAT_MODEL=deepseek-v4-flash
```

Never paste real keys into issues, screenshots, commits, or docs.

## Chat Returns No Useful Answer

Confirm that the document uploaded successfully and that chunks were inserted
into `document_chunks`. The RAG flow needs stored chunks before retrieval can
produce grounded answers and citations.

## PDF Text Is Empty

Some PDFs contain scanned images rather than embedded text. The current
`pdf-parse` based extraction expects selectable text. Use a text-based PDF or
the sample TXT file for the demo.

## Tests Should Not Use Real Services

`npm run verify` runs lint, typecheck, unit/component tests, and build. Tests
mock Supabase, embeddings, chat providers, and fetch calls where external
services would otherwise be used.
