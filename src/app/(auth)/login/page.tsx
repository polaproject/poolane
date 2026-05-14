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
import { PolarisStar } from '@/components/brand/PolarisStar'

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
    <div className="min-h-screen flex items-center justify-center bg-paper p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <span className="text-foreground mb-3">
            <PolarisStar size={56} withReflection animated glow />
          </span>
          <h1 className="font-body font-bold text-xl tracking-[0.18em] text-foreground">POOLANE</h1>
          <p className="text-xs tracking-[0.15em] text-mist uppercase mt-0.5">a Pola Project</p>
        </div>

        {/* Login Card */}
        <Card className="border-0 shadow-lg shadow-ink/8 bg-[var(--surface)]">
          <CardHeader className="pb-4 pt-6 px-6">
            <h2 className="font-heading text-2xl text-foreground">Đăng nhập</h2>
            <p className="text-sm text-foreground/50 mt-1">Chào mừng bạn trở lại 🌊</p>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-foreground text-sm font-medium">
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
                  className="border-foreground/15 focus-visible:ring-foreground/30 placeholder:text-foreground/30"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-foreground text-sm font-medium">
                    Mật khẩu
                  </Label>
                  <a
                    href="/forgot-password"
                    className="text-xs text-[#5B8E9F] hover:underline"
                  >
                    Quên mật khẩu?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="border-foreground/15 focus-visible:ring-foreground/30"
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !phone || !password}
                className="w-full bg-ink-soft hover:bg-foreground/90 text-paper font-semibold h-11 mt-2"
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

        <p className="text-center text-sm text-foreground/50 mt-6">
          Chưa có tài khoản?{' '}
          <a href="/register" className="text-[#5B8E9F] hover:underline font-semibold">
            Tạo tài khoản mới
          </a>
        </p>
      </div>
    </div>
  )
}
