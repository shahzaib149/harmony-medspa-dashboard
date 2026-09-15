import type { CSSProperties, ReactNode } from "react";

// Shimmering placeholder shaped like the content it stands in for.
export function Skeleton({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return <span aria-hidden="true" className={`ui-skeleton ${className}`} style={style} />;
}

// Announces loading to screen readers while sighted users see skeletons.
export function LoadingRegion({ label, className = "", children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

// Common list placeholder: avatar, two text lines and a trailing pill.
export function SkeletonRows({ rows = 5, className = "" }: { rows?: number; className?: string }) {
  return (
    <div className={className}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-4 border-b px-5 py-4 last:border-b-0" style={{ borderColor: "var(--border-subtle)" }}>
          <Skeleton className="size-9 shrink-0 rounded-xl" />
          <div className="grid min-w-0 flex-1 gap-2">
            <Skeleton className="h-3 rounded-full" style={{ width: `${38 + ((index * 17) % 30)}%` }} />
            <Skeleton className="h-2.5 rounded-full" style={{ width: `${22 + ((index * 11) % 20)}%` }} />
          </div>
          <Skeleton className="hidden h-6 w-20 shrink-0 rounded-full sm:block" />
        </div>
      ))}
    </div>
  );
}
