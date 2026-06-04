# Demo Checklist

Use this checklist for a realistic local portfolio demo.

## Before The Demo

- [ ] Run `npm install`
- [ ] Create `.env.local` from `.env.example`
- [ ] Add Supabase values to `.env.local`
- [ ] Add DeepSeek values to `.env.local` if using `LLM_PROVIDER=deepseek`
- [ ] Run the Supabase migration through the Supabase SQL Editor
- [ ] Confirm Supabase has `documents`, `document_chunks`, `chat_sessions`, and `chat_messages`
- [ ] Run `npm run verify`

## Start

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Upload Flow

- [ ] Upload `docs/sample-documents/demo-notes.txt`
- [ ] Confirm the upload succeeds
- [ ] Confirm the document appears in the library list
- [ ] Confirm the status updates after upload

## Chat Flow

Ask:

```text
What does Project Atlas say about authentication and retrieval?
```

Expected result:

- [ ] The assistant returns a document-grounded answer
- [ ] The answer mentions authentication and retrieval
- [ ] Source citations render in the answer area
- [ ] Citation previews render in the evidence panel
- [ ] A chat session and messages are saved in Supabase

## Safe Demo Notes

- Do not display `.env.local`
- Do not show API keys on screen
- Use `LLM_PROVIDER=mock` when demoing without paid or external model calls
- Use `LLM_PROVIDER=deepseek` only when local credentials are configured
