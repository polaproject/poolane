export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F6F1EA] pb-10">
      <div className="bg-[#1C2B4A] px-5 pt-6 pb-8">
        <div className="skeleton h-7 w-40 mb-2 bg-white/10" />
        <div className="skeleton h-3 w-56 bg-white/10" />
      </div>
      <div className="px-4 -mt-4 max-w-2xl mx-auto space-y-3">
        <div className="skeleton h-64 rounded-2xl" />
        <div className="skeleton h-32 rounded-2xl" />
        <div className="skeleton h-32 rounded-2xl" />
      </div>
    </div>
  )
}
