import { Avatar, Button, Card, Input, Select, TagPill, TextArea } from '@/components/ui';
import { TAGS } from '@/lib/schemas';

// Temporary gallery of the Phase 5 UI primitives, for visual verification.
// Replaced by the real entry point in a later phase.
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-mono-ui text-xs font-bold tracking-widest text-muted uppercase">
        {title}
      </h2>
      <div className="flex flex-wrap items-end gap-4">{children}</div>
    </section>
  );
}

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-10 p-8">
      <header>
        <p className="font-mono-ui text-xs font-bold tracking-widest text-muted uppercase">
          UI Primitives · Phase 5
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight">DISPATCH kit</h1>
      </header>

      <Section title="Button">
        <Button variant="primary">Log in →</Button>
        <Button variant="secondary">Cancel</Button>
        <Button variant="primary" size="sm">
          Post
        </Button>
        <Button variant="ghost" size="sm">
          Edit
        </Button>
        <Button disabled>Disabled</Button>
      </Section>

      <Section title="Input / TextArea / Select">
        <div className="w-64">
          <Input placeholder="ada@dispatch.dev" />
        </div>
        <div className="w-64">
          <Select defaultValue="" aria-label="User">
            <option value="">All users</option>
            <option value="u_ada">Ada Lovelace</option>
          </Select>
        </div>
        <div className="w-full">
          <TextArea placeholder="What's happening?" />
        </div>
      </Section>

      <Section title="TagPill">
        {TAGS.map((tag, i) => (
          <TagPill key={tag} active={i === 0}>
            {tag}
          </TagPill>
        ))}
      </Section>

      <Section title="Avatar">
        <Avatar initial="A" />
        <Avatar initial="M" tone="surface" />
        <Avatar initial="P" size="sm" tone="surface" />
        <Avatar initial="G" size="lg" />
      </Section>

      <Section title="Card">
        <Card className="w-72 p-5">
          <p className="text-sm text-muted">A surface panel with a hard shadow.</p>
        </Card>
      </Section>
    </main>
  );
}
