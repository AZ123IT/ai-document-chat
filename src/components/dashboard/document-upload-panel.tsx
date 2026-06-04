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
    <section className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase text-zinc-500">
            Ingest
          </p>
          <h2 className="mt-1 text-sm font-semibold text-zinc-950">
            Upload document
          </h2>
        </div>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase text-emerald-800">
          PDF / TXT
        </span>
      </div>

      <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-emerald-500 bg-white px-4 py-6 text-center shadow-inner transition hover:bg-emerald-50/60">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
          <UploadIcon />
        </span>
        <span className="mt-3 text-sm font-semibold text-zinc-950">
          Drop document here
        </span>
        <span className="mt-1 text-sm text-zinc-500">
          PDF or TXT - local preview
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
        <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-md border border-zinc-200 bg-white px-3 py-2">
            <p className="text-[11px] font-semibold uppercase text-zinc-500">
              Mode
            </p>
            <p className="mt-1 text-sm font-semibold text-zinc-900">Local</p>
          </div>
          <div className="rounded-md border border-zinc-200 bg-white px-3 py-2">
            <p className="text-[11px] font-semibold uppercase text-zinc-500">
              Status
            </p>
            <p className="mt-1 text-sm font-semibold text-emerald-700">Ready</p>
          </div>
        </div>
      )}
    </section>
  );
}

function UploadIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M12 16V4" />
      <path d="m7 9 5-5 5 5" />
      <path d="M20 16v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3" />
    </svg>
  );
}
