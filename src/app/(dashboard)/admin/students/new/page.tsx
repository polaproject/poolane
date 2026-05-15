'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createStudentSchema, type CreateStudentInput } from '@/lib/validations/student'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/PageHeader'

const GENDER_OPTIONS = [
  { value: 'male', label: 'Nam' },
  { value: 'female', label: 'Nữ' },
  { value: 'other', label: 'Khác' },
]

const MARKETING_SOURCES = [
  'Facebook', 'Instagram', 'TikTok', 'Zalo', 'Bạn bè giới thiệu', 'Google', 'Khác'
]

export default function NewStudentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateStudentInput>({
    // Cast resolver — Zod 4 + RHF type narrow incompatibility (known issue)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createStudentSchema) as any,
    defaultValues: {
      gender: 'male',
      photoConsent: false,
      imageConsentMarketing: false,
      refundPolicyAcknowledged: false,
      termsAcknowledged: false,
    }
  })

  async function onSubmit(data: CreateStudentInput) {
    setLoading(true)
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (!res.ok || result.error) {
        const msg = result.error?.message ?? 'Có lỗi xảy ra'
        toast.error(msg)
        return
      }

      toast.success(`Tạo thành công! Mã: ${result.data.studentCode}`)
      toast.info(`Mật khẩu tạm: ${result.data.tempPassword}`, { duration: 10000 })
      router.push(`/admin/students/${result.data.id}`)

    } catch {
      toast.error('Không thể kết nối máy chủ. Thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ambient-bg min-h-screen">
      <div className="p-6 max-w-2xl mx-auto">
        <Link
          href="/admin/students"
          className="inline-flex items-center gap-1 text-sm text-foreground/70 hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Danh sách học viên
        </Link>
        <PageHeader
          eyebrow="Học viên"
          title="Thêm học viên mới"
          description="Tạo hồ sơ học viên mới và liên kết với khoá học hoặc vé bơi."
          display
          className="mb-8"
        />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

        {/* Thông tin cơ bản */}
        <Card className="border-foreground/10 shadow-sm">
          <CardHeader className="pb-2 pt-5 px-6">
            <h2 className="text-base font-semibold text-foreground">Thông tin cơ bản</h2>
          </CardHeader>
          <CardContent className="px-6 pb-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="fullName">Họ và tên <span className="text-danger">*</span></Label>
                <Input id="fullName" {...register('fullName')} placeholder="Nguyễn Văn A" />
                {errors.fullName && <p className="text-xs text-danger">{errors.fullName.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">Số điện thoại <span className="text-danger">*</span></Label>
                <Input id="phone" {...register('phone')} placeholder="0912 345 678" type="tel" />
                {errors.phone && <p className="text-xs text-danger">{errors.phone.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" {...register('email')} placeholder="example@email.com" type="email" />
                {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dob">Ngày sinh <span className="text-danger">*</span></Label>
                <Input id="dob" {...register('dob')} type="date" />
                {errors.dob && <p className="text-xs text-danger">{errors.dob.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label>Giới tính <span className="text-danger">*</span></Label>
                <div className="flex gap-3 pt-1">
                  {GENDER_OPTIONS.map(g => (
                    <label key={g.value} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" value={g.value} {...register('gender')} className="accent-ink" />
                      <span className="text-sm">{g.label}</span>
                    </label>
                  ))}
                </div>
                {errors.gender && <p className="text-xs text-danger">{errors.gender.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Địa chỉ */}
        <Card className="border-foreground/10 shadow-sm">
          <CardHeader className="pb-2 pt-5 px-6">
            <h2 className="text-base font-semibold text-foreground">Địa chỉ</h2>
          </CardHeader>
          <CardContent className="px-6 pb-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="ward">Phường/Xã <span className="text-danger">*</span></Label>
                <Input id="ward" {...register('ward')} placeholder="Phường Bến Nghé" />
                {errors.ward && <p className="text-xs text-danger">{errors.ward.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="district">Quận/Huyện <span className="text-danger">*</span></Label>
                <Input id="district" {...register('district')} placeholder="Quận 1" />
                {errors.district && <p className="text-xs text-danger">{errors.district.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="province">Tỉnh/Thành phố <span className="text-danger">*</span></Label>
                <Input id="province" {...register('province')} placeholder="TP. Hồ Chí Minh" />
                {errors.province && <p className="text-xs text-danger">{errors.province.message}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="addressStreet">Số nhà, tên đường</Label>
              <Input id="addressStreet" {...register('addressStreet')} placeholder="123 Nguyễn Huệ" />
            </div>
          </CardContent>
        </Card>

        {/* Thông tin bổ sung */}
        <Card className="border-foreground/10 shadow-sm">
          <CardHeader className="pb-2 pt-5 px-6">
            <h2 className="text-base font-semibold text-foreground">Thông tin thêm</h2>
            <p className="text-xs text-foreground/50">Không bắt buộc</p>
          </CardHeader>
          <CardContent className="px-6 pb-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="emergencyContactName">Liên hệ khẩn cấp</Label>
                <Input id="emergencyContactName" {...register('emergencyContactName')} placeholder="Tên người thân" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="emergencyContactPhone">SĐT liên hệ khẩn cấp</Label>
                <Input id="emergencyContactPhone" {...register('emergencyContactPhone')} placeholder="0912 345 678" type="tel" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="occupation">Nghề nghiệp</Label>
                <Input id="occupation" {...register('occupation')} placeholder="Nhân viên văn phòng" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="marketingSource">Biết đến lớp qua</Label>
                <select
                  {...register('marketingSource')}
                  className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">-- Chọn nguồn --</option>
                  {MARKETING_SOURCES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="healthNotes">Ghi chú sức khoẻ</Label>
              <textarea
                {...register('healthNotes')}
                placeholder="Dị ứng, bệnh nền, lưu ý đặc biệt..."
                rows={2}
                className="w-full px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="swimmingExperience">Kinh nghiệm bơi</Label>
              <Input id="swimmingExperience" {...register('swimmingExperience')} placeholder="Chưa biết bơi / Biết bơi ếch cơ bản..." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="learningGoal">Mục tiêu học bơi</Label>
              <Input id="learningGoal" {...register('learningGoal')} placeholder="Bơi được 50m liên tục, giảm stress..." />
            </div>
          </CardContent>
        </Card>

        {/* Đồng ý điều khoản */}
        <Card className="border-foreground/10 shadow-sm">
          <CardHeader className="pb-2 pt-5 px-6">
            <h2 className="text-base font-semibold text-foreground">Xác nhận & Đồng ý</h2>
          </CardHeader>
          <CardContent className="px-6 pb-6 space-y-3">
            {[
              {
                field: 'photoConsent' as const,
                label: 'Đồng ý cho lớp ghi hình kỹ thuật để phục vụ học tập nội bộ',
                required: true
              },
              {
                field: 'refundPolicyAcknowledged' as const,
                label: 'Đã đọc và hiểu chính sách hoàn tiền',
                required: true
              },
              {
                field: 'termsAcknowledged' as const,
                label: 'Đồng ý với điều khoản sử dụng dịch vụ',
                required: true
              },
              {
                field: 'imageConsentMarketing' as const,
                label: 'Đồng ý cho phép sử dụng hình ảnh/video cho mục đích marketing (tuỳ chọn)',
                required: false
              },
            ].map(item => (
              <label key={item.field} className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register(item.field)}
                  className="mt-0.5 accent-ink"
                />
                <span className="text-sm text-foreground/80">
                  {item.label}
                  {item.required && <span className="text-danger ml-1">*</span>}
                </span>
              </label>
            ))}
            {(errors.photoConsent || errors.refundPolicyAcknowledged || errors.termsAcknowledged) && (
              <p className="text-xs text-danger">Vui lòng xác nhận các điều khoản bắt buộc</p>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button type="button" variant="outline" asChild className="flex-1">
            <Link href="/admin/students">Huỷ</Link>
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 bg-ink-soft text-paper hover:bg-foreground/90"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang tạo...</>
            ) : (
              'Tạo học viên'
            )}
          </Button>
        </div>
      </form>
      </div>
    </div>
  )
}
