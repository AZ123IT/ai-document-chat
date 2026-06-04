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
    <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-[0_18px_45px_rgba(24,24,27,0.07)]">
      <div className="h-1 bg-emerald-600" />
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase text-emerald-700">
              ingest
            </p>
            <h2 className="mt-2 text-lg font-semibold text-zinc-950">
              Upload document
            </h2>
          </div>
          <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
            PDF/TXT
          </span>
        </div>

        <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-[linear-gradient(135deg,#fafafa,#f4f4f5)] px-4 py-8 text-center shadow-inner transition hover:border-emerald-500 hover:bg-emerald-50/70 hover:shadow-[inset_0_0_0_1px_rgba(5,150,105,0.12)]">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-zinc-950 text-sm font-semibold text-white shadow-sm">
            +
          </span>
          <span className="mt-3 text-sm font-semibold text-zinc-950">
            Choose document
          </span>
          <span className="mt-1 text-sm text-zinc-600">
            PDF or TXT, local preview
          </span>
          <input
            aria-label="Choose document"
            className="sr-only"
            type="file"
            accept=".pdf,.txt,application/pdf,text/plain"
            onChange={handleFileChange}
          />
        </label>

        {error ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 shadow-sm">
            {error}
          </p>
        ) : null}
      </div>
    </section>
  );
}
