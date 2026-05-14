import { TableSkeleton } from '@/components/ui/TableSkeleton'

export default function Loading() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="skeleton h-9 w-48 mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="skeleton h-24 rounded-2xl" />
        <div className="skeleton h-24 rounded-2xl" />
      </div>
      <TableSkeleton rows={6} columns={6} />
    </div>
  )
}
