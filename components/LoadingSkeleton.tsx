"use client"

/** Shimmer block — building block for loading skeletons */
export function Shimmer({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`animate-pulse rounded-lg ${className ?? ""}`}
      style={{ background: "#f3f4f6", ...style }}
    />
  )
}

/** Page-level skeleton: title + subtitle */
export function PageHeaderSkeleton() {
  return (
    <div className="mb-4">
      <Shimmer className="h-8 w-48 mb-2" />
      <Shimmer className="h-3 w-32" />
    </div>
  )
}

/** Horizontal nav skeleton */
export function SubNavSkeleton() {
  return (
    <div className="flex gap-2 mb-5 overflow-hidden">
      {[80, 100, 70, 90, 80, 70].map((w, i) => (
        <Shimmer key={i} className="h-10 shrink-0 rounded-lg" style={{ width: `${w}px` }} />
      ))}
    </div>
  )
}

/** Card grid skeleton */
export function CardGridSkeleton({ count = 6, cols = "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" }: { count?: number; cols?: string }) {
  return (
    <div className={`grid ${cols} gap-3`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl overflow-hidden" style={{ border: "1px solid #f3f4f6" }}>
          <Shimmer className="aspect-square rounded-none" />
          <div className="p-3">
            <Shimmer className="h-4 w-3/4 mb-2" />
            <div className="flex gap-1">
              <Shimmer className="h-5 w-14 rounded-full" />
              <Shimmer className="h-5 w-12 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/** Stat cards skeleton */
export function StatCardsSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-${count} gap-3`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid #f3f4f6" }}>
          <Shimmer className="h-4 w-24 mb-3" />
          <Shimmer className="h-8 w-16 mb-1" />
          <Shimmer className="h-3 w-20" />
        </div>
      ))}
    </div>
  )
}

/** List skeleton */
export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-3 rounded-xl" style={{ background: "#ffffff", border: "1px solid #f3f4f6" }}>
          <Shimmer className="w-8 h-8 rounded-full shrink-0" />
          <div className="flex-1">
            <Shimmer className="h-4 w-2/3 mb-1.5" />
            <Shimmer className="h-3 w-1/3" />
          </div>
          <Shimmer className="h-6 w-12 rounded-full shrink-0" />
        </div>
      ))}
    </div>
  )
}

/** Donut/ring skeleton */
export function RingSkeleton() {
  return (
    <div className="flex flex-col items-center py-4">
      <Shimmer className="w-48 h-48 rounded-full" />
      <Shimmer className="h-5 w-32 mt-3 rounded-full" />
      <Shimmer className="h-3 w-40 mt-2" />
    </div>
  )
}
