'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export type ThemeKey = 'A' | 'B'

const STORAGE_KEY = 'poolane-theme'
const VALID_THEMES: ThemeKey[] = ['A', 'B']

const THEME_CLASS: Record<ThemeKey, string> = {
  A: 'theme-a',
  B: 'theme-b',
}

interface ThemeContextType {
  theme: ThemeKey
  setTheme: (theme: ThemeKey) => void
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'A',
  setTheme: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeKey>('A')
  const [mounted, setMounted] = useState(false)

  // Hydrate theme từ localStorage khi mount (SSR không có localStorage,
  // nên phải đọc client-side rồi sync vào React state).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as string | null
      if (saved && VALID_THEMES.includes(saved as ThemeKey)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setThemeState(saved as ThemeKey)
      } else if (saved) {
        // Cleanup theme cũ đã bị bỏ (vd 'D')
        localStorage.setItem(STORAGE_KEY, 'A')
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
    // Xoá mọi class theme cũ (bao gồm theme-d đã bị bỏ)
    html.classList.remove('theme-a', 'theme-b', 'theme-d')
    html.classList.add(THEME_CLASS[theme])
    html.setAttribute('data-theme', theme.toLowerCase())
  }, [theme, mounted])

  function setTheme(newTheme: ThemeKey) {
    setThemeState(newTheme)
    try {
      localStorage.setItem(STORAGE_KEY, newTheme)
    } catch {
      // ignore
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
