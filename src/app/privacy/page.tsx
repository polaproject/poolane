import { PublicHeader, PublicFooter } from '@/components/layouts/PublicHeader'

export const metadata = {
  title: 'Chính sách bảo mật · Poolane',
  description: 'Cam kết bảo vệ dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F6F1EA]">
      <PublicHeader />

      <article className="max-w-3xl mx-auto px-4 py-12 prose-content">
        <h1 className="font-heading text-4xl text-[#1C2B4A] mb-2">Chính sách bảo mật</h1>
        <p className="text-sm text-[#1C2B4A]/50 mb-8">Cập nhật ngày {new Date().toLocaleDateString('vi-VN')}</p>

        <section className="bg-white rounded-2xl p-6 border border-[#1C2B4A]/8 space-y-6 text-sm text-[#1C2B4A]/80 leading-relaxed">
          <p>
            Poolane (sau đây gọi là &ldquo;chúng tôi&rdquo;) cam kết bảo vệ dữ liệu cá nhân của học viên theo
            <strong> Nghị định 13/2023/NĐ-CP</strong> về bảo vệ dữ liệu cá nhân của Chính phủ Việt Nam.
          </p>

          <div>
            <h2 className="font-heading text-xl text-[#1C2B4A] mb-2">1. Dữ liệu chúng tôi thu thập</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Họ tên, ngày sinh, giới tính</li>
              <li>Số điện thoại, email (nếu có)</li>
              <li>Địa chỉ (phường/quận/tỉnh)</li>
              <li>Thông tin sức khoẻ (chỉ phần học viên tự cung cấp)</li>
              <li>Hình ảnh/video kỹ thuật bơi (với sự đồng ý)</li>
              <li>Lịch sử học tập, thanh toán</li>
            </ul>
          </div>

          <div>
            <h2 className="font-heading text-xl text-[#1C2B4A] mb-2">2. Mục đích sử dụng</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Quản lý lớp học, theo dõi tiến độ học viên</li>
              <li>Liên hệ thông báo về lịch học, thay đổi lịch</li>
              <li>Ghi nhận thanh toán và xuất biên lai</li>
              <li>Cải thiện chất lượng giảng dạy</li>
              <li>Marketing (chỉ khi học viên đồng ý riêng)</li>
            </ul>
          </div>

          <div>
            <h2 className="font-heading text-xl text-[#1C2B4A] mb-2">3. Quyền của học viên</h2>
            <p>Theo Nghị định 13/2023, học viên có các quyền sau:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Quyền truy cập:</strong> Xem toàn bộ dữ liệu cá nhân tại trang Hồ sơ</li>
              <li><strong>Quyền chỉnh sửa:</strong> Tự sửa thông tin mềm, yêu cầu sửa thông tin định danh</li>
              <li><strong>Quyền xoá:</strong> Yêu cầu xoá tài khoản và dữ liệu (qua admin)</li>
              <li><strong>Quyền rút lại đồng ý:</strong> Rút đồng ý sử dụng hình ảnh bất cứ lúc nào</li>
              <li><strong>Quyền khiếu nại:</strong> Gửi khiếu nại đến chúng tôi qua email</li>
            </ul>
          </div>

          <div>
            <h2 className="font-heading text-xl text-[#1C2B4A] mb-2">4. Bảo mật dữ liệu</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Dữ liệu lưu trữ trên hạ tầng Supabase (mã hoá at-rest)</li>
              <li>Mật khẩu mã hoá bcrypt, không lưu plain text</li>
              <li>Số CCCD/CMND mã hoá ở cấp database</li>
              <li>Truy cập có phân quyền (admin/staff/student)</li>
              <li>Audit log mọi thao tác thay đổi dữ liệu quan trọng</li>
            </ul>
          </div>

          <div>
            <h2 className="font-heading text-xl text-[#1C2B4A] mb-2">5. Chia sẻ dữ liệu</h2>
            <p>Chúng tôi <strong>KHÔNG</strong> bán hoặc chia sẻ dữ liệu cá nhân của học viên với bên thứ ba, ngoại trừ:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Nhà cung cấp dịch vụ kỹ thuật (Supabase, Vercel, Resend) với cam kết bảo mật</li>
              <li>Cơ quan có thẩm quyền theo yêu cầu pháp luật</li>
            </ul>
          </div>

          <div>
            <h2 className="font-heading text-xl text-[#1C2B4A] mb-2">6. Lưu trữ và xoá dữ liệu</h2>
            <p>
              Dữ liệu của học viên không hoạt động trên 2 năm sẽ được archive hoặc xoá theo yêu cầu.
              Học viên đã yêu cầu xoá sẽ được xử lý trong vòng 30 ngày.
            </p>
          </div>

          <div>
            <h2 className="font-heading text-xl text-[#1C2B4A] mb-2">7. Liên hệ</h2>
            <p>
              Mọi thắc mắc về chính sách bảo mật, vui lòng liên hệ:<br />
              Email: <a href="mailto:support@poolane.vn" className="text-[#5B8E9F] underline">support@poolane.vn</a>
            </p>
          </div>
        </section>
      </article>

      <PublicFooter />
    </div>
  )
}
