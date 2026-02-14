import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--cream)]">
      <h1
        className="mb-2 text-4xl font-normal"
        style={{ fontFamily: "var(--font-display)" }}
      >
        404
      </h1>
      <p className="mb-6 text-sm" style={{ color: "var(--ink-muted)" }}>
        This page doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="rounded-xl px-6 py-3 text-sm font-medium transition-all duration-200 hover:scale-[1.01] hover:shadow-md"
        style={{ background: "var(--accent)", color: "var(--cream)" }}
      >
        Go home
      </Link>
    </div>
  );
}
