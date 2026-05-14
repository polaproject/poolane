import { ListSkeleton } from '@/components/ui/TableSkeleton'

export default function Loading() {
  return (
    <div className="min-h-screen bg-paper pb-10">
      <div className="bg-ink-soft px-5 pt-6 pb-8">
        <div className="skeleton h-7 w-48 mb-2 bg-[var(--surface)]/10" />
        <div className="skeleton h-3 w-32 bg-[var(--surface)]/10" />
      </div>
      <div className="px-4 -mt-4 max-w-2xl mx-auto space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="skeleton h-20 rounded-card-lg" />
          <div className="skeleton h-20 rounded-card-lg" />
          <div className="skeleton h-20 rounded-card-lg" />
        </div>
        <ListSkeleton count={6} />
      </div>
    </div>
  )
}
