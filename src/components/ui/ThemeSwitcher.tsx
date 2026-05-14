'use client'

import { useTheme, type ThemeKey } from '@/components/providers/ThemeProvider'
import { Palette } from 'lucide-react'

const THEMES: Array<{ key: ThemeKey; label: string; dot: string; title: string }> = [
  { key: 'A', label: 'A', dot: '#C8A84B', title: 'Đêm & Sao' },
  { key: 'B', label: 'B', dot: '#E09850', title: 'Bình Minh' },
  { key: 'D', label: 'D', dot: '#00E5C8', title: 'Night Pool' },
]

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex items-center gap-1.5 px-3 py-2">
      <span className="text-xs mr-1" style={{ color: 'var(--pola-nav-muted)' }}>
        Theme
      </span>
      {THEMES.map(t => (
        <button
          key={t.key}
          onClick={() => setTheme(t.key)}
          title={t.title}
          aria-label={`Đổi theme sang ${t.title}`}
          aria-pressed={theme === t.key}
          className="w-6 h-6 rounded-full flex items-center justify-center transition-all text-xs font-bold"
          style={{
            background: theme === t.key ? t.dot : 'transparent',
            color: theme === t.key ? '#000' : 'var(--pola-nav-muted)',
            border: `2px solid ${theme === t.key ? t.dot : 'var(--pola-nav-active)'}`,
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

/** Compact 1-button cycle theme — for mobile header */
export function ThemeSwitcherCompact() {
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
      title={`Theme hiện tại: ${current.title}. Bấm để đổi.`}
      aria-label={`Đổi theme. Hiện tại: ${current.title}`}
      className="p-2 rounded-lg"
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
