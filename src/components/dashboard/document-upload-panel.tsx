import type { ChangeEvent } from "react";

type DocumentUploadPanelProps = {
  error: string | null;
  onFileSelected(file: File): void;
};

export function DocumentUploadPanel({
  error,
  onFileSelected,
}: DocumentUploadPanelProps) {
  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (file) {
      onFileSelected(file);
    }

    event.target.value = "";
  }

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
            ingest
          </p>
          <h2 className="mt-2 text-lg font-semibold text-zinc-950">
            Upload document
          </h2>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
          PDF/TXT
        </span>
      </div>

      <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-7 text-center transition hover:border-emerald-500 hover:bg-emerald-50/70">
        <span className="text-sm font-semibold text-zinc-950">
          Choose document
        </span>
        <span className="mt-2 text-sm text-zinc-600">PDF or TXT, local preview</span>
        <input
          aria-label="Choose document"
          className="sr-only"
          type="file"
          accept=".pdf,.txt,application/pdf,text/plain"
          onChange={handleFileChange}
        />
      </label>

      {error ? (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}
    </section>
  );
}
