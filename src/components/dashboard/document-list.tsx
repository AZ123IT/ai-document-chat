import type { LocalDocument } from "./dashboard-types";

type DocumentListProps = {
  documents: LocalDocument[];
};

export function DocumentList({ documents }: DocumentListProps) {
  return (
    <section className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase text-zinc-500">
            Library
          </p>
          <h2 className="mt-1 text-sm font-semibold text-zinc-950">Documents</h2>
        </div>
        <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold uppercase text-indigo-700">
          {documents.length} staged
        </span>
      </div>

      <div className="mt-4 space-y-2">
        {documents.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 bg-white px-3 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-zinc-100 text-zinc-500">
                <FileIcon />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-zinc-800">
                  No documents selected
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  Pick a PDF or TXT file to stage it locally.
                </p>
              </div>
            </div>
          </div>
        ) : (
          documents.map((document) => (
            <article
              className="rounded-lg border border-zinc-200 bg-white px-3 py-3 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
              key={document.id}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                  <FileIcon />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-zinc-950">
                    {document.name}
                  </h3>
                  <p className="mt-0.5 text-xs font-medium text-zinc-500">
                    {document.type} - {document.sizeLabel}
                  </p>
                </div>
                <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase text-emerald-800">
                  {document.status}
                </span>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function FileIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8" />
      <path d="M8 17h5" />
    </svg>
  );
}
