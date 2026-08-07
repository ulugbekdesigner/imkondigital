export function PageHeader({
  eyebrow,
  title,
  lead,
}: {
  eyebrow: string;
  title: string;
  lead: string;
}) {
  return (
    <header className="bg-deep">
      <div className="mx-auto max-w-4xl px-4 py-12 md:py-16">
        <p className="font-mono text-xs uppercase tracking-widest text-bright">{eyebrow}</p>
        <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-deep-fg">{title}</h1>
        <p className="mt-4 max-w-2xl font-sans text-md text-mist">{lead}</p>
      </div>
    </header>
  );
}
