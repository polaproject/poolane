import { TableSkeleton } from '@/components/ui/TableSkeleton'

export default function Loading() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="skeleton h-9 w-56 mb-6" />
      <div className="flex gap-2 mb-6">
        <div className="skeleton h-10 w-24 rounded-lg" />
        <div className="skeleton h-10 w-24 rounded-lg" />
        <div className="skeleton h-10 w-24 rounded-lg" />
      </div>
      <TableSkeleton rows={8} columns={6} />
    </div>
  )
}
