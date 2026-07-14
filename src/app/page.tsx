// Temporary design-system preview. It exercises the DISPATCH tokens and
// utilities from globals.css so the visual language can be verified early.
// This whole page is replaced in a later phase by the auth-aware entry point.
export default function Home() {
  return (
    <main className="mx-auto w-full max-w-2xl p-8">
      <p className="font-mono-ui text-xs font-bold tracking-widest text-muted uppercase">
        Design System · Phase 2
      </p>
      <h1 className="mt-3 text-5xl font-bold tracking-tight">Say it in 240.</h1>
      <p className="mt-3 text-muted">
        Space Grotesk for display, Space Mono for labels, on paper.
      </p>

      {/* Accent chip with the signature 3px border + hard offset shadow. */}
      <div className="mt-8 inline-block border-[3px] border-ink bg-accent px-4 py-2 shadow-hard-6">
        <span className="font-mono-ui text-sm font-bold tracking-wide">◆ DISPATCH</span>
      </div>

      {/* A surface card, and a pressable button demonstrating the .press utility. */}
      <div className="mt-8 border-[3px] border-ink bg-surface p-6 shadow-hard-4">
        <p className="text-sm text-muted">Tokens in use:</p>
        <ul className="mt-2 space-y-1 text-sm">
          <li>paper · surface · ink · muted · faint · accent</li>
          <li>shadow-hard-2…8 · font-mono-ui · press</li>
        </ul>
        <button
          type="button"
          className="press mt-4 border-[3px] border-ink bg-accent px-5 py-2 font-mono-ui text-sm font-bold shadow-hard-4"
        >
          POST →
        </button>
      </div>
    </main>
  );
}
