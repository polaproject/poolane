'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export type ThemeKey = 'A' | 'B' | 'D'

const THEME_CLASS: Record<ThemeKey, string> = {
  A: 'theme-a',
  B: 'theme-b',
  D: 'theme-d',
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

  // Load theme từ localStorage khi mount
  useEffect(() => {
    const saved = localStorage.getItem('poolane-theme') as ThemeKey | null
    if (saved && ['A', 'B', 'D'].includes(saved)) {
      setThemeState(saved)
    }
    setMounted(true)
  }, [])

  // Áp dụng class vào document.documentElement
  useEffect(() => {
    if (!mounted) return
    const html = document.documentElement
    // Xoá các class theme cũ
    html.classList.remove('theme-a', 'theme-b', 'theme-d')
    // Thêm class theme mới
    html.classList.add(THEME_CLASS[theme])
  }, [theme, mounted])

  function setTheme(newTheme: ThemeKey) {
    setThemeState(newTheme)
    localStorage.setItem('poolane-theme', newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
