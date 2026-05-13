'use client'

import { useTheme, type ThemeKey } from '@/components/providers/ThemeProvider'

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
