import { prisma } from '@/lib/prisma'
import { PublicHeader, PublicFooter } from '@/components/layouts/PublicHeader'

export const metadata = {
  title: 'Câu hỏi thường gặp · Poolane',
  description: 'Mọi thắc mắc về khoá học, học phí, lịch học, chính sách hoàn tiền của Poolane',
}

export default async function FaqPage() {
  const faqs = await prisma.faq.findMany({
    where: { isActive: true },
    orderBy: [{ category: 'asc' }, { orderIndex: 'asc' }],
  })

  // Group by category
  const grouped = faqs.reduce<Record<string, typeof faqs>>((acc, f) => {
    const cat = f.category ?? 'Khác'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(f)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-[#F6F1EA]">
      <PublicHeader />

      <section className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="font-heading text-4xl text-[#1C2B4A] mb-2">Câu hỏi thường gặp</h1>
        <p className="text-[#1C2B4A]/60 mb-10">
          Không tìm thấy câu trả lời? Liên hệ chúng tôi qua{' '}
          <a href="mailto:support@poolane.vn" className="text-[#5B8E9F] underline">support@poolane.vn</a>
        </p>

        {faqs.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-[#1C2B4A]/40">
            Đang cập nhật...
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat}>
                <h2 className="text-xs uppercase tracking-wider text-[#5B8E9F] font-semibold mb-3">{cat}</h2>
                <div className="space-y-2">
                  {items.map(f => (
                    <details key={f.id} className="bg-white rounded-xl border border-[#1C2B4A]/8 overflow-hidden group">
                      <summary className="cursor-pointer px-5 py-4 font-semibold text-[#1C2B4A] hover:bg-[#F6F1EA]/40 list-none flex items-center justify-between">
                        {f.question}
                        <span className="text-[#1C2B4A]/40 group-open:rotate-45 transition-transform text-2xl leading-none">+</span>
                      </summary>
                      <div className="px-5 pb-4 text-sm text-[#1C2B4A]/70 whitespace-pre-wrap">{f.answer}</div>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <PublicFooter />
    </div>
  )
}
