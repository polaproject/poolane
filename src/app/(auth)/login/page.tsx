'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      // Supabase dùng email làm username — phone được lưu dưới dạng email giả
      // Format: phone@poolane.local
      const emailForAuth = `${phone.replace(/\D/g, '')}@poolane.local`

      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailForAuth,
        password,
      })

      if (error) {
        toast.error('Đăng nhập không thành công. Kiểm tra lại số điện thoại và mật khẩu nhé.')
        return
      }

      if (data.user) {
        // Lấy role từ user_metadata (không cần query DB, tránh RLS)
        const role = (data.user.user_metadata?.role as string) ?? 'student'
        const path = role === 'admin'
          ? '/admin/dashboard'
          : role === 'staff'
            ? '/staff/dashboard'
            : '/student/dashboard'

        console.log('LOGIN DEBUG: role=', role, 'path=', path, 'user_metadata=', data.user.user_metadata)
        toast.success('Đăng nhập thành công!')
        // router.push thay vì refresh để tránh double navigation
        window.location.href = path
      }
    } catch {
      toast.error('Có lỗi xảy ra. Thử lại sau nhé.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F1EA] p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <svg width="40" height="52" viewBox="0 0 52 68" fill="none" className="mb-3">
            <path
              d="M26 2 C26 2 28.5 22 29.5 25.5 C33 26.5 50 26 50 26 C50 26 33 26 29.5 27.5 C28.5 31 26 50 26 50 C26 50 23.5 31 22.5 27.5 C19 26 2 26 2 26 C2 26 19 26 22.5 25.5 C23.5 22 26 2 26 2 Z"
              fill="#1C2B4A"
            />
            <line x1="8" y1="58" x2="44" y2="58" stroke="#1C2B4A" strokeWidth="1.5" strokeLinecap="round" />
            <path
              d="M26 62 C26 62 26.8 65.5 27.1 66.2 C27.8 66.4 31 66 31 66 C31 66 27.8 66 27.1 66.8 C26.8 67.5 26 71 26 71 C26 71 25.2 67.5 24.9 66.8 C24.2 66 21 66 21 66 C21 66 24.2 66 24.9 66.2 C25.2 65.5 26 62 26 62 Z"
              fill="#1C2B4A"
              opacity="0.25"
            />
          </svg>
          <h1 className="font-body font-bold text-xl tracking-[0.18em] text-[#1C2B4A]">POOLANE</h1>
          <p className="text-xs tracking-[0.15em] text-[#5B8E9F] uppercase mt-0.5">a Pola Project</p>
        </div>

        {/* Login Card */}
        <Card className="border-0 shadow-lg shadow-[#1C2B4A]/8 bg-white">
          <CardHeader className="pb-4 pt-6 px-6">
            <h2 className="font-heading text-2xl text-[#1C2B4A]">Đăng nhập</h2>
            <p className="text-sm text-[#1C2B4A]/50 mt-1">Chào mừng bạn trở lại 🌊</p>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-[#1C2B4A] text-sm font-medium">
                  Số điện thoại
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0912 345 678"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                  disabled={loading}
                  className="border-[#1C2B4A]/15 focus-visible:ring-[#1C2B4A]/30 placeholder:text-[#1C2B4A]/30"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-[#1C2B4A] text-sm font-medium">
                    Mật khẩu
                  </Label>
                  <button
                    type="button"
                    className="text-xs text-[#5B8E9F] hover:underline"
                    onClick={() => toast.info('Liên hệ lớp để reset mật khẩu nhé!')}
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="border-[#1C2B4A]/15 focus-visible:ring-[#1C2B4A]/30"
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !phone || !password}
                className="w-full bg-[#1C2B4A] hover:bg-[#1C2B4A]/90 text-[#F6F1EA] font-semibold h-11 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang đăng nhập...
                  </>
                ) : (
                  'Đăng nhập'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-[#1C2B4A]/35 mt-6">
          Chưa có tài khoản?{' '}
          <a href="/courses" className="text-[#5B8E9F] hover:underline">
            Tìm hiểu các khoá học
          </a>
        </p>
      </div>
    </div>
  )
}
