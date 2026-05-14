'use client'

import { useTheme, type ThemeKey } from '@/components/providers/ThemeProvider'
import { Moon, Sun } from 'lucide-react'

interface ThemeMeta {
  key: ThemeKey
  label: string
  icon: typeof Moon
  title: string
  desc: string
}

const THEMES: ThemeMeta[] = [
  { key: 'dark',  label: 'Tối',  icon: Moon, title: 'Chế độ Tối',  desc: 'Navy · Gold — đêm muộn' },
  { key: 'light', label: 'Sáng', icon: Sun,  title: 'Chế độ Sáng', desc: 'Lavender · Peach — ban ngày' },
]

/** Full switcher với 2 chip preview — dùng trong sidebar */
export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="flex items-center gap-1 px-3 py-2">
      <span className="text-xs mr-1.5" style={{ color: 'var(--pola-nav-muted)' }}>
        Giao diện
      </span>
      {THEMES.map(t => {
        const active = theme === t.key
        const Icon = t.icon
        return (
          <button
            key={t.key}
            onClick={() => setTheme(t.key)}
            title={`${t.title} — ${t.desc}`}
            aria-label={t.title}
            aria-pressed={active}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-pill text-xs transition-all duration-300 [transition-timing-function:var(--ease-spring-soft)] hover:scale-105"
            style={{
              background: active ? 'var(--accent)' : 'transparent',
              color: active ? 'var(--ink)' : 'var(--pola-nav-muted)',
              border: `1px solid ${active ? 'var(--accent)' : 'var(--pola-nav-active)'}`,
              fontWeight: active ? 600 : 400,
            }}
          >
            <Icon className="w-3 h-3" strokeWidth={2.25} />
            {t.label}
          </button>
        )
      })}
    </div>
  )
}

/** Compact 1-button toggle Sun ↔ Moon — cho mobile / public header */
export function ThemeSwitcherCompact({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'
  // Hiện icon đối lập (đang tối → show Sun = ý "bấm để sáng")
  const Icon = isDark ? Sun : Moon
  const ariaLabel = isDark ? 'Chuyển sang chế độ Sáng' : 'Chuyển sang chế độ Tối'

  return (
    <button
      onClick={toggleTheme}
      title={ariaLabel}
      aria-label={ariaLabel}
      className={className ?? 'p-2 rounded-lg transition-transform duration-300 [transition-timing-function:var(--ease-spring)] hover:scale-110 hover:rotate-12'}
      style={{ color: 'var(--pola-nav-muted)' }}
    >
      <Icon className="w-5 h-5" strokeWidth={2} />
    </button>
  )
}
