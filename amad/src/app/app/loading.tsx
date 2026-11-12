export default function Loading() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="جارٍ التحميل">
      <div className="h-8 w-56 animate-pulse rounded bg-surface-2" />
      <div className="grid gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((i) => <div key={i} className="h-48 animate-pulse rounded-lg border border-line bg-surface" />)}
      </div>
    </div>
  );
}
