import Link from "next/link";

type Swatch = { name: string; hex: string; box: string; label: string };

const palette: Swatch[] = [
  { name: "primary", hex: "#801115", box: "bg-primary", label: "text-white" },
  { name: "blush", hex: "#f8c9de", box: "bg-blush", label: "text-primary" },
  { name: "pink", hex: "#f4b4c5", box: "bg-pink", label: "text-primary" },
  { name: "sky", hex: "#bae2ff", box: "bg-sky", label: "text-ink" },
  { name: "paper", hex: "#faf9f0", box: "bg-paper", label: "text-ink" },
  { name: "cream", hex: "#fdfbf2", box: "bg-cream", label: "text-ink" },
  { name: "white", hex: "#ffffff", box: "bg-white", label: "text-ink" },
  { name: "ink", hex: "#1c1b18", box: "bg-ink", label: "text-white" },
  { name: "muted", hex: "#8c8370", box: "bg-muted", label: "text-white" },
  { name: "border", hex: "#cdc3ac", box: "bg-border", label: "text-ink" },
  { name: "divider", hex: "#fff2f3", box: "bg-divider", label: "text-ink" },
  { name: "divider-warm", hex: "#e7dccb", box: "bg-divider-warm", label: "text-ink" },
  { name: "lagoon", hex: "#077cc2", box: "bg-lagoon", label: "text-white" },
  { name: "pebble", hex: "#909090", box: "bg-pebble", label: "text-white" },
];

const scenes: Swatch[] = [
  { name: "scene-blue", hex: "#407c9d", box: "bg-scene-blue", label: "text-white" },
  { name: "scene-green", hex: "#7e9352", box: "bg-scene-green", label: "text-white" },
  { name: "scene-sky", hex: "#ddeefb", box: "bg-scene-sky", label: "text-primary" },
  { name: "scene-petal", hex: "#fcedf4", box: "bg-scene-petal", label: "text-primary" },
];

const typeScale = [
  { cls: "text-2xs", name: "2xs · 14" },
  { cls: "text-xs", name: "xs · 14" },
  { cls: "text-sm", name: "sm · 16" },
  { cls: "text-base", name: "base · 18" },
  { cls: "text-md", name: "md · 18" },
  { cls: "text-lg", name: "lg · 20" },
  { cls: "text-xl", name: "xl · 22" },
  { cls: "text-2xl", name: "2xl · 24" },
  { cls: "text-3xl", name: "3xl · 30" },
  { cls: "text-4xl", name: "4xl · 34" },
  { cls: "text-5xl", name: "5xl · 36" },
  { cls: "text-6xl", name: "6xl · 48" },
  { cls: "text-7xl", name: "7xl · 96" },
];

const radii = [
  { cls: "rounded-xs", name: "xs · 5" },
  { cls: "rounded-sm", name: "sm · 6" },
  { cls: "rounded-md", name: "md · 10" },
  { cls: "rounded-lg", name: "lg · 12" },
  { cls: "rounded-xl", name: "xl · 16" },
  { cls: "rounded-2xl", name: "2xl · 24" },
  { cls: "rounded-full", name: "full" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-micro text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}

export default function Playground() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-12 px-6 py-12">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-4xl font-black text-primary">Splitsy design system</h1>
        <p className="font-body text-md text-muted-foreground">
          Tokens generated from Figma · S3.{" "}
          <Link href="/playground/components" className="text-primary underline">
            components
          </Link>
          {" · "}
          <Link href="/" className="text-primary underline">
            home
          </Link>
        </p>
      </header>

      <Section title="Palette">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {palette.map((s) => (
            <div
              key={s.name}
              className={`${s.box} flex h-20 flex-col justify-end rounded-lg border border-border/50 p-2`}
            >
              <span className={`${s.label} font-body text-sm`}>{s.name}</span>
              <span className={`${s.label} font-mono text-2xs opacity-80`}>{s.hex}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Scene backgrounds">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {scenes.map((s) => (
            <div key={s.name} className={`${s.box} flex h-28 flex-col justify-end rounded-xl p-3`}>
              <span className={`${s.label} font-body text-md`}>{s.name}</span>
              <span className={`${s.label} font-mono text-2xs opacity-80`}>{s.hex}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Fonts">
        <div className="flex flex-col gap-4 rounded-xl bg-paper p-6 shadow-card">
          <p className="font-display text-6xl font-black text-primary">Splitsy</p>
          <p className="font-script text-4xl text-primary">Split the bill, keep the vibe.</p>
          <p className="font-body text-lg text-ink">
            Judson — the app-wide font. <span className="font-bold">Bold works too.</span> ฿1,350
          </p>
          <p className="font-mono text-2xs uppercase tracking-wide text-muted-foreground">
            IBM Plex Mono — terms, privacy, the usual
          </p>
        </div>
      </Section>

      <Section title="Type scale (Judson)">
        <div className="flex flex-col gap-2 rounded-xl bg-paper p-6 shadow-card">
          {typeScale.map((t) => (
            <div key={t.cls} className="flex items-baseline justify-between gap-4">
              <span className={`${t.cls} font-body text-ink`}>Aa ฿1,350</span>
              <span className="font-mono text-2xs text-muted-foreground">{t.name}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Radii">
        <div className="flex flex-wrap gap-4">
          {radii.map((r) => (
            <div key={r.cls} className="flex flex-col items-center gap-2">
              <div className={`${r.cls} size-16 bg-primary`} />
              <span className="font-mono text-2xs text-muted-foreground">{r.name}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Shadows">
        <div className="flex flex-wrap gap-6">
          <div className="flex h-20 w-40 items-center justify-center rounded-xl bg-white shadow-card font-body text-sm text-ink">
            shadow-card
          </div>
          <div className="flex h-20 w-40 items-center justify-center rounded-full bg-blush shadow-button font-body text-sm text-primary">
            shadow-button
          </div>
        </div>
      </Section>
    </main>
  );
}
