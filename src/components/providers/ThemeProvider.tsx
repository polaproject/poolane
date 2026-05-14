'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export type ThemeKey = 'dark' | 'light'

const STORAGE_KEY = 'poolane-theme'
const VALID_THEMES: ThemeKey[] = ['dark', 'light']

const THEME_CLASS: Record<ThemeKey, string> = {
  dark: 'theme-dark',
  light: 'theme-light',
}

// Migrate từ format cũ ('A'|'B') sang ('dark'|'light')
function migrateLegacyTheme(raw: string | null): ThemeKey | null {
  if (!raw) return null
  if (raw === 'A' || raw === 'a' || raw === 'theme-a' || raw === 'dark') return 'dark'
  if (raw === 'B' || raw === 'b' || raw === 'theme-b' || raw === 'light') return 'light'
  return null
}

interface ThemeContextType {
  theme: ThemeKey
  setTheme: (theme: ThemeKey) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  setTheme: () => {},
  toggleTheme: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeKey>('dark')
  const [mounted, setMounted] = useState(false)

  // Hydrate theme từ localStorage khi mount + migrate format cũ
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      const migrated = migrateLegacyTheme(saved)
      if (migrated && VALID_THEMES.includes(migrated)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setThemeState(migrated)
        if (saved !== migrated) {
          // Persist format mới
          localStorage.setItem(STORAGE_KEY, migrated)
        }
      } else if (saved) {
        // Theme cũ không match (vd 'D') → reset về dark
        localStorage.setItem(STORAGE_KEY, 'dark')
      }
    } catch {
      // localStorage không khả dụng — giữ default
    }
    setMounted(true)
  }, [])

  // Áp dụng class vào html
  useEffect(() => {
    if (!mounted) return
    const html = document.documentElement
    // Xoá mọi class theme cũ
    html.classList.remove('theme-a', 'theme-b', 'theme-d', 'theme-dark', 'theme-light')
    html.classList.add(THEME_CLASS[theme])
    html.setAttribute('data-theme', theme)
  }, [theme, mounted])

  function setTheme(newTheme: ThemeKey) {
    setThemeState(newTheme)
    try {
      localStorage.setItem(STORAGE_KEY, newTheme)
    } catch {
      // ignore
    }
  }

  function toggleTheme() {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
