import type { SourceCitation } from "./dashboard-types";

type SourceCitationsProps = {
  citations: SourceCitation[];
};

export function SourceCitations({ citations }: SourceCitationsProps) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-[0_14px_35px_rgba(24,24,27,0.055)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-zinc-500">
            evidence
          </p>
          <h2 className="mt-2 text-lg font-semibold text-zinc-950">
            Source citations
          </h2>
        </div>
        <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-600">
          {citations.length} sources
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {citations.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-5 text-sm text-zinc-500">
            Citations from answers will appear here.
          </p>
        ) : (
          citations.map((citation) => (
            <article
              className="rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-sm"
              key={`${citation.label}-${citation.chunkId}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-zinc-950 px-2 py-1 text-xs font-semibold text-white">
                  [{citation.label}]
                </span>
                <h3 className="text-sm font-semibold text-zinc-950">
                  {citation.fileName ?? `Document ${citation.documentId ?? ""}`}
                </h3>
                {citation.pageNumber ? (
                  <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
                    Page {citation.pageNumber}
                  </span>
                ) : null}
              </div>
              {citation.snippet ? (
                <p className="mt-3 text-sm leading-6 text-zinc-600">
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
