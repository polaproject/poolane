'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { PolarisStar } from '@/components/brand/PolarisStar'
import { GlassCard, GlassButton, GlassInput, AmbientMesh } from '@/components/ui/glass'

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
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <AmbientMesh />
      <div className="w-full max-w-sm relative z-10">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <span className="mb-3 lqg-text-primary">
            <PolarisStar size={56} withReflection={false} animated glow={false} />
          </span>
          <h1 className="font-body font-bold text-xl tracking-[0.18em] lqg-text-primary">POOLANE</h1>
          <p className="text-xs tracking-[0.15em] uppercase mt-0.5 lqg-text-tertiary">a Pola Project</p>
        </div>

        {/* Login Card */}
        <GlassCard tier="heavy" radius="xl" interactive={false} className="p-6 sm:p-7">
          <div className="mb-5">
            <h2 className="lqg-display text-3xl mb-1">Đăng nhập</h2>
            <p className="text-sm lqg-text-secondary">Chào mừng bạn trở lại 🌊</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-sm font-medium lqg-text-primary">
                Số điện thoại
              </Label>
              <GlassInput
                id="phone"
                type="tel"
                placeholder="0912 345 678"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-sm font-medium lqg-text-primary">
                  Mật khẩu
                </Label>
                <a href="/forgot-password" className="text-xs lqg-text-accent hover:underline">
                  Quên mật khẩu?
                </a>
              </div>
              <GlassInput
                id="password"
                type="password"
                revealable
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <GlassButton
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              disabled={!phone || !password}
              className="w-full mt-2"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </GlassButton>
          </form>
        </GlassCard>

        <p className="text-center text-sm mt-6 lqg-text-secondary">
          Chưa có tài khoản?{' '}
          <a href="/register" className="lqg-text-accent hover:underline font-semibold">
            Tạo tài khoản mới
          </a>
        </p>
      </div>
    </div>
  )
}
