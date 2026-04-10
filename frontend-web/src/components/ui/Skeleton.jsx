/**
 * Skeleton — Reusable shimmer loading placeholder
 * Usage:
 *   <Skeleton className="h-6 w-32" />            → single bar
 *   <Skeleton className="h-10 w-10 rounded-full" /> → circle
 *   <Skeleton className="h-40 rounded-2xl" />    → block
 */
export default function Skeleton({ className = "" }) {
  return (
    <div
      className={`skeleton-shimmer bg-surface-container-high rounded-lg ${className}`}
      aria-hidden="true"
    />
  );
}

/* ─── Page-specific Skeleton Layouts ─── */

/** Dashboard Page skeleton */
export function DashboardSkeleton() {
  return (
    <>
      {/* Greeting */}
      <header className="mb-10">
        <Skeleton className="h-10 w-96 mb-3" />
        <Skeleton className="h-4 w-72" />
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="bg-surface-container-lowest p-6 rounded-2xl shadow-ambient border-l-4 border-surface-container-high"
          >
            <div className="flex justify-between items-start mb-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
            <Skeleton className="h-10 w-20 mb-2" />
            <Skeleton className="h-3 w-40" />
          </div>
        ))}
      </div>

      {/* Table */}
      <section className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-ambient">
        <div className="px-8 py-6 flex justify-between items-center">
          <Skeleton className="h-5 w-64" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="px-8 pb-2">
          {/* Header */}
          <div className="flex gap-8 py-4">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-12 ml-auto" />
          </div>
          {/* Rows */}
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-8 py-5"
              style={{ opacity: 1 - i * 0.15 }}
            >
              <Skeleton className="h-4 w-20" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-4 w-36" />
              </div>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-6 rounded ml-auto" />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

/** Traceability Ledger — table rows skeleton (for inline use) */
export function LedgerTableSkeleton() {
  return (
    <div className="px-8 pb-4">
      <div className="flex gap-8 py-5">
        {["w-20", "w-28", "w-20", "w-24", "w-20", "w-16", "w-8"].map(
          (w, i) => (
            <Skeleton key={i} className={`h-3 ${w}`} />
          )
        )}
      </div>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex items-center gap-8 py-5"
          style={{ opacity: 1 - i * 0.1 }}
        >
          <Skeleton className="h-4 w-24" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-6 w-6 rounded ml-auto" />
        </div>
      ))}
    </div>
  );
}

/** Inventory Page skeleton */
export function InventorySkeleton() {
  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <Skeleton className="h-3 w-32 mb-2" />
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-12 w-36 rounded-xl" />
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-8">
        <Skeleton className="h-10 w-24 rounded-xl" />
        <Skeleton className="h-10 w-28 rounded-xl" />
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-ambient border-l-4 border-surface-container-high"
            style={{ opacity: 1 - i * 0.08 }}
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div>
                    <Skeleton className="h-4 w-32 mb-1.5" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <div className="space-y-2 mb-5">
                <Skeleton className="h-3 w-36" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-3 w-full mb-1.5" />
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
            <Skeleton className="h-11 w-full rounded-none" />
          </div>
        ))}
      </div>
    </>
  );
}

/** Batch Detail Page skeleton */
export function BatchDetailSkeleton() {
  return (
    <>
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 mb-6">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-3" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-3" />
        <Skeleton className="h-3 w-24" />
      </div>

      {/* 3-Column */}
      <div className="grid grid-cols-12 gap-8 items-start">
        {/* Left */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-ambient">
            <Skeleton className="h-3 w-24 mb-5" />
            <div className="space-y-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i}>
                  <Skeleton className="h-2.5 w-16 mb-1.5" />
                  <Skeleton className="h-5 w-32" />
                </div>
              ))}
            </div>
          </div>
          <Skeleton className="h-44 w-full rounded-2xl" />
        </div>

        {/* Center — QR */}
        <div className="col-span-12 lg:col-span-6">
          <div className="bg-surface-container-lowest p-10 rounded-2xl shadow-ambient text-center">
            <Skeleton className="h-8 w-48 mx-auto mb-2" />
            <Skeleton className="h-4 w-72 mx-auto mb-8" />
            <Skeleton className="h-[200px] w-[200px] mx-auto rounded-3xl mb-8" />
            <Skeleton className="h-10 w-56 mx-auto rounded-full mb-5" />
            <div className="flex items-center gap-4 justify-center">
              <Skeleton className="h-12 w-44 rounded-2xl" />
              <Skeleton className="h-12 w-12 rounded-2xl" />
            </div>
          </div>
        </div>

        {/* Right — Timeline */}
        <div className="col-span-12 lg:col-span-3">
          <div className="bg-surface-container-low p-7 rounded-2xl min-h-[480px]">
            <div className="flex justify-between items-center mb-7">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="space-y-10 pl-8">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="relative" style={{ opacity: 1 - i * 0.2 }}>
                  <Skeleton className="absolute -left-[30px] top-0.5 h-6 w-6 rounded-full" />
                  <Skeleton className="h-2.5 w-24 mb-1.5" />
                  <Skeleton className="h-4 w-36 mb-1" />
                  <Skeleton className="h-2.5 w-28" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
