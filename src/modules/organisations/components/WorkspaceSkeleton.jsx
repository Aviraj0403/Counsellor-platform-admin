const Bar = ({ className = '' }) => <div className={`animate-pulse rounded-lg bg-surface-2 ${className}`} />;

/** Shown while the workspace loads: same shape as the real page so nothing jumps. */
export default function WorkspaceSkeleton() {
  return (
    <div role="status" aria-live="polite" aria-label="Loading organisation">
      <Bar className="mb-4 h-24 w-full" />
      <Bar className="mb-5 h-10 w-full max-w-xl" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Bar key={i} className="h-24" />
        ))}
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Bar key={i} className="h-36" />
        ))}
      </div>
    </div>
  );
}
