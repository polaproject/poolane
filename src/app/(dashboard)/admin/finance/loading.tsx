import { CardSkeleton } from '@/components/ui/TableSkeleton'

export default function Loading() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="skeleton h-9 w-56 mb-6" />
      <CardSkeleton count={4} />
      <div className="mt-6 skeleton h-64 w-full rounded-2xl" />
    </div>
  )
}
