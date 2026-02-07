export function UngroupIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="currentColor"
    >
      <path d="M12 14.5c0 0.825-0.675 1.5-1.5 1.5h-3c-0.825 0-1.5-0.675-1.5-1.5v-3c0-0.825 0.675-1.5 1.5-1.5h3c0.825 0 1.5 0.675 1.5 1.5v3z"></path>
      <path d="M22 14.5c0 0.825-0.675 1.5-1.5 1.5h-3c-0.825 0-1.5-0.675-1.5-1.5v-3c0-0.825 0.675-1.5 1.5-1.5h3c0.825 0 1.5 0.675 1.5 1.5v3z"></path>
      <path d="M12 24.5c0 0.825-0.675 1.5-1.5 1.5h-3c-0.825 0-1.5-0.675-1.5-1.5v-3c0-0.825 0.675-1.5 1.5-1.5h3c0.825 0 1.5 0.675 1.5 1.5v3z"></path>
      <path d="M22 24.5c0 0.825-0.675 1.5-1.5 1.5h-3c-0.825 0-1.5-0.675-1.5-1.5v-3c0-0.825 0.675-1.5 1.5-1.5h3c0.825 0 1.5 0.675 1.5 1.5v3z"></path>
      <path d="M28.503 5l3.497-3.497v-1.503h-1.503l-3.497 3.497-3.497-3.497h-1.503v1.503l3.497 3.497-3.497 3.497v1.503h1.503l3.497-3.497 3.497 3.497h1.503v-1.503z"></path>
      <path d="M0 24h2v4h-2v-4z"></path>
      <path d="M0 18h2v4h-2v-4z"></path>
      <path d="M26 14h2v4h-2v-4z"></path>
      <path d="M26 26h2v4h-2v-4z"></path>
      <path d="M26 20h2v4h-2v-4z"></path>
      <path d="M0 12h2v4h-2v-4z"></path>
      <path d="M0 6h2v4h-2v-4z"></path>
      <path d="M16 4h4v2h-4v-2z"></path>
      <path d="M10 4h4v2h-4v-2z"></path>
      <path d="M4 4h4v2h-4v-2z"></path>
      <path d="M14 30h4v2h-4v-2z"></path>
      <path d="M20 30h4v2h-4v-2z"></path>
      <path d="M8 30h4v2h-4v-2z"></path>
      <path d="M2 30h4v2h-4v-2z"></path>
    </svg>
  );
}

export function EnlargeIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="currentColor">
      <path d="M32 0h-13l5 5-6 6 3 3 6-6 5 5z"></path>
      <path d="M32 32v-13l-5 5-6-6-3 3 6 6-5 5z"></path>
      <path d="M0 32h13l-5-5 6-6-3-3-6 6-5-5z"></path>
      <path d="M0 0v13l5-5 6 6 3-3-6-6 5-5z"></path>
    </svg>
  );
}

export function CoinDollarIcon({
  className = "w-6 h-6",
}: {
  className?: string;
}) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="currentColor">
      <path d="M15 2c-8.284 0-15 6.716-15 15s6.716 15 15 15c8.284 0 15-6.716 15-15s-6.716-15-15-15zM15 29c-6.627 0-12-5.373-12-12s5.373-12 12-12c6.627 0 12 5.373 12 12s-5.373 12-12 12zM16 16v-4h4v-2h-4v-2h-2v2h-4v8h4v4h-4v2h4v2h2v-2h4l-0-8h-4zM14 16h-2v-4h2v4zM18 22h-2v-4h2v4z"></path>
    </svg>
  );
}

export function FlameIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2C8 2 6 5 6 9c0 2-1 3-1 4 0 2 2 3 2 3s2-1 2-3c0-1-1-2-1-4 0-4-2-7-6-7z" />
      <path d="M12 2v6" />
      <path d="M12 8c2 0 4 1 4 3s-2 3-4 3" />
      <circle cx="12" cy="18" r="2" fill="currentColor" />
    </svg>
  );
}

export function LinkIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="7" width="8" height="10" rx="1" />
      <rect x="13" y="7" width="8" height="10" rx="1" />
      <path d="M7 12h10" />
      <path d="M9 9v6" />
      <path d="M15 9v6" />
    </svg>
  );
}

export function UsersIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8" cy="8" r="3" />
      <circle cx="16" cy="8" r="3" />
      <path d="M5 20c0-2 2-3 6-3s6 1 6 3" />
      <path d="M11 20c0-2 2-3 6-3s6 1 6 3" />
      <path d="M2 12h4" />
      <path d="M18 12h4" />
    </svg>
  );
}

export function FolderIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

export function BoltIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2L4 12h6l-2 10 8-10h-6l2-10z" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

export function SparklesIcon({
  className = "w-6 h-6",
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v6m0 6v6M23 12h-6m-6 0H1M19.07 4.93l-4.24 4.24m0 0l-4.24 4.24m4.24-4.24l-4.24-4.24m4.24 4.24l4.24 4.24" />
    </svg>
  );
}

export function SyncIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
      <path d="M5.64 5.64l2.83 2.83m7.06 7.06l2.83 2.83M5.64 18.36l2.83-2.83m7.06-7.06l2.83-2.83" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function PlugIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="6" y="4" width="12" height="16" rx="2" />
      <path d="M10 4v4M14 4v4M8 12h8M8 16h8" />
      <circle cx="12" cy="20" r="1" fill="currentColor" />
    </svg>
  );
}

export function ZapIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

export function CodeIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M6 8h12M6 12h8M6 16h4" />
      <circle cx="18" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

export function LayersIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

export function NetworkIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="6" cy="6" r="3" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="18" r="3" />
      <path d="M6 9h12M9 6v12M15 6v12M6 15h12" />
    </svg>
  );
}

export function ArrowRightIcon({
  className = "w-6 h-6",
}: {
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
