import type { LocalDocument } from "./dashboard-types";

type DocumentListProps = {
  documents: LocalDocument[];
};

export function DocumentList({ documents }: DocumentListProps) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-[0_14px_35px_rgba(24,24,27,0.055)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-zinc-500">
            library
          </p>
          <h2 className="mt-2 text-lg font-semibold text-zinc-950">Documents</h2>
        </div>
        <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-600">
          {documents.length} staged
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {documents.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-5">
            <p className="text-sm font-medium text-zinc-800">
              No documents selected
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Pick a PDF or TXT file to stage it locally.
            </p>
          </div>
        ) : (
          documents.map((document) => (
            <article
              className="rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
              key={document.id}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-zinc-950">
                    {document.name}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-zinc-500">
                    {document.type} - {document.sizeLabel}
                  </p>
                </div>
                <span className="shrink-0 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
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
