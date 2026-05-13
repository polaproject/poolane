// Brand theme configuration — Poolane
// Thay đổi file này = toàn bộ hệ thống cập nhật

export type ThemeKey = 'A' | 'B' | 'D'

export interface Theme {
  key: ThemeKey
  name: string
  description: string
  colors: {
    primary: string      // Màu chủ đạo (navy/ocean/dark)
    background: string   // Màu nền
    accent: string       // Màu nhấn (gold/sunrise/glow)
    secondary: string    // Màu phụ (teal/pool)
    text: string         // Màu chữ chính
    textMuted: string    // Màu chữ phụ
    surface: string      // Màu card/surface
    border: string       // Màu viền
  }
  cssVars: Record<string, string>
}

export const themes: Record<ThemeKey, Theme> = {
  // Theme A: Đêm & Sao (Default)
  A: {
    key: 'A',
    name: 'Đêm & Sao',
    description: 'Midnight Navy · Warm Cream · Polar Gold',
    colors: {
      primary: '#1C2B4A',
      background: '#F6F1EA',
      accent: '#C8A84B',
      secondary: '#5B8E9F',
      text: '#1C2B4A',
      textMuted: 'rgba(28,43,74,0.45)',
      surface: '#FFFFFF',
      border: 'rgba(28,43,74,0.12)',
    },
    cssVars: {
      '--color-primary': '28 43 74',
      '--color-background': '246 241 234',
      '--color-accent': '200 168 75',
      '--color-secondary': '91 142 159',
      '--color-surface': '255 255 255',
    },
  },

  // Theme B: Bình Minh
  B: {
    key: 'B',
    name: 'Bình Minh',
    description: 'Ocean Teal · Mist Blue · Sunrise Amber',
    colors: {
      primary: '#1A3F55',
      background: '#EEF4F7',
      accent: '#E09850',
      secondary: '#6AACCF',
      text: '#1A3F55',
      textMuted: 'rgba(26,63,85,0.45)',
      surface: '#FFFFFF',
      border: 'rgba(26,63,85,0.12)',
    },
    cssVars: {
      '--color-primary': '26 63 85',
      '--color-background': '238 244 247',
      '--color-accent': '224 152 80',
      '--color-secondary': '106 172 207',
      '--color-surface': '255 255 255',
    },
  },

  // Theme D: Night Pool
  D: {
    key: 'D',
    name: 'Night Pool',
    description: 'Dark · Electric Mint · Polar Gold',
    colors: {
      primary: '#080E18',
      background: '#0D1828',
      accent: '#00E5C8',
      secondary: '#C9A84B',
      text: '#E5EDF8',
      textMuted: 'rgba(229,237,248,0.45)',
      surface: '#132035',
      border: 'rgba(229,237,248,0.10)',
    },
    cssVars: {
      '--color-primary': '8 14 24',
      '--color-background': '13 24 40',
      '--color-accent': '0 229 200',
      '--color-secondary': '201 168 75',
      '--color-surface': '19 32 53',
    },
  },
}

export const defaultTheme: ThemeKey = 'A'

// Typography
export const typography = {
  fontHeading: 'Cormorant Garamond',
  fontBody: 'Plus Jakarta Sans',
  fontMono: 'var(--font-mono)',
}

// Logo placeholder (SVG path data) — thay bằng logo chính thức sau
export const logoConfig = {
  wordmark: 'POOLANE',
  tagline: 'a Pola Project',
  // SVG path cho icon Polaris
  iconPath: 'M26 2 C26 2 28.5 22 29.5 25.5 C33 26.5 50 26 50 26 C50 26 33 26 29.5 27.5 C28.5 31 26 50 26 50 C26 50 23.5 31 22.5 27.5 C19 26 2 26 2 26 C2 26 19 26 22.5 25.5 C23.5 22 26 2 26 2 Z',
  waterLinePath: 'M8 58 L44 58',
  reflectionPath: 'M26 62 C26 62 26.8 65.5 27.1 66.2 C27.8 66.4 31 66 31 66 C31 66 27.8 66 27.1 66.8 C26.8 67.5 26 71 26 71 C26 71 25.2 67.5 24.9 66.8 C24.2 66 21 66 21 66 C21 66 24.2 66 24.9 66.2 C25.2 65.5 26 62 26 62 Z',
}
