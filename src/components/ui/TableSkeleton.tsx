export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="glass-card border border-foreground/8 overflow-hidden shadow-sm">
      <div className="px-5 py-3 border-b border-foreground/5 bg-paper/40 flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="skeleton h-3 flex-1" />
        ))}
      </div>
      <div className="divide-y divide-foreground/5">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-5 py-4 flex gap-4 items-center">
            {Array.from({ length: columns }).map((_, j) => (
              <div key={j} className="skeleton h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function CardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card border border-foreground/8 p-5">
          <div className="skeleton h-3 w-24 mb-3" />
          <div className="skeleton h-8 w-16" />
        </div>
      ))}
    </div>
  )
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-card border border-foreground/8 p-4">
          <div className="skeleton h-5 w-3/4 mb-2" />
          <div className="skeleton h-3 w-1/2" />
        </div>
      ))}
    </div>
  )
}
