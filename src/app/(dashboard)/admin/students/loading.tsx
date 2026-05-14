import { TableSkeleton, CardSkeleton } from '@/components/ui/TableSkeleton'

export default function Loading() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="skeleton h-9 w-48 mb-6" />
      <div className="skeleton h-10 w-full mb-6" />
      <TableSkeleton rows={8} columns={5} />
    </div>
  )
}
