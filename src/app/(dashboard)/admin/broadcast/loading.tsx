export default function Loading() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="skeleton h-12 w-64 mb-2" />
      <div className="skeleton h-3 w-80 mb-7" />
      <div className="space-y-4">
        <div className="skeleton h-10 w-full rounded-card" />
        <div className="skeleton h-10 w-full rounded-card" />
        <div className="skeleton h-32 w-full rounded-card" />
        <div className="skeleton h-10 w-32 rounded-pill" />
      </div>
    </div>
  )
}
