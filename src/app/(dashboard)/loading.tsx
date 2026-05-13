import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-[#1C2B4A]/40">
        <Loader2 className="w-6 h-6 animate-spin" />
        <p className="text-xs uppercase tracking-wider">Đang tải...</p>
      </div>
    </div>
  )
}
