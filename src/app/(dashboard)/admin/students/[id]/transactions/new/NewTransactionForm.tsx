'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import { Loader2, Wallet, Ticket, AlertCircle, CheckCircle2 } from 'lucide-react'

interface Props {
  studentId: string
}

const TYPE_OPTIONS = [
  { value: 'course_fee', label: 'Học phí' },
  { value: 'pool_ticket', label: 'Vé bơi' },
  { value: 'shop', label: 'Mua hàng' },
  { value: 'refund', label: 'Hoàn tiền (manual)' },
  { value: 'adjustment', label: 'Điều chỉnh (compensation/gift)' },
] as const

const METHOD_OPTIONS = [
  { value: 'cash', label: 'Tiền mặt' },
  { value: 'bank_transfer', label: 'Chuyển khoản' },
  { value: 'card', label: 'Thẻ' },
  { value: 'other', label: 'Khác' },
] as const

const TICKET_TYPE_OPTIONS = [
  { value: 'first', label: 'Vé lần đầu' },
  { value: 'subsequent', label: 'Vé tiếp theo' },
  { value: 'single', label: 'Vé lẻ' },
  { value: 'weekly', label: 'Vé tuần' },
  { value: 'daily', label: 'Vé ngày' },
  { value: 'monthly', label: 'Vé tháng' },
] as const

function fmt(n: number) {
  const sign = n < 0 ? '-' : ''
  return sign + Math.abs(n).toLocaleString('vi-VN') + 'đ'
}

export function NewTransactionForm({ studentId }: Props) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [notes, setNotes] = useState('')

  // Payment section state
  const [paymentEnabled, setPaymentEnabled] = useState(false)
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<typeof TYPE_OPTIONS[number]['value']>('pool_ticket')
  const [paymentMethod, setPaymentMethod] =
    useState<typeof METHOD_OPTIONS[number]['value']>('cash')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [excludeFromRevenue, setExcludeFromRevenue] = useState(false)

  // PoolTicket section state
  const [ticketEnabled, setTicketEnabled] = useState(false)
  const [ticketType, setTicketType] =
    useState<typeof TICKET_TYPE_OPTIONS[number]['value']>('subsequent')
  const [totalSessions, setTotalSessions] = useState('10')
  const [sessionsUsedInitial, setSessionsUsedInitial] = useState('0')
  const [pricePaidTicket, setPricePaidTicket] = useState('0')
  const [isCarryover, setIsCarryover] = useState(false)

  const amountNum = Number(amount) || 0
  const totalSessionsNum = Number(totalSessions) || 0
  const sessionsUsedNum = Number(sessionsUsedInitial) || 0

  const summary = useMemo(() => {
    const items: string[] = []
    if (paymentEnabled) {
      const rev = excludeFromRevenue
        ? 'KHÔNG đổi doanh thu (loại trừ)'
        : amountNum > 0
          ? `Doanh thu TĂNG ${fmt(amountNum)}`
          : amountNum < 0
            ? `Doanh thu GIẢM ${fmt(Math.abs(amountNum))}`
            : 'Không đổi (amount = 0)'
      items.push(`Tạo Payment ${fmt(amountNum)} (${type}, ${paymentMethod}) — ${rev}`)
    }
    if (ticketEnabled) {
      const remaining = totalSessionsNum - sessionsUsedNum
      items.push(
        `Tạo vé ${ticketType} · ${totalSessionsNum} buổi (đã dùng ${sessionsUsedNum}, còn ${remaining})${isCarryover ? ' · carryover' : ''}`,
      )
    }
    if (!paymentEnabled && !ticketEnabled) items.push('Chưa chọn gì — phải bật ít nhất 1 mục')
    return items
  }, [paymentEnabled, ticketEnabled, amountNum, excludeFromRevenue, type, paymentMethod, ticketType, totalSessionsNum, sessionsUsedNum, isCarryover])

  const canSubmit =
    notes.trim().length >= 3 &&
    (paymentEnabled || ticketEnabled) &&
    (!paymentEnabled || amountNum !== 0) &&
    (!ticketEnabled || (sessionsUsedNum <= totalSessionsNum && totalSessionsNum >= 1))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) {
      toast.error('Vui lòng kiểm tra lại form')
      return
    }
    setSubmitting(true)
    try {
      const body: Record<string, unknown> = {
        studentId,
        notes: notes.trim(),
      }
      if (paymentEnabled) {
        body.payment = {
          enabled: true,
          amount: amountNum,
          type,
          paymentMethod,
          referenceNumber: referenceNumber.trim() || undefined,
          excludeFromRevenue,
        }
      }
      if (ticketEnabled) {
        body.poolTicket = {
          enabled: true,
          ticketType,
          totalSessions: totalSessionsNum,
          sessionsUsedInitial: sessionsUsedNum,
          pricePaid: Number(pricePaidTicket) || 0,
          isCarryover,
        }
      }

      const res = await fetch('/api/admin/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()

      if (!res.ok || data.error) {
        toast.error(data.error?.message ?? 'Không thể tạo giao dịch')
        return
      }

      toast.success('Đã tạo giao dịch thành công!')
      router.push(`/admin/students/${studentId}/transactions`)
    } catch {
      toast.error('Không thể kết nối')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* SECTION A — Thông tin chung */}
      <Card title="Thông tin chung" icon="info">
        <label className="block text-sm font-medium text-foreground mb-1">
          Lý do tạo giao dịch <span className="text-danger">*</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Vd: HV claim đã trả 500k tiền mặt khi mua vé tháng trước"
          className="w-full px-3 py-2 rounded-lg border border-foreground/15 text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
          required
        />
        <p className="text-[11px] text-foreground/55 mt-1">
          Tối thiểu 3 ký tự. Sẽ lưu vào audit log.
        </p>
      </Card>

      {/* SECTION B — Toggle Payment */}
      <ToggleSection
        title="Ghi nhận Payment vào sổ"
        description="Tạo bản ghi Payment cho HV (dùng cho tiền mặt retroactive, compensation, fix lỗi nhập...)"
        icon={<Wallet className="h-4 w-4" />}
        enabled={paymentEnabled}
        onToggle={setPaymentEnabled}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Loại giao dịch">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as typeof type)}
              className="w-full px-3 py-2 rounded-lg border border-foreground/15 text-sm bg-[var(--surface)]"
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Phương thức">
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
              className="w-full px-3 py-2 rounded-lg border border-foreground/15 text-sm bg-[var(--surface)]"
            >
              {METHOD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Số tiền (VND, âm = đảo/refund)" hint={amountNum ? fmt(amountNum) : ' '}>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Vd: 500000 hoặc -130000"
              className="w-full px-3 py-2 rounded-lg border border-foreground/15 text-sm"
            />
          </Field>
          <Field label="Số tham chiếu (tuỳ chọn)">
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="Vd: TX12345"
              maxLength={100}
              className="w-full px-3 py-2 rounded-lg border border-foreground/15 text-sm"
            />
          </Field>
        </div>
        <Checkbox
          checked={excludeFromRevenue}
          onChange={setExcludeFromRevenue}
          label="Loại trừ khỏi doanh thu báo cáo"
          hint="Bật cho compensation, gift, fix kế toán — Payment vẫn được tạo nhưng KHÔNG cộng vào doanh thu."
        />
      </ToggleSection>

      {/* SECTION C — Toggle PoolTicket */}
      <ToggleSection
        title="Tạo vé bơi cho HV"
        description="Tạo PoolTicket — HV dùng được ngay để đăng ký buổi học."
        icon={<Ticket className="h-4 w-4" />}
        enabled={ticketEnabled}
        onToggle={setTicketEnabled}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Loại vé">
            <select
              value={ticketType}
              onChange={(e) => setTicketType(e.target.value as typeof ticketType)}
              className="w-full px-3 py-2 rounded-lg border border-foreground/15 text-sm bg-[var(--surface)]"
            >
              {TICKET_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Tổng số buổi">
            <input
              type="number"
              value={totalSessions}
              onChange={(e) => setTotalSessions(e.target.value)}
              min={1}
              max={30}
              className="w-full px-3 py-2 rounded-lg border border-foreground/15 text-sm"
            />
          </Field>
          <Field
            label="Đã dùng từ trước"
            hint={`Còn lại: ${Math.max(0, totalSessionsNum - sessionsUsedNum)}`}
          >
            <input
              type="number"
              value={sessionsUsedInitial}
              onChange={(e) => setSessionsUsedInitial(e.target.value)}
              min={0}
              max={totalSessionsNum}
              className="w-full px-3 py-2 rounded-lg border border-foreground/15 text-sm"
            />
          </Field>
          <Field label="Giá vé (tham chiếu refund, có thể 0)">
            <input
              type="number"
              value={pricePaidTicket}
              onChange={(e) => setPricePaidTicket(e.target.value)}
              min={0}
              placeholder="0"
              className="w-full px-3 py-2 rounded-lg border border-foreground/15 text-sm"
            />
          </Field>
        </div>
        <Checkbox
          checked={isCarryover}
          onChange={setIsCarryover}
          label="Vé chuyển từ trước / vé cũ (carryover)"
          hint="Bật cho HV cũ đã có vé từ trước hệ thống. Sẽ đánh dấu badge 'carryover' trong list."
        />
      </ToggleSection>

      {/* Summary preview */}
      <div
        className={`rounded-card-lg p-4 ring-1 ${
          paymentEnabled || ticketEnabled
            ? 'bg-mist/8 ring-mist/25'
            : 'bg-warn/8 ring-warn/30'
        }`}
      >
        <div className="flex items-start gap-2 mb-2">
          {paymentEnabled || ticketEnabled ? (
            <CheckCircle2 className="h-4 w-4 text-mist mt-0.5" strokeWidth={1.75} />
          ) : (
            <AlertCircle className="h-4 w-4 text-warn mt-0.5" strokeWidth={1.75} />
          )}
          <p className="text-sm font-semibold text-foreground">Tóm tắt thao tác</p>
        </div>
        <ul className="text-sm text-foreground/80 space-y-1 list-disc list-inside leading-relaxed">
          {summary.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </div>

      <div className="flex gap-3 pt-2">
        <Link
          href={`/admin/students/${studentId}/transactions`}
          className="px-4 h-10 inline-flex items-center text-sm font-medium rounded-pill ring-1 ring-foreground/15 hover:bg-foreground/5 transition"
        >
          Huỷ
        </Link>
        <button
          type="submit"
          disabled={!canSubmit || submitting}
          className="flex-1 bg-accent text-ink rounded-pill h-10 text-sm font-semibold hover:scale-[1.01] active:scale-[0.99] transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
        >
          {submitting ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Đang tạo...</>
          ) : (
            'Tạo giao dịch'
          )}
        </button>
      </div>
    </form>
  )
}

// ──────────────────────────────────────────────────────────
// Helper components

function Card({ title, icon, children }: { title: string; icon?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-card-lg bg-[var(--surface)] ring-1 ring-foreground/8 p-5">
      <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
        {icon} {title}
      </h2>
      {children}
    </div>
  )
}

function ToggleSection({
  title, description, icon, enabled, onToggle, children,
}: {
  title: string
  description: string
  icon: React.ReactNode
  enabled: boolean
  onToggle: (v: boolean) => void
  children: React.ReactNode
}) {
  return (
    <div className="rounded-card-lg bg-[var(--surface)] ring-1 ring-foreground/8 overflow-hidden">
      <button
        type="button"
        onClick={() => onToggle(!enabled)}
        className="w-full flex items-start gap-3 p-5 text-left hover:bg-foreground/3 transition"
      >
        <div className={`h-5 w-9 rounded-full flex items-center transition-all shrink-0 mt-0.5 ${enabled ? 'bg-accent' : 'bg-foreground/20'}`}>
          <div
            className={`h-4 w-4 rounded-full bg-paper shadow transition-transform ${enabled ? 'translate-x-[18px]' : 'translate-x-0.5'}`}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground flex items-center gap-2">
            {icon} {title}
          </p>
          <p className="text-xs text-foreground/60 mt-0.5 leading-relaxed">{description}</p>
        </div>
      </button>
      {enabled && (
        <div className="px-5 pb-5 space-y-3 border-t border-foreground/8 pt-4">
          {children}
        </div>
      )}
    </div>
  )
}

function Field({
  label, hint, children,
}: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-foreground/80 mb-1">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-foreground/55 mt-0.5">{hint}</p>}
    </div>
  )
}

function Checkbox({
  checked, onChange, label, hint,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  hint?: string
}) {
  return (
    <label className="flex items-start gap-2.5 cursor-pointer pt-1">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 accent-accent shrink-0"
      />
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {hint && <p className="text-[11px] text-foreground/60 mt-0.5 leading-relaxed">{hint}</p>}
      </div>
    </label>
  )
}
