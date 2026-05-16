/**
 * Auth layout — wrap login/register/forgot-password.
 *
 * Lý do tồn tại: iOS Safari 16.x có bug touch events trên element con khi
 * parent dùng `backdrop-filter` (WebKit #237876, fix ở 16.4+). User iOS 16.3
 * không ấn được nút submit. Wrapper `data-auth-page` để scope CSS override
 * trong globals.css (tắt backdrop-filter cho card auth) → 100% reliable click
 * trên tất cả Safari ≥15.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <div data-auth-page>{children}</div>
}
