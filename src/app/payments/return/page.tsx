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
  const iconColor = gtStatus === 'success' ? 'text-green-600' : gtStatus === 'pending' ? 'text-amber-600' : 'text-red-600'
  const iconBg = gtStatus === 'success' ? 'bg-green-50' : gtStatus === 'pending' ? 'bg-amber-50' : 'bg-red-50'

  return (
    <div className="min-h-screen bg-[#F6F1EA] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center">
        <div className={`w-20 h-20 rounded-full ${iconBg} flex items-center justify-center mx-auto mb-4`}>
          <Icon className={`w-10 h-10 ${iconColor}`} />
        </div>

        <h1 className="font-heading text-2xl text-[#1C2B4A] mb-2">
          {TITLES[gtStatus]}
        </h1>

        {amount && (
          <p className="font-heading text-3xl text-[#1C2B4A] mb-2">
            {amount.toLocaleString('vi-VN')}đ
          </p>
        )}

        {orderInfo && (
          <p className="text-sm text-[#1C2B4A]/60 mb-4">{orderInfo}</p>
        )}

        {params.transId && gtStatus === 'success' && (
          <p className="text-xs text-[#1C2B4A]/40 mb-4">
            Mã giao dịch: <code className="bg-[#1C2B4A]/8 px-2 py-0.5 rounded">{params.transId}</code>
          </p>
        )}

        {gtStatus === 'pending' && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4">
            Hệ thống đang xử lý. Bạn có thể refresh trang sau vài giây để kiểm tra.
          </p>
        )}

        {gtStatus === 'failed' && params.message && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
            {params.message}
          </p>
        )}

        <div className="flex flex-col gap-2 mt-6">
          <Link href="/student/payments"
            className="inline-flex items-center justify-center px-4 py-3 bg-[#1C2B4A] text-[#F6F1EA] rounded-lg text-sm font-semibold hover:bg-[#1C2B4A]/90">
            Xem lịch sử thanh toán
          </Link>
          <Link href="/student/dashboard"
            className="inline-flex items-center justify-center px-4 py-3 border border-[#1C2B4A]/15 text-[#1C2B4A]/70 rounded-lg text-sm font-semibold hover:bg-[#1C2B4A]/5">
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  )
}
