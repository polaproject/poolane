import { ListSkeleton } from '@/components/ui/TableSkeleton'

export default function Loading() {
  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="skeleton h-7 w-24 mb-1" />
      <div className="skeleton h-3 w-40 mb-4" />
      <div className="skeleton h-10 w-full mb-3 rounded-lg" />
      <ListSkeleton count={5} />
    </div>
  )
}
