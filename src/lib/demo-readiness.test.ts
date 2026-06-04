import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";

const requiredDocs = [
  "docs/local-setup.md",
  "docs/demo-checklist.md",
  "docs/troubleshooting.md",
] as const;

const sampleDocumentPath = "docs/sample-documents/demo-notes.txt";

const secretPatterns = [
  /sk-[A-Za-z0-9_-]{20,}/,
  /ghp_[A-Za-z0-9_]{20,}/,
  /github_pat_[A-Za-z0-9_]{20,}/,
  /sbp_[A-Za-z0-9_]{20,}/,
  /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/,
];

describe("local demo readiness", () => {
  it("keeps local runtime secrets ignored without reading them", () => {
    expect(() => {
      execFileSync("git", ["check-ignore", "-q", ".env.local"], {
        stdio: "ignore",
      });
    }).not.toThrow();
  });

  it("documents the local setup, demo flow, and troubleshooting steps", () => {
    for (const docPath of requiredDocs) {
      expect(existsSync(docPath), `${docPath} should exist`).toBe(true);
    }

    const localSetup = readFileSync("docs/local-setup.md", "utf8");
    expect(localSetup).toContain("npm install");
    expect(localSetup).toContain(".env.local");
    expect(localSetup).toContain("LLM_PROVIDER=deepseek");
    expect(localSetup).toContain("Supabase SQL Editor");

    const checklist = readFileSync("docs/demo-checklist.md", "utf8");
    expect(checklist).toContain("npm run dev");
    expect(checklist).toContain("http://localhost:3000");
    expect(checklist).toContain("demo-notes.txt");
    expect(checklist).toContain("citations");

    const troubleshooting = readFileSync("docs/troubleshooting.md", "utf8");
    expect(troubleshooting).toContain("DeepSeek");
    expect(troubleshooting).toContain("Supabase");
    expect(troubleshooting).toContain("pdf-parse");
  });

  it("ships a safe sample document for document Q&A demos", () => {
    expect(existsSync(sampleDocumentPath)).toBe(true);

    const sample = readFileSync(sampleDocumentPath, "utf8");
    expect(sample).toContain("Project Atlas");
    expect(sample).toContain("authentication");
    expect(sample).toContain("retrieval");

    for (const pattern of secretPatterns) {
      expect(sample).not.toMatch(pattern);
    }
  });

  it("keeps Markdown documentation free of obvious secrets", () => {
    for (const docPath of listMarkdownFiles("docs")) {
      const doc = readFileSync(docPath, "utf8");

      for (const pattern of secretPatterns) {
        expect(doc, `${docPath} should not contain secrets`).not.toMatch(pattern);
      }
    }
  });

  it("keeps .env.example as placeholders for sensitive values", () => {
    const envExample = readFileSync(".env.example", "utf8");
    const sensitiveKeys = [
      "OPENAI_API_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
      "DEEPSEEK_API_KEY",
    ];

    for (const key of sensitiveKeys) {
      expect(envExample).toMatch(new RegExp(`^${key}=$`, "m"));
    }

    expect(envExample).toContain("LLM_PROVIDER=mock");
    expect(envExample).toContain("DEEPSEEK_BASE_URL=https://api.deepseek.com");
    expect(envExample).toContain("DEEPSEEK_CHAT_MODEL=deepseek-chat");

    for (const pattern of secretPatterns) {
      expect(envExample).not.toMatch(pattern);
    }
  });
});

function listMarkdownFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = `${directory}/${entry.name}`;

    if (entry.isDirectory()) {
      return listMarkdownFiles(entryPath);
    }

    return entry.isFile() && entry.name.endsWith(".md") ? [entryPath] : [];
  });
}
