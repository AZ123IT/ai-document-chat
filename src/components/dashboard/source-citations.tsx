import type { SourceCitation } from "./dashboard-types";

type SourceCitationsProps = {
  citations: SourceCitation[];
};

export function SourceCitations({ citations }: SourceCitationsProps) {
  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
            evidence
          </p>
          <h2 className="mt-2 text-lg font-semibold text-zinc-950">
            Source citations
          </h2>
        </div>
        <span className="text-sm font-medium text-zinc-500">
          {citations.length} sources
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {citations.length === 0 ? (
          <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-5 text-sm text-zinc-500">
            Citations from answers will appear here.
          </p>
        ) : (
          citations.map((citation) => (
            <article
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3"
              key={`${citation.label}-${citation.chunkId}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-zinc-950 px-2 py-1 text-xs font-semibold text-white">
                  [{citation.label}]
                </span>
                <h3 className="text-sm font-semibold text-zinc-950">
                  {citation.fileName ?? `Document ${citation.documentId ?? ""}`}
                </h3>
                {citation.pageNumber ? (
                  <span className="rounded-full bg-white px-2 py-1 text-xs font-medium text-zinc-600 ring-1 ring-zinc-200">
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
