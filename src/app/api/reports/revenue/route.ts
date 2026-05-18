import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logError } from '@/lib/logger'
import { getDemoStudentIds } from '@/lib/demo-account'
import ExcelJS from 'exceljs'

// ─── GET /api/reports/revenue?from=YYYY-MM-DD&to=YYYY-MM-DD ───
// Trả về file Excel với 3 sheet: Tổng quan / Chi tiết / Theo loại
export async function GET(request: NextRequest) {
  try {
    await requireRole(['admin'])

    const sp = request.nextUrl.searchParams
    const fromStr = sp.get('from')
    const toStr = sp.get('to')

    // Default: tháng hiện tại
    const now = new Date()
    const from = fromStr ? new Date(fromStr) : new Date(now.getFullYear(), now.getMonth(), 1)
    const to = toStr ? new Date(toStr) : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    // Phase 15.2: Exclude demo accounts khỏi revenue report (analytics integrity)
    const demoStudentIds = await getDemoStudentIds(prisma)

    const payments = await prisma.payment.findMany({
      where: {
        recordedAt: { gte: from, lte: to },
        studentId: { notIn: demoStudentIds },
        excludeFromRevenue: false, // exclude carryover/compensation/gift bookings
      },
      orderBy: { recordedAt: 'asc' },
      include: {
        student: { include: { user: { select: { fullName: true, phone: true } } } }
      }
    })

    const wb = new ExcelJS.Workbook()
    wb.creator = 'Poolane'
    wb.created = new Date()

    // Sheet 1: Tổng quan
    const sum = wb.addWorksheet('Tổng quan')
    sum.columns = [
      { header: 'Chỉ số', key: 'label', width: 30 },
      { header: 'Giá trị', key: 'value', width: 20 },
    ]
    const totalIn = payments.filter(p => p.amount > 0).reduce((s, p) => s + p.amount, 0)
    const totalOut = payments.filter(p => p.amount < 0).reduce((s, p) => s + Math.abs(p.amount), 0)
    sum.addRow({ label: 'Khoảng thời gian', value: `${from.toLocaleDateString('vi-VN')} → ${to.toLocaleDateString('vi-VN')}` })
    sum.addRow({ label: 'Tổng số giao dịch', value: payments.length })
    sum.addRow({ label: 'Tổng thu', value: totalIn })
    sum.addRow({ label: 'Tổng hoàn', value: totalOut })
    sum.addRow({ label: 'Doanh thu net', value: totalIn - totalOut })
    sum.getRow(1).font = { bold: true }
    sum.getColumn('value').numFmt = '#,##0'

    // Sheet 2: Chi tiết
    const detail = wb.addWorksheet('Chi tiết')
    detail.columns = [
      { header: 'Ngày', key: 'date', width: 18 },
      { header: 'Học viên', key: 'student', width: 28 },
      { header: 'SĐT', key: 'phone', width: 14 },
      { header: 'Loại', key: 'type', width: 14 },
      { header: 'Số tiền', key: 'amount', width: 14 },
      { header: 'Phương thức', key: 'method', width: 16 },
      { header: 'Mã GD', key: 'ref', width: 20 },
      { header: 'Ghi chú', key: 'notes', width: 30 },
    ]
    for (const p of payments) {
      detail.addRow({
        date: p.recordedAt.toLocaleString('vi-VN'),
        student: p.student.user.fullName,
        phone: p.student.user.phone ?? '',
        type: p.type,
        amount: p.amount,
        method: p.paymentMethod,
        ref: p.referenceNumber ?? '',
        notes: p.notes ?? '',
      })
    }
    detail.getRow(1).font = { bold: true }
    detail.getColumn('amount').numFmt = '#,##0'

    // Sheet 3: Theo loại
    const byType = wb.addWorksheet('Theo loại')
    byType.columns = [
      { header: 'Loại', key: 'type', width: 20 },
      { header: 'Số GD', key: 'count', width: 12 },
      { header: 'Tổng tiền', key: 'total', width: 18 },
    ]
    const typeGroups = new Map<string, { count: number; total: number }>()
    for (const p of payments) {
      const g = typeGroups.get(p.type) ?? { count: 0, total: 0 }
      g.count++
      g.total += p.amount
      typeGroups.set(p.type, g)
    }
    for (const [t, g] of typeGroups.entries()) {
      byType.addRow({ type: t, count: g.count, total: g.total })
    }
    byType.getRow(1).font = { bold: true }
    byType.getColumn('total').numFmt = '#,##0'

    const buf = await wb.xlsx.writeBuffer()
    const filename = `revenue-${from.toISOString().slice(0, 10)}-to-${to.toISOString().slice(0, 10)}.xlsx`

    return new NextResponse(buf as ArrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      }
    })

  } catch (error) {
    await logError({ context: 'reports.revenue', message: 'Failed', error })
    return NextResponse.json({ data: null, error: { code: 'INTERNAL_ERROR', message: 'Có lỗi xảy ra' } }, { status: 500 })
  }
}
