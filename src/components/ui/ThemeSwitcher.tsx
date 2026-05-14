'use client'

import { useTheme, type ThemeKey } from '@/components/providers/ThemeProvider'
import { Palette } from 'lucide-react'

interface ThemeMeta {
  key: ThemeKey
  label: string
  dot: string
  title: string
  desc: string
}

const THEMES: ThemeMeta[] = [
  { key: 'A', label: 'A', dot: '#C8A84B', title: 'Đêm & Sao',  desc: 'Navy ấm · Gold' },
  { key: 'B', label: 'B', dot: '#E89B7A', title: 'Bình Yên',   desc: 'Lavender · Peach' },
]

/** Full switcher với 2 chip preview — dùng trong sidebar */
export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex items-center gap-1.5 px-3 py-2">
      <span className="text-xs mr-1" style={{ color: 'var(--pola-nav-muted)' }}>
        Giao diện
      </span>
      {THEMES.map(t => {
        const active = theme === t.key
        return (
          <button
            key={t.key}
            onClick={() => setTheme(t.key)}
            title={`${t.title} — ${t.desc}`}
            aria-label={`Đổi giao diện sang ${t.title}`}
            aria-pressed={active}
            className="w-6 h-6 rounded-full flex items-center justify-center transition-all text-xs font-bold"
            style={{
              background: active ? t.dot : 'transparent',
              color: active ? '#0F1B33' : 'var(--pola-nav-muted)',
              border: `2px solid ${active ? t.dot : 'var(--pola-nav-active)'}`,
            }}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}

/** Compact 1-button cycle — cho mobile / public header */
export function ThemeSwitcherCompact({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const current = THEMES.find(t => t.key === theme) ?? THEMES[0]

  function cycle() {
    const idx = THEMES.findIndex(t => t.key === theme)
    const next = THEMES[(idx + 1) % THEMES.length]
    setTheme(next.key)
  }

  return (
    <button
      onClick={cycle}
      title={`Giao diện: ${current.title}. Bấm để đổi.`}
      aria-label={`Đổi giao diện. Hiện tại: ${current.title}`}
      className={className ?? 'p-2 rounded-lg'}
      style={{ color: 'var(--pola-nav-muted)' }}
    >
      <span className="relative inline-flex items-center justify-center">
        <Palette className="w-5 h-5" />
        <span
          className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border"
          style={{ background: current.dot, borderColor: 'var(--pola-nav-bg)' }}
        />
      </span>
    </button>
  )
}
