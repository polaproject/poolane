import { prisma } from './prisma'

export type DebtItem = {
  enrollmentId: string
  courseName: string
  courseCode: string
  coursePrice: number
  totalPaid: number
  debt: number
  deadline: Date | null
}

/**
 * Liệt kê khoản học phí chưa đóng đủ của 1 học viên.
 * Chỉ tính enrollment đang active hoặc extension; debt = course.price - totalPaid.
 */
export async function getStudentDebt(studentId: string): Promise<DebtItem[]> {
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId, status: { in: ['active', 'extension'] } },
    include: { course: { select: { name: true, code: true, price: true } } },
  })

  return enrollments
    .map(e => ({
      enrollmentId: e.id,
      courseName: e.course.name,
      courseCode: e.course.code,
      coursePrice: e.course.price,
      totalPaid: e.totalPaid,
      debt: e.course.price - e.totalPaid,
      deadline: e.paymentDeadline,
    }))
    .filter(item => item.debt > 0)
}
