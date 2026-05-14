export default function Loading() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="skeleton h-12 w-64 mb-2" />
      <div className="skeleton h-3 w-48 mb-7" />
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, day) => (
          <div key={day} className="space-y-2">
            <div className="skeleton h-5 w-full" />
            <div className="skeleton h-24 w-full rounded-card" />
            <div className="skeleton h-24 w-full rounded-card" />
          </div>
        ))}
      </div>
    </div>
  )
}
