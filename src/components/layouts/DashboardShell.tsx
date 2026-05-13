'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ThemeSwitcher } from '@/components/ui/ThemeSwitcher'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import type { UserRole } from '@/lib/auth'
import {
  LayoutDashboard, Users, CalendarDays, DollarSign, Zap,
  BellRing, Brain, ShoppingBag, CheckSquare, ClipboardList,
  Star, BarChart2, Calendar, TrendingUp, Target, BookOpen,
  ScrollText, Bell, LogOut, ChevronLeft, Menu, X,
  Activity,
} from 'lucide-react'
import { useState } from 'react'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

const NAV_ITEMS: Record<UserRole, NavItem[]> = {
  admin: [
    { label: 'Dashboard',      href: '/admin/dashboard',    icon: LayoutDashboard },
    { label: 'Học viên',       href: '/admin/students',     icon: Users },
    { label: 'Lịch học',       href: '/admin/schedule',     icon: CalendarDays },
    { label: 'Tài chính',      href: '/admin/finance',      icon: DollarSign },
    { label: 'Pulse Check',    href: '/admin/pulse',        icon: Zap },
    { label: 'AI Dự Báo',      href: '/admin/ai',           icon: Brain },
    { label: 'Đơn hàng',       href: '/admin/shop/orders',  icon: ShoppingBag },
    { label: 'Broadcast',      href: '/admin/broadcast',    icon: BellRing },
  ],
  staff: [
    { label: 'Duyệt đăng ký',  href: '/staff/registrations', icon: CheckSquare },
    { label: 'Thống kê',       href: '/staff/stats',         icon: BarChart2 },
  ],
  student: [
    { label: 'Đăng ký học',    href: '/student/schedule',  icon: Calendar },
    { label: 'Tiến độ',        href: '/student/progress',  icon: TrendingUp },
    { label: 'Mục tiêu',       href: '/student/goals',     icon: Target },
    { label: 'Nhật ký',        href: '/student/log',       icon: Activity },
    { label: 'Shop',           href: '/student/shop',      icon: ShoppingBag },
    { label: 'Thông báo',      href: '/shared/notifications', icon: Bell },
  ],
}

// Bottom nav (mobile) — 5 items max
const BOTTOM_NAV: Record<UserRole, NavItem[]> = {
  admin: [
    { label: 'Home',    href: '/admin/dashboard',    icon: LayoutDashboard },
    { label: 'HV',      href: '/admin/students',     icon: Users },
    { label: 'Lịch',   href: '/admin/schedule',     icon: CalendarDays },
    { label: 'Tiền',   href: '/admin/finance',      icon: DollarSign },
    { label: 'Pulse',   href: '/admin/pulse',        icon: Zap },
  ],
  staff: [
    { label: 'Duyệt',   href: '/staff/registrations', icon: CheckSquare },
    { label: 'Thống kê', href: '/staff/stats',         icon: BarChart2 },
  ],
  student: [
    { label: 'Lịch',    href: '/student/schedule',  icon: Calendar },
    { label: 'Tiến độ', href: '/student/progress',  icon: TrendingUp },
    { label: 'Mục tiêu', href: '/student/goals',    icon: Target },
    { label: 'Shop',    href: '/student/shop',      icon: ShoppingBag },
    { label: 'TB',      href: '/shared/notifications', icon: Bell },
  ],
}

interface DashboardShellProps {
  children: React.ReactNode
  userRole: UserRole
  userFullName: string
  userInitial: string
}

function ShellInner({ children, userRole, userFullName, userInitial }: DashboardShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navItems = NAV_ITEMS[userRole] ?? []
  const bottomItems = BOTTOM_NAV[userRole] ?? []

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + '/')
  }

  async function handleLogout() {
    await fetch('/api/auth/logout')
    router.push('/login')
  }

  const logoSvg = (
    <svg width="22" height="28" viewBox="0 0 52 68" fill="none">
      <path d="M26 2 C26 2 28.5 22 29.5 25.5 C33 26.5 50 26 50 26 C50 26 33 26 29.5 27.5 C28.5 31 26 50 26 50 C26 50 23.5 31 22.5 27.5 C19 26 2 26 2 26 C2 26 19 26 22.5 25.5 C23.5 22 26 2 26 2 Z" fill="currentColor" />
      <line x1="8" y1="58" x2="44" y2="58" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M26 62 C26 62 26.8 65.5 27.1 66.2 C27.8 66.4 31 66 31 66 C31 66 27.8 66 27.1 66.8 C26.8 67.5 26 71 26 71 C26 71 25.2 67.5 24.9 66.8 C24.2 66 21 66 21 66 C21 66 24.2 66 24.9 66.2 C25.2 65.5 26 62 26 62 Z" fill="currentColor" opacity="0.3" />
    </svg>
  )

  return (
    <div className="pola-page min-h-screen flex">
      {/* ── SIDEBAR (desktop) ── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col w-60 pola-nav
          transition-transform duration-200 ease-in-out
          lg:translate-x-0 lg:static lg:flex
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b" style={{ borderColor: 'var(--pola-nav-active)' }}>
          <span style={{ color: 'var(--pola-nav-text)' }}>{logoSvg}</span>
          <div>
            <p className="font-body font-bold text-sm tracking-[0.16em]" style={{ color: 'var(--pola-nav-text)' }}>
              POOLANE
            </p>
            <p className="text-xs tracking-wide" style={{ color: 'var(--pola-nav-muted)', fontSize: '0.65rem' }}>
              a Pola Project
            </p>
          </div>
          <button
            className="ml-auto lg:hidden"
            onClick={() => setSidebarOpen(false)}
            style={{ color: 'var(--pola-nav-muted)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {navItems.map(item => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-0.5 text-sm font-medium transition-all"
                style={{
                  background: active ? 'var(--pola-nav-active)' : 'transparent',
                  color: active ? 'var(--pola-nav-text)' : 'var(--pola-nav-muted)',
                  borderLeft: active ? `3px solid var(--pola-accent)` : '3px solid transparent',
                }}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
                {active && (
                  <span
                    className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{ background: 'var(--pola-accent)' }}
                  />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Theme switcher */}
        <div className="border-t px-2 py-2" style={{ borderColor: 'var(--pola-nav-active)' }}>
          <ThemeSwitcher />
        </div>

        {/* User + Logout */}
        <div
          className="border-t px-3 py-3 flex items-center gap-2.5"
          style={{ borderColor: 'var(--pola-nav-active)' }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{ background: 'var(--pola-accent)', color: '#000' }}
          >
            {userInitial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: 'var(--pola-nav-text)' }}>
              {userFullName}
            </p>
            <p className="text-xs capitalize" style={{ color: 'var(--pola-nav-muted)' }}>
              {userRole}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg transition-colors hover:opacity-70"
            style={{ color: 'var(--pola-nav-muted)' }}
            title="Đăng xuất"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>

      {/* Backdrop (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        {/* Mobile header */}
        <header
          className="lg:hidden flex items-center gap-3 px-4 py-3 pola-nav sticky top-0 z-30"
        >
          <button
            onClick={() => setSidebarOpen(true)}
            style={{ color: 'var(--pola-nav-text)' }}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <span style={{ color: 'var(--pola-nav-text)' }}>
              <svg width="16" height="20" viewBox="0 0 52 68" fill="none">
                <path d="M26 2 C26 2 28.5 22 29.5 25.5 C33 26.5 50 26 50 26 C50 26 33 26 29.5 27.5 C28.5 31 26 50 26 50 C26 50 23.5 31 22.5 27.5 C19 26 2 26 2 26 C2 26 19 26 22.5 25.5 C23.5 22 26 2 26 2 Z" fill="currentColor" />
              </svg>
            </span>
            <span className="font-body font-bold text-sm tracking-[0.16em]" style={{ color: 'var(--pola-nav-text)' }}>
              POOLANE
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/shared/notifications" style={{ color: 'var(--pola-nav-muted)' }}>
              <Bell className="w-4 h-4" />
            </Link>
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: 'var(--pola-accent)', color: '#000' }}
            >
              {userInitial}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 pb-20 lg:pb-0 overflow-x-hidden">
          {children}
        </main>

        {/* ── BOTTOM NAV (mobile) ── */}
        <nav
          className="lg:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around pola-nav border-t"
          style={{ borderColor: 'var(--pola-nav-active)', paddingBottom: 'env(safe-area-inset-bottom, 0)' }}
        >
          {bottomItems.map(item => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-0.5 py-2 px-3 transition-all"
                style={{ color: active ? 'var(--pola-accent)' : 'var(--pola-nav-muted)' }}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[9px] font-medium leading-none">{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}

export function DashboardShell(props: DashboardShellProps) {
  return (
    <ThemeProvider>
      <ShellInner {...props} />
    </ThemeProvider>
  )
}
