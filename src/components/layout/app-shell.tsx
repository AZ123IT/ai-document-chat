import { EmptyState } from "@/components/ui/empty-state";
import { APP_DESCRIPTION, APP_NAME, MILESTONE_LABELS } from "@/lib/constants";

export function AppShell() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8">
        <header className="border-b border-slate-200 pb-6">
          <p className="text-sm font-medium text-slate-500">RAG portfolio app</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            {APP_NAME}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            {APP_DESCRIPTION}
          </p>
        </header>

        <section className="grid flex-1 gap-4 py-6 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-950">
              Milestone 1
            </h2>
            <ol className="mt-4 space-y-3">
              {MILESTONE_LABELS.map((label, index) => (
                <li key={label} className="flex items-center gap-3 text-sm">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                    {index + 1}
                  </span>
                  <span className="text-slate-600">{label}</span>
                </li>
              ))}
            </ol>
          </aside>

          <div className="grid gap-4 md:grid-cols-2">
            <EmptyState
              title="Document upload"
              description="The foundation is ready. Upload and parsing will be added in the next milestone."
            />
            <EmptyState
              title="Chat workspace"
              description="RAG chat, source citations, and saved history are intentionally not implemented yet."
            />
          </div>
        </section>
      </div>
    </main>
  );
}
