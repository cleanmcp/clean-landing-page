const mockRepos = [
  {
    name: "Express/express",
    lastUpdated: "11/02/2025",
    indexedBy: "Clarissa",
  },
  {
    name: "Express/express",
    lastUpdated: "11/02/2025",
    indexedBy: "Clarissa",
  },
  {
    name: "Express/express",
    lastUpdated: "11/02/2025",
    indexedBy: "Clarissa",
  },
];

export default function RepositoriesPage() {
  return (
    <div>
      <h2 className="mb-6 text-2xl font-medium text-[var(--ink)]">
        Repositories
      </h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {mockRepos.map((repo, i) => (
          <div
            key={i}
            className="rounded-lg border border-[var(--cream-dark)] bg-white p-4"
          >
            <h3 className="mb-2 font-mono text-sm font-medium text-[var(--ink)]">
              {repo.name}
            </h3>
            <p className="text-xs text-[var(--ink-muted)]">
              Last updated: {repo.lastUpdated}
            </p>
            <p className="text-xs text-[var(--ink-muted)]">
              Indexed by: {repo.indexedBy}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

