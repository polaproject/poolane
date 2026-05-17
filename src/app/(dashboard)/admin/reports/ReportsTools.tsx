'use client'

import { useState } from 'react'
import { Download, ShieldCheck, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'

interface ReconResult {
  date: string
  checkedAt: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  checks: any
  issues: Array<{ severity: string; check: string; detail: string }>
  status: 'ok' | 'warn' | 'critical'
}

function todayStr() { return new Date().toISOString().slice(0, 10) }
function firstOfMonth() {
  const n = new Date()
  return new Date(n.getFullYear(), n.getMonth(), 1).toISOString().slice(0, 10)
}

export function ReportsTools() {
  const [from, setFrom] = useState(firstOfMonth())
  const [to, setTo] = useState(todayStr())
  const [downloading, setDownloading] = useState(false)
  const [reconDate, setReconDate] = useState(todayStr())
  const [recon, setRecon] = useState<ReconResult | null>(null)
  const [reconLoading, setReconLoading] = useState(false)

  async function downloadRevenue() {
    setDownloading(true)
    try {
      const res = await fetch(`/api/reports/revenue?from=${from}&to=${to}`)
      if (!res.ok) throw new Error('Failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `revenue-${from}-to-${to}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Không thể tải file')
    } finally {
      setDownloading(false)
    }
  }

  async function runReconciliation() {
    setReconLoading(true)
    setRecon(null)
    try {
      const res = await fetch(`/api/reports/reconciliation?date=${reconDate}`)
      const json = await res.json()
      if (!res.ok) {
        alert(json.error?.message ?? 'Lỗi')
        return
      }
      setRecon(json.data)
    } catch {
      alert('Không thể kết nối')
    } finally {
      setReconLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Excel export */}
      <div className="glass-card border border-foreground/8 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Download className="w-5 h-5 text-[#5B8E9F]" />
          <h2 className="font-semibold text-foreground">Xuất Excel doanh thu</h2>
        </div>
        <p className="text-xs text-foreground/50 mb-3">File có 3 sheet: Tổng quan, Chi tiết, Theo loại</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs uppercase tracking-wider text-foreground/50 font-semibold mb-1">Từ</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-[var(--surface)]" />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wider text-foreground/50 font-semibold mb-1">Đến</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-[var(--surface)]" />
          </div>
        </div>
        <button onClick={downloadRevenue} disabled={downloading}
          className="w-full bg-ink-soft text-paper rounded-lg py-2.5 text-sm font-semibold hover:bg-foreground/90 disabled:opacity-50">
          {downloading ? <span className="inline-flex items-center"><Loader2 className="w-4 h-4 animate-spin mr-2" />Đang tạo...</span> : '⬇ Tải xuống Excel'}
        </button>
      </div>

      {/* Reconciliation */}
      <div className="glass-card border border-foreground/8 p-5">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-5 h-5 text-[#C8A84B]" />
          <h2 className="font-semibold text-foreground">Đối chiếu dữ liệu</h2>
        </div>
        <p className="text-xs text-foreground/50 mb-3">
          Kiểm tra: tổng thu, sức chứa buổi, vé bơi vs attendance, order đã thanh toán
        </p>
        <div className="flex gap-2 mb-3">
          <input type="date" value={reconDate} onChange={e => setReconDate(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-foreground/20 rounded-lg bg-[var(--surface)]" />
          <button onClick={runReconciliation} disabled={reconLoading}
            className="px-4 py-2 text-sm bg-ink-soft text-paper rounded-lg hover:bg-foreground/90 disabled:opacity-50">
            {reconLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Chạy'}
          </button>
        </div>

        {recon && (
          <div className="mt-4 space-y-2">
            <div className={`rounded-xl border p-3 ${
              recon.status === 'ok' ? 'bg-success/10 border-success/30 text-green-900' :
              recon.status === 'warn' ? 'bg-warn/10 border-warn/30 text-amber-900' :
              'bg-danger/10 border-danger/30 text-red-900'
            }`}>
              <div className="flex items-center gap-2 mb-1">
                {recon.status === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                <p className="font-semibold text-sm">
                  {recon.status === 'ok' ? 'Dữ liệu khớp' : `Phát hiện ${recon.issues.length} vấn đề`}
                </p>
              </div>
              <p className="text-xs">Ngày {recon.date} · checked at {new Date(recon.checkedAt).toLocaleString('vi-VN')}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              <Stat label="GD hôm nay" value={String(recon.checks.payments?.count ?? 0)} />
              <Stat label="Buổi học" value={String(recon.checks.sessions?.count ?? 0)} />
              <Stat label="Đơn shop 7d" value={String(recon.checks.orders?.paidRecent ?? 0)} />
            </div>

            {recon.issues.length > 0 && (
              <div className="bg-paper/40 rounded-xl p-3 space-y-1 max-h-48 overflow-y-auto">
                {recon.issues.map((iss, i) => (
                  <div key={i} className="text-xs">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase mr-1.5 ${
                      iss.severity === 'critical' ? 'bg-red-200 text-red-900' : 'bg-amber-200 text-amber-900'
                    }`}>
                      {iss.severity}
                    </span>
                    <span className="text-foreground/80">{iss.detail}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-paper/40 rounded-lg px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-foreground/50 font-semibold">{label}</p>
      <p className="font-heading text-lg text-foreground">{value}</p>
    </div>
  )
}
