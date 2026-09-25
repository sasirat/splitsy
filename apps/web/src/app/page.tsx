import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 bg-scene-blue px-6">
      <div className="flex flex-col items-center gap-1 rounded-2xl bg-paper px-10 py-8 shadow-card">
        <h1 className="font-display text-6xl font-black text-primary">Splitsy</h1>
        <p className="font-script text-2xl text-primary">Split the bill, keep the vibe.</p>
        <p className="font-body text-sm text-muted">Nobody does mental math.</p>
      </div>

      <Link
        href="/playground"
        className="rounded-full bg-blush px-8 py-3 font-body text-xl text-primary shadow-button"
      >
        View the design system →
      </Link>

      <p className="font-mono text-2xs uppercase tracking-wide text-cream/70">
        Splitsy · design system · S3
      </p>
    </main>
  );
}
