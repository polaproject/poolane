import { requireRole } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  Pencil, Send, AlertCircle, CheckCircle2, Bell, ShieldCheck,
  User as UserIcon, Heart, Settings, Lock,
} from 'lucide-react'
import { notFound } from 'next/navigation'
import { PushSubscribeButton } from '@/components/features/PushSubscribeButton'
import { AvatarUploader } from '@/components/features/AvatarUploader'
import { ChangePasswordDialog } from '@/components/features/ChangePasswordDialog'
import { Chip } from '@/components/ui/Chip'

export default async function StudentProfilePage() {
  const user = await requireRole(['student'])

  const student = await prisma.student.findFirst({
    where: { userId: user.id },
    include: {
      user: true,
      enrollments: {
        where: { status: { in: ['active', 'extension'] } },
        include: { course: { select: { code: true, name: true } } },
      },
      poolTickets: {
        where: { isActive: true },
        select: { sessionsUsed: true, maxSessions: true },
        orderBy: { purchasedAt: 'desc' },
        take: 1,
      },
    },
  })

  if (!student) notFound()

  const pendingRequest = await prisma.profileChangeRequest.findFirst({
    where: { studentId: student.id, status: 'pending' },
    orderBy: { requestedAt: 'desc' },
  })

  const u = student.user
  const ticket = student.poolTickets[0]
  const initial = u.fullName?.charAt(0).toUpperCase() ?? '?'

  return (
    <div className="min-h-screen bg-paper pb-12">
      {/* Hero */}
      <div className="hero-block px-5 sm:px-8 pt-8 pb-12 relative overflow-hidden">

<div className="relative max-w-3xl mx-auto flex items-start gap-5">
          <AvatarUploader currentAvatarUrl={u.avatarUrl} fullName={u.fullName} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="eyebrow text-paper/55 mb-1 font-mono normal-case tracking-[0.2em]">{student.studentCode}</p>
            <h1 className="font-heading text-3xl sm:text-4xl italic leading-tight truncate">{u.fullName}</h1>
            <div className="flex flex-wrap gap-2 mt-3 text-xs text-paper/65">
              <span>{u.phone}</span>
              {ticket && (
                <><span>·</span><span>Vé còn {ticket.maxSessions - ticket.sessionsUsed} buổi</span></>
              )}
              {student.enrollments.length > 0 && (
                <><span>·</span><span>{student.enrollments.length} khoá đang học</span></>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-8 -mt-6 max-w-3xl mx-auto space-y-4 relative z-10">
        {/* Pending banner */}
        {pendingRequest && (
          <div className="rounded-card-lg bg-warn/10 ring-1 ring-warn/30 p-4 flex items-start gap-3 backdrop-blur-sm">
            <div className="grid place-items-center h-9 w-9 rounded-pill bg-warn/20 shrink-0">
              <AlertCircle className="h-4 w-4 text-warn" strokeWidth={1.75} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Có 1 yêu cầu cập nhật đang chờ duyệt</p>
              <p className="text-xs text-foreground/65 mt-0.5">
                Gửi lúc {format(pendingRequest.requestedAt, 'dd/MM/yyyy HH:mm')} — chờ staff/admin xử lý
              </p>
            </div>
          </div>
        )}

        {/* Identity */}
        <Section
          eyebrow="Định danh"
          title="Thông tin định danh"
          icon={UserIcon}
          action={!pendingRequest && (
            <Link
              href="/student/profile/request-change"
              className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
            >
              <Send className="h-3.5 w-3.5" strokeWidth={1.75} /> Yêu cầu cập nhật
            </Link>
          )}
          footnote="Các trường định danh cần staff/admin duyệt khi cập nhật để đảm bảo chính xác."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Họ và tên" value={u.fullName} />
            <Field label="Ngày sinh" value={u.dob ? format(u.dob, 'dd/MM/yyyy') : null} />
            <Field label="Số điện thoại" value={u.phone} />
            <Field label="Email" value={u.email} />
            <Field label="Phường/Xã" value={u.ward} />
            <Field label="Quận/Huyện" value={u.district} />
            <Field label="Tỉnh/Thành" value={u.province} />
            <Field label="Địa chỉ chi tiết" value={u.addressStreet} />
            <Field label="Số CCCD/CMND" value={u.idCardNumber} />
          </div>
        </Section>

        {/* Soft fields */}
        <Section
          eyebrow="Cá nhân"
          title="Thông tin mềm"
          icon={Heart}
          action={
            <Link
              href="/student/profile/edit-soft"
              className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
            >
              <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} /> Tự sửa
            </Link>
          }
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nghề nghiệp" value={u.occupation} />
            <Field label="Ghi chú sức khoẻ" value={u.healthNotes} />
            <Field label="Liên hệ khẩn — Tên" value={u.emergencyContactName} />
            <Field label="Liên hệ khẩn — SĐT" value={u.emergencyContactPhone} />
          </div>
        </Section>

        {/* Account & Security — chỉ Password (avatar nay nằm ở hero) */}
        <Section eyebrow="Tài khoản" title="Tài khoản & Bảo mật" icon={Settings}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-sm font-medium text-foreground">Mật khẩu</p>
              <p className="text-xs text-foreground/55 mt-0.5">Đổi mật khẩu đăng nhập của bạn</p>
            </div>
            <ChangePasswordDialog
              trigger={
                <button className="inline-flex items-center gap-1.5 px-4 h-10 rounded-pill ring-1 ring-foreground/15 hover:bg-foreground/5 transition text-sm cursor-pointer">
                  <Lock className="h-4 w-4" strokeWidth={1.75} /> Đổi mật khẩu
                </button>
              }
            />
          </div>
        </Section>

        {/* Consents */}
        <Section eyebrow="Bảo mật" title="Đồng ý & Bảo mật" icon={ShieldCheck}>
          <div className="space-y-2.5">
            <ConsentRow label="Đồng ý hình ảnh học tập nội bộ" at={u.photoConsentAt} />
            <ConsentRow label="Đồng ý hình ảnh dùng cho marketing" at={u.imageConsentMarketingAt} />
            <ConsentRow label="Đã đọc chính sách hoàn tiền" at={u.refundPolicyAcknowledgedAt} />
            <ConsentRow label="Đã đọc điều khoản sử dụng" at={u.termsAcknowledgedAt} />
            <div className="pt-3 mt-3 border-t border-foreground/8 flex items-center justify-between gap-3">
              <span className="text-sm text-foreground/75 inline-flex items-center gap-2">
                <Bell className="h-4 w-4 text-accent" strokeWidth={1.75} /> Thông báo đẩy trình duyệt
              </span>
              <PushSubscribeButton />
            </div>
          </div>
        </Section>
      </div>
    </div>
  )
}

function Section({
  eyebrow, title, icon: Icon, action, footnote, children,
}: {
  eyebrow: string
  title: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  action?: React.ReactNode
  footnote?: string
  children: React.ReactNode
}) {
  return (
    <section className="glass-card glass-card-hover overflow-hidden">
      <header className="px-5 py-4 border-b border-foreground/8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-accent" strokeWidth={1.75} />
          <div>
            <p className="eyebrow text-foreground/55">{eyebrow}</p>
            <h2 className="lqg-headline text-lg text-foreground mt-0.5">{title}</h2>
          </div>
        </div>
        {action}
      </header>
      <div className="px-5 py-4 text-sm">{children}</div>
      {footnote && (
        <p className="px-5 pb-4 text-xs text-foreground/45">{footnote}</p>
      )}
    </section>
  )
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-foreground/45 mb-1">{label}</p>
      <p className="text-foreground">{value || <span className="text-foreground/30">—</span>}</p>
    </div>
  )
}

function ConsentRow({ label, at }: { label: string; at: Date | null }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-foreground/80">{label}</span>
      {at ? (
        <Chip variant="success" active className="text-[10px]">
          <CheckCircle2 className="h-3 w-3" strokeWidth={2.25} />
          {format(at, 'dd/MM/yyyy')}
        </Chip>
      ) : (
        <span className="text-xs text-foreground/35">Chưa xác nhận</span>
      )}
    </div>
  )
}
