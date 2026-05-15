'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export type ThemeKey = 'dark' | 'light'

// Phase 13.2: bump key từ 'poolane-theme' → 'poolane-theme-v2' để force migrate
// user cũ về default light (dark mode đang có bugs visual, chưa fix xong)
const STORAGE_KEY = 'poolane-theme-v2'
const VALID_THEMES: ThemeKey[] = ['dark', 'light']

const THEME_CLASS: Record<ThemeKey, string> = {
  dark: 'theme-dark',
  light: 'theme-light',
}

interface ThemeContextType {
  theme: ThemeKey
  setTheme: (theme: ThemeKey) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeKey>('light')
  const [mounted, setMounted] = useState(false)

  // Hydrate theme từ localStorage khi mount
  // User mới HOẶC user cũ với key 'poolane-theme' (cũ) → default light
  // Chỉ user explicit chọn lại theme SAU Phase 13.2 (key v2) mới giữ preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as ThemeKey | null
      if (saved && VALID_THEMES.includes(saved)) {
         
        setThemeState(saved)
      }
    } catch {
      // localStorage không khả dụng — giữ default light
    }
    setMounted(true)
  }, [])

  // Áp dụng class vào html — DUAL CLASS:
  //  - Phase 7-11 legacy: `theme-dark`/`theme-light` (for backward compat)
  //  - Phase 12 LQG: `lqg-dark` (only when dark)
  useEffect(() => {
    if (!mounted) return
    const html = document.documentElement
    const body = document.body
    // Xoá mọi class theme cũ
    html.classList.remove('theme-a', 'theme-b', 'theme-d', 'theme-dark', 'theme-light', 'lqg-dark')
    html.classList.add(THEME_CLASS[theme])
    if (theme === 'dark') html.classList.add('lqg-dark')
    html.setAttribute('data-theme', theme)
    // Body baseline for LQG (background + text adaptive)
    body.classList.add('lqg-body')
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
