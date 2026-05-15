import Link from 'next/link'
import { PageHeader } from '@/components/ui/PageHeader'
import { ShieldCheck, Mail } from 'lucide-react'

export const metadata = {
  title: 'Chính sách bảo mật · Poolane',
  description: 'Cam kết bảo vệ dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP',
}

const SECTIONS = [
  {
    num: '01',
    title: 'Dữ liệu chúng tôi thu thập',
    items: [
      'Họ tên, ngày sinh, giới tính',
      'Số điện thoại, email (nếu có)',
      'Địa chỉ (phường/quận/tỉnh)',
      'Thông tin sức khoẻ (chỉ phần học viên tự cung cấp)',
      'Hình ảnh/video kỹ thuật bơi (với sự đồng ý)',
      'Lịch sử học tập, thanh toán',
    ],
  },
  {
    num: '02',
    title: 'Mục đích sử dụng',
    items: [
      'Quản lý lớp học, theo dõi tiến độ học viên',
      'Liên hệ thông báo về lịch học, thay đổi lịch',
      'Ghi nhận thanh toán và xuất biên lai',
      'Cải thiện chất lượng giảng dạy',
      'Marketing (chỉ khi học viên đồng ý riêng)',
    ],
  },
  {
    num: '03',
    title: 'Quyền của học viên',
    intro: 'Theo Nghị định 13/2023, học viên có các quyền sau:',
    items: [
      { bold: 'Quyền truy cập:', text: 'Xem toàn bộ dữ liệu cá nhân tại trang Hồ sơ' },
      { bold: 'Quyền chỉnh sửa:', text: 'Tự sửa thông tin mềm, yêu cầu sửa thông tin định danh' },
      { bold: 'Quyền xoá:', text: 'Yêu cầu xoá tài khoản và dữ liệu (qua admin)' },
      { bold: 'Quyền rút lại đồng ý:', text: 'Rút đồng ý sử dụng hình ảnh bất cứ lúc nào' },
      { bold: 'Quyền khiếu nại:', text: 'Gửi khiếu nại đến chúng tôi qua email' },
    ],
  },
  {
    num: '04',
    title: 'Bảo mật dữ liệu',
    items: [
      'Dữ liệu lưu trữ trên hạ tầng Supabase (mã hoá at-rest)',
      'Mật khẩu mã hoá bcrypt, không lưu plain text',
      'Số CCCD/CMND mã hoá ở cấp database',
      'Truy cập có phân quyền (admin/staff/student)',
      'Audit log mọi thao tác thay đổi dữ liệu quan trọng',
    ],
  },
  {
    num: '05',
    title: 'Chia sẻ dữ liệu',
    intro: 'Chúng tôi KHÔNG bán hoặc chia sẻ dữ liệu cá nhân của học viên với bên thứ ba, ngoại trừ:',
    items: [
      'Nhà cung cấp dịch vụ kỹ thuật (Supabase, Vercel, Resend) với cam kết bảo mật',
      'Cơ quan có thẩm quyền theo yêu cầu pháp luật',
    ],
  },
  {
    num: '06',
    title: 'Lưu trữ và xoá dữ liệu',
    body: 'Dữ liệu của học viên không hoạt động trên 2 năm sẽ được archive hoặc xoá theo yêu cầu. Học viên đã yêu cầu xoá sẽ được xử lý trong vòng 30 ngày.',
  },
] as const

export default function PrivacyPage() {
  const updated = new Date().toLocaleDateString('vi-VN')

  return (
    <>
      <section className="mx-auto max-w-3xl px-4 pt-16 pb-10">
        <PageHeader
          eyebrow={`Cập nhật ${updated}`}
          title="Chính sách bảo mật"
          display
          description="Poolane cam kết bảo vệ dữ liệu cá nhân của học viên theo Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân của Chính phủ Việt Nam."
        />
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-16 space-y-5">
        {SECTIONS.map((s) => (
          <article
            key={s.num}
            className="rounded-card-xl bg-current/5 ring-1 ring-current/10 p-6 sm:p-8 backdrop-blur-sm"
          >
            <div className="flex items-start gap-4 mb-4">
              <span className="lqg-headline text-3xl text-accent leading-none shrink-0">{s.num}</span>
              <h2 className="font-heading text-2xl sm:text-3xl italic leading-tight">{s.title}</h2>
            </div>
            <div className="ml-0 sm:ml-12 space-y-3">
              {('intro' in s && s.intro) && <p className="text-sm sm:text-base opacity-80">{s.intro}</p>}
              {('body' in s && s.body) && <p className="text-sm sm:text-base opacity-80 leading-relaxed">{s.body}</p>}
              {('items' in s && s.items) && (
                <ul className="space-y-2">
                  {s.items.map((item, i) => {
                    if (typeof item === 'string') {
                      return (
                        <li key={i} className="text-sm sm:text-base opacity-80 flex items-start gap-2.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-accent mt-2.5 shrink-0" />
                          <span>{item}</span>
                        </li>
                      )
                    }
                    return (
                      <li key={i} className="text-sm sm:text-base opacity-85 flex items-start gap-2.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-accent mt-2.5 shrink-0" />
                        <span><strong className="opacity-100">{item.bold}</strong> {item.text}</span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </article>
        ))}

        {/* Section 07 — Contact */}
        <article className="rounded-card-xl bg-ink text-paper p-6 sm:p-8 shadow-glass relative overflow-hidden">
<div className="relative flex items-start gap-4 mb-4">
            <span className="lqg-headline text-3xl text-accent leading-none shrink-0">07</span>
            <h2 className="font-heading text-2xl sm:text-3xl italic leading-tight">Liên hệ</h2>
          </div>
          <div className="relative ml-0 sm:ml-12 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="grid place-items-center h-12 w-12 rounded-pill bg-accent/20 shrink-0">
              <Mail className="h-5 w-5 text-accent" strokeWidth={1.75} />
            </div>
            <div className="flex-1">
              <p className="text-sm text-paper/75 mb-1.5">Mọi thắc mắc về chính sách bảo mật:</p>
              <Link
                href="mailto:support@poolane.vn"
                className="lqg-headline text-xl text-accent hover:underline"
              >
                support@poolane.vn
              </Link>
            </div>
          </div>
        </article>
      </section>

      {/* Footer commitment */}
      <section className="mx-auto max-w-3xl px-4 pb-20">
        <div className="rounded-card-lg bg-current/5 ring-1 ring-current/10 p-5 flex items-center gap-3 backdrop-blur-sm">
          <ShieldCheck className="h-5 w-5 text-success shrink-0" strokeWidth={1.75} />
          <p className="text-sm opacity-80">
            Poolane tuân thủ <strong>Nghị định 13/2023/NĐ-CP</strong> về bảo vệ dữ liệu cá nhân. Học viên có quyền yêu cầu trích xuất, chỉnh sửa, hoặc xoá dữ liệu bất cứ lúc nào.
          </p>
        </div>
      </section>
    </>
  )
}
