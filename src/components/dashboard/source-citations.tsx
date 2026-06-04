import type { SourceCitation } from "./dashboard-types";

type SourceCitationsProps = {
  citations: SourceCitation[];
};

export function SourceCitations({ citations }: SourceCitationsProps) {
  return (
    <section className="p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase text-zinc-500">
            Evidence
          </p>
          <h2 className="mt-1 text-sm font-semibold text-zinc-950">
            Source citations
          </h2>
        </div>
        <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase text-zinc-600">
          {citations.length} sources
        </span>
      </div>

      <div className="mt-4 space-y-2">
        {citations.length === 0 ? (
          <p className="rounded-lg border border-zinc-200 bg-white px-3 py-4 text-sm leading-5 text-zinc-500">
            Citations from answers will appear here.
          </p>
        ) : (
          citations.map((citation) => (
            <article
              className="border-l-2 border-emerald-500 bg-white px-3 py-2.5 shadow-sm ring-1 ring-zinc-200"
              key={`${citation.label}-${citation.chunkId}`}
            >
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-800 ring-1 ring-emerald-200">
                  [{citation.label}]
                </span>
                <h3 className="truncate text-xs font-semibold text-zinc-700">
                  {citation.fileName ?? `Document ${citation.documentId ?? ""}`}
                </h3>
              </div>
              {citation.pageNumber ? (
                <p className="mt-1 text-[11px] font-semibold uppercase text-zinc-500">
                  Page {citation.pageNumber}
                </p>
              ) : null}
              {citation.snippet ? (
                <p className="mt-2 max-h-10 overflow-hidden text-xs leading-5 text-zinc-600">
                  {citation.snippet}
                </p>
              ) : null}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
