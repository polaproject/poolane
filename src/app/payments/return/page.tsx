import Link from 'next/link'
import { CheckCircle2, XCircle, Clock } from 'lucide-react'
import { prisma } from '@/lib/prisma'

type SearchParams = Promise<{
  orderId?: string
  requestId?: string
  resultCode?: string
  message?: string
  transId?: string
  amount?: string
}>

const TITLES: Record<string, string> = {
  success: 'Thanh toán thành công',
  failed: 'Thanh toán thất bại',
  pending: 'Đang xử lý',
}

export default async function MoMoReturnPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const resultCode = params.resultCode
  const requestId = params.requestId

  // resultCode=0 = success, other = failed/cancelled
  const userSawSuccess = resultCode === '0'

  // Cross-check với DB (webhook có thể đã update)
  let gtStatus = userSawSuccess ? 'success' : 'failed'
  let amount: number | null = null
  let orderInfo: string | null = null

  if (requestId) {
    const gt = await prisma.gatewayTransaction.findUnique({ where: { requestId } })
    if (gt) {
      gtStatus = gt.status
      amount = gt.amount
      orderInfo = gt.orderInfo
    }
  }

  const Icon = gtStatus === 'success' ? CheckCircle2 : gtStatus === 'pending' ? Clock : XCircle
  const iconColor = gtStatus === 'success' ? 'text-success' : gtStatus === 'pending' ? 'text-warn' : 'text-danger'
  const iconBg = gtStatus === 'success' ? 'bg-success/10' : gtStatus === 'pending' ? 'bg-warn/10' : 'bg-danger/10'

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center p-4">
      <div className="glass-card shadow-lg max-w-md w-full p-8 text-center">
        <div className={`w-20 h-20 rounded-full ${iconBg} flex items-center justify-center mx-auto mb-4`}>
          <Icon className={`w-10 h-10 ${iconColor}`} />
        </div>

        <h1 className="font-heading text-2xl text-foreground mb-2">
          {TITLES[gtStatus]}
        </h1>

        {amount && (
          <p className="font-heading text-3xl text-foreground mb-2">
            {amount.toLocaleString('vi-VN')}đ
          </p>
        )}

        {orderInfo && (
          <p className="text-sm text-foreground/60 mb-4">{orderInfo}</p>
        )}

        {params.transId && gtStatus === 'success' && (
          <p className="text-xs text-foreground/40 mb-4">
            Mã giao dịch: <code className="bg-ink/8 px-2 py-0.5 rounded">{params.transId}</code>
          </p>
        )}

        {gtStatus === 'pending' && (
          <p className="text-sm text-warn bg-warn/10 border border-warn/30 rounded-lg px-4 py-3 mb-4">
            Hệ thống đang xử lý. Bạn có thể refresh trang sau vài giây để kiểm tra.
          </p>
        )}

        {gtStatus === 'failed' && params.message && (
          <p className="text-sm text-danger bg-danger/10 border border-danger/30 rounded-lg px-4 py-3 mb-4">
            {params.message}
          </p>
        )}

        <div className="flex flex-col gap-2 mt-6">
          <Link href="/student/payments"
            className="inline-flex items-center justify-center px-4 py-3 bg-ink-soft text-paper rounded-lg text-sm font-semibold hover:bg-foreground/90">
            Xem lịch sử thanh toán
          </Link>
          <Link href="/student/dashboard"
            className="inline-flex items-center justify-center px-4 py-3 border border-foreground/15 text-foreground/70 rounded-lg text-sm font-semibold hover:bg-foreground/5">
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  )
}
