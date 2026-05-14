import { CardSkeleton, TableSkeleton } from '@/components/ui/TableSkeleton'

export default function Loading() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="skeleton h-12 w-56 mb-2" />
      <div className="skeleton h-3 w-72 mb-7" />
      <CardSkeleton count={3} />
      <div className="mt-6">
        <TableSkeleton rows={6} columns={4} />
      </div>
    </div>
  )
}
