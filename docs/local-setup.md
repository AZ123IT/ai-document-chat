# Local Setup

This project can run in a no-cost mock mode for development, then use Supabase
and DeepSeek for a realistic local RAG demo.

## Requirements

- Node.js 20 or newer
- npm
- A Supabase project with pgvector available
- A DeepSeek API key for real chat responses

Do not commit `.env.local`. The file is intentionally ignored by git.

## Install

```bash
npm install
```

## Environment

Create a private local environment file:

```bash
cp .env.example .env.local
```

Fill in `.env.local` locally. Keep these values private.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
LLM_PROVIDER=deepseek
DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_CHAT_MODEL=deepseek-chat
```

For no-cost local UI development, keep:

```bash
LLM_PROVIDER=mock
```

## Database

Run the SQL migration in the Supabase SQL Editor:

```text
supabase/migrations/20260603000100_create_rag_schema.sql
```

After it runs, the Supabase Table Editor should show:

- `documents`
- `document_chunks`
- `chat_sessions`
- `chat_messages`

## Run The App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Automated Verification

```bash
npm run verify
```

The automated tests use mocked providers and must not call real Supabase or
DeepSeek services.
