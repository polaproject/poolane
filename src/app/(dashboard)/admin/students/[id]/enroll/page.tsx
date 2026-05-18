'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { COURSE_PRICES, PAYMENT_DEPOSIT_RATE } from '@/config/constants'
import { PageHeader } from '@/components/ui/PageHeader'

type Course = { id: string; code: string; name: string; price: number }

const PAYMENT_PLANS = [
  {
    value: 'A_full',
    label: 'Phương án A — Đóng toàn bộ',
    desc: '100% học phí + vé bơi ngay khi đăng ký'
  },
  {
    value: 'B_course_first',
    label: 'Phương án B — Học phí trước',
    desc: '100% học phí trước, vé bơi tại buổi 1'
  },
  {
    value: 'C_deposit',
    label: 'Phương án C — Cọc 30%',
    desc: '30% học phí + 100% vé bơi, đóng nốt trước buổi 2'
  },
]

function fmt(n: number) { return n.toLocaleString('vi-VN') + 'đ' }

export default function EnrollPage() {
  const { id: studentId } = useParams<{ id: string }>()
  const router = useRouter()

  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [paymentPlan, setPaymentPlan] = useState('A_full')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Lấy danh sách khoá học
    fetch('/api/courses')
      .then(r => r.json())
      .then(d => d.data && setCourses(d.data))
      .catch(() => {
        // Fallback hardcoded
        setCourses([
          { id: 'ech', code: 'ECH', name: 'Bơi Ếch', price: 1_600_000 },
          { id: 'sai', code: 'SAI', name: 'Bơi Sải', price: 2_100_000 },
          { id: 'buom', code: 'BUOM', name: 'Bơi Bướm', price: 3_500_000 },
        ])
      })
  }, [])

  const depositAmount = selectedCourse
    ? Math.floor(selectedCourse.price * PAYMENT_DEPOSIT_RATE)
    : 0

  const firstPayment = selectedCourse
    ? paymentPlan === 'C_deposit'
      ? depositAmount
      : selectedCourse.price
    : 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedCourse) { toast.error('Chọn khoá học'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          courseId: selectedCourse.id,
          paymentPlan,
          depositAmount: paymentPlan === 'C_deposit' ? depositAmount : undefined
        })
      })
      const data = await res.json()

      if (!res.ok || data.error) {
        toast.error(data.error?.message ?? 'Có lỗi xảy ra')
        return
      }

      toast.success(`Đã đăng ký khoá ${selectedCourse.name}!`)
      router.push(`/admin/students/${studentId}`)

    } catch { toast.error('Không thể kết nối') }
    finally { setLoading(false) }
  }

  return (
    <div className="ambient-bg min-h-screen">
      <div className="max-w-lg mx-auto">
        <Link
          href={`/admin/students/${studentId}`}
          className="inline-flex items-center gap-1 text-sm text-foreground/70 hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Hồ sơ học viên
        </Link>
        <PageHeader
          eyebrow="Khoá học"
          title="Đăng ký khoá học"
          description="Chọn khoá học và phương án thanh toán cho học viên."
          display
          className="mb-8"
        />

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Chọn khoá */}
        <Card className="border-foreground/10 shadow-sm">
          <CardHeader className="pb-2 pt-5 px-6">
            <h2 className="font-semibold text-foreground text-sm">Chọn khoá học <span className="text-danger">*</span></h2>
          </CardHeader>
          <CardContent className="px-6 pb-5 space-y-2">
            {[
              { code: 'ECH', name: 'Bơi Ếch', price: COURSE_PRICES.ECH },
              { code: 'SAI', name: 'Bơi Sải', price: COURSE_PRICES.SAI },
              { code: 'BUOM', name: 'Bơi Bướm', price: COURSE_PRICES.BUOM },
            ].map(c => {
              const course = courses.find(x => x.code === c.code) ?? { id: c.code, ...c }
              const isSelected = selectedCourse?.code === c.code
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => setSelectedCourse(course)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-ink-soft border-ink text-white'
                      : 'border-foreground/15 hover:border-foreground/40'
                  }`}
                >
                  <div className="flex justify-between">
                    <div>
                      <p className="font-semibold text-sm">{c.name}</p>
                      <p className={`text-xs mt-0.5 ${isSelected ? 'text-white/60' : 'text-foreground/50'}`}>
                        10 buổi
                      </p>
                    </div>
                    <p className={`font-semibold ${isSelected ? 'text-white' : 'text-foreground'}`}>
                      {fmt(c.price)}
                    </p>
                  </div>
                </button>
              )
            })}
          </CardContent>
        </Card>

        {/* Chọn phương án */}
        <Card className="border-foreground/10 shadow-sm">
          <CardHeader className="pb-2 pt-5 px-6">
            <h2 className="font-semibold text-foreground text-sm">Phương án thanh toán <span className="text-danger">*</span></h2>
          </CardHeader>
          <CardContent className="px-6 pb-5 space-y-2">
            {PAYMENT_PLANS.map(plan => (
              <label key={plan.value} className={`flex gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                paymentPlan === plan.value
                  ? 'border-[#5B8E9F] bg-[#5B8E9F]/5'
                  : 'border-foreground/15 hover:border-foreground/30'
              }`}>
                <input
                  type="radio"
                  name="plan"
                  value={plan.value}
                  checked={paymentPlan === plan.value}
                  onChange={e => setPaymentPlan(e.target.value)}
                  className="accent-ink mt-0.5"
                />
                <div>
                  <p className="text-sm font-medium text-foreground">{plan.label}</p>
                  <p className="text-xs text-foreground/50 mt-0.5">{plan.desc}</p>
                </div>
              </label>
            ))}
          </CardContent>
        </Card>

        {/* Summary */}
        {selectedCourse && (
          <div className="bg-ink-soft rounded-card-lg p-5 text-white">
            <h3 className="font-semibold mb-3">Tóm tắt thanh toán</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">Học phí {selectedCourse.name}</span>
                <span>{fmt(selectedCourse.price)}</span>
              </div>
              {paymentPlan === 'C_deposit' && (
                <div className="flex justify-between text-white/60">
                  <span>Cọc 30%</span>
                  <span>{fmt(depositAmount)}</span>
                </div>
              )}
              <div className="border-t border-white/20 pt-2 flex justify-between font-semibold">
                <span>Thu ngay:</span>
                <span className="text-[#C8A84B]">{fmt(firstPayment)}</span>
              </div>
              {paymentPlan === 'C_deposit' && (
                <p className="text-xs text-white/40 mt-1">
                  Còn {fmt(selectedCourse.price - depositAmount)} — đóng trước/tại buổi 2
                </p>
              )}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Button type="button" variant="outline" asChild className="flex-1">
            <Link href={`/admin/students/${studentId}`}>Huỷ</Link>
          </Button>
          <Button
            type="submit"
            disabled={loading || !selectedCourse}
            className="flex-1 bg-ink-soft text-paper hover:bg-foreground/90"
          >
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang đăng ký...</> : 'Xác nhận đăng ký'}
          </Button>
        </div>
      </form>
      </div>
    </div>
  )
}
