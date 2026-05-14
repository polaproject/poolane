import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/PageHeader'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { HelpCircle, Mail, Plus, ArrowRight } from 'lucide-react'

export const metadata = {
  title: 'Câu hỏi thường gặp · Poolane',
  description: 'Mọi thắc mắc về khoá học, học phí, lịch học, chính sách hoàn tiền của Poolane',
}

export default async function FaqPage() {
  const faqs = await prisma.faq.findMany({
    where: { isActive: true },
    orderBy: [{ category: 'asc' }, { orderIndex: 'asc' }],
  })

  const grouped = faqs.reduce<Record<string, typeof faqs>>((acc, f) => {
    const cat = f.category ?? 'Khác'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(f)
    return acc
  }, {})

  return (
    <>
      <section className="mx-auto max-w-3xl px-4 pt-16 pb-10">
        <PageHeader
          eyebrow="FAQ · Hỗ trợ"
          title="Câu hỏi thường gặp"
          display
          description={
            <>
              Không tìm thấy câu trả lời?{' '}
              <a href="mailto:support@poolane.vn" className="text-accent hover:underline font-medium">
                support@poolane.vn
              </a>{' '}
              — lớp sẽ phản hồi trong 24h.
            </>
          }
        />
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-16">
        {faqs.length === 0 ? (
          <GlassPanel className="p-12 text-center">
            <HelpCircle className="h-10 w-10 mx-auto mb-3 opacity-40" strokeWidth={1.5} />
            <p className="font-heading italic text-2xl mb-1">Đang cập nhật...</p>
            <p className="text-sm opacity-65">Lớp đang viết các câu hỏi thường gặp. Quay lại sớm nhé.</p>
          </GlassPanel>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([cat, items]) => (
              <div key={cat}>
                <p className="eyebrow text-accent mb-3">{cat}</p>
                <div className="space-y-2">
                  {items.map((f) => (
                    <details
                      key={f.id}
                      className="group rounded-card bg-current/5 ring-1 ring-current/10 overflow-hidden backdrop-blur-sm transition hover:ring-current/20 open:ring-accent/40 open:bg-current/8"
                    >
                      <summary className="cursor-pointer list-none px-5 py-4 font-medium flex items-center justify-between gap-4 transition">
                        <span className="flex-1">{f.question}</span>
                        <span className="grid place-items-center h-7 w-7 rounded-pill bg-current/8 group-open:bg-accent group-open:text-ink shrink-0 transition">
                          <Plus className="h-4 w-4 group-open:rotate-45 transition-transform" strokeWidth={2.25} />
                        </span>
                      </summary>
                      <div className="px-5 pb-5 text-sm opacity-80 leading-relaxed whitespace-pre-wrap border-t border-current/10 pt-4">
                        {f.answer}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Contact CTA */}
      <section className="mx-auto max-w-3xl px-4 pb-20">
        <div className="rounded-card-xl bg-current/5 ring-1 ring-current/10 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-sm">
          <div className="flex items-start gap-4">
            <div className="grid place-items-center h-12 w-12 rounded-pill bg-accent/15 shrink-0">
              <Mail className="h-5 w-5 text-accent" strokeWidth={1.75} />
            </div>
            <div>
              <p className="font-heading italic text-xl mb-1">Vẫn còn thắc mắc?</p>
              <p className="text-sm opacity-70">Email lớp, mình sẽ trả lời chi tiết trong 24h.</p>
            </div>
          </div>
          <Link
            href="mailto:support@poolane.vn"
            className="inline-flex items-center gap-2 bg-ink text-paper font-medium px-5 py-2.5 rounded-pill text-sm hover:bg-ink/90 transition"
          >
            support@poolane.vn <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
          </Link>
        </div>
      </section>
    </>
  )
}
