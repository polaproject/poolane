import { CardSkeleton } from '@/components/ui/TableSkeleton'

export default function Loading() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="skeleton h-12 w-72 mb-2" />
      <div className="skeleton h-3 w-40 mb-7" />
      <CardSkeleton count={4} />
      <div className="mt-6 skeleton h-32 w-full" />
    </div>
  )
}
