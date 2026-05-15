// Brand theme configuration — Poolane
// Single source of truth: thay đổi file này = toàn bộ hệ thống cập nhật.
// CSS variables tương ứng được định nghĩa trong src/app/globals.css

export type ThemeKey = 'A' | 'B'

export interface ThemeTokens {
  // Inks (text + dark surface)
  ink: string         // Text chính, dark surface
  inkSoft: string     // Dark surface alt (header, dark cards)
  // Papers (background + light surface)
  paper: string       // Background chính
  paperTint: string   // Surface alt subtle
  // Accent (CTA, highlight)
  accent: string
  accentSoft: string
  // Secondary accent
  mist: string
  // Semantic
  success: string
  warn: string
  danger: string
  // Glass (frosted panel surfaces)
  glassBg: string     // rgba — semi-transparent paper
  glassRing: string   // rgba — subtle highlight edge
  // Shadows (tinted with ink)
  shadowSoft: string
  shadowGlass: string
  shadowCta: string
}

export interface Theme {
  key: ThemeKey
  name: string
  description: string
  tone: 'light' | 'dark-ambient' // bg đậm/sáng
  tokens: ThemeTokens
}

export const themes: Record<ThemeKey, Theme> = {
  // ── Theme A — Đêm & Sao (default) ──────────────────────
  // Cảm giác: Polaris dẫn đường giữa bầu trời đêm. Cinematic, trầm, ấm.
  A: {
    key: 'A',
    name: 'Đêm & Sao',
    description: 'Midnight Navy · Warm Cream · Polar Gold',
    tone: 'dark-ambient',
    tokens: {
      ink: '#0F1B33',
      inkSoft: '#1C2B4A',
      paper: '#FBF7F0',
      paperTint: '#F2EAD9',
      accent: '#C8A84B',
      accentSoft: '#E8D9A8',
      mist: '#7FA8B5',
      success: '#5C8A6E',
      warn: '#D89B3A',
      danger: '#B5483C',
      glassBg: 'rgba(251, 247, 240, 0.08)',
      glassRing: 'rgba(255, 255, 255, 0.15)',
      shadowSoft: '0 4px 20px -8px rgba(15, 27, 51, 0.18)',
      shadowGlass: '0 30px 80px -20px rgba(0, 0, 0, 0.55)',
      shadowCta: '0 12px 28px -8px rgba(200, 168, 75, 0.45)',
    },
  },

  // ── Theme B — Bình Yên ─────────────────────────────────
  // Cảm giác: ban mai lavender, peach mềm, không gian thở.
  B: {
    key: 'B',
    name: 'Bình Yên',
    description: 'Lavender Mist · Warm Paper · Peach Glow',
    tone: 'light',
    tokens: {
      ink: '#2D2A4A',
      inkSoft: '#3A3463',
      paper: '#F4EFFB',
      paperTint: '#EEEAFB',
      accent: '#E89B7A',
      accentSoft: '#FCE7E0',
      mist: '#9B91D6',
      success: '#6B9B7E',
      warn: '#D89B3A',
      danger: '#C25A4A',
      glassBg: 'rgba(255, 255, 255, 0.85)',
      glassRing: 'rgba(45, 42, 74, 0.08)',
      shadowSoft: '0 4px 20px -8px rgba(45, 42, 74, 0.12)',
      shadowGlass: '0 30px 70px -20px rgba(45, 42, 74, 0.22)',
      shadowCta: '0 12px 28px -8px rgba(232, 155, 122, 0.45)',
    },
  },
}

export const defaultTheme: ThemeKey = 'A'

// ── Typography ────────────────────────────────────────────
export const typography = {
  fontHeading: 'Cormorant Garamond',
  fontBody: 'Plus Jakarta Sans',
  fontMono: 'var(--font-mono)',
}

// ── Logo (placeholder — thay bằng logo chính thức sau) ────
// Phase 16: bỏ waterLinePath + reflectionPath (PolarisStar không còn render reflection)
export const logoConfig = {
  wordmark: 'POOLANE',
  tagline: 'a Pola Project',
  iconPath:
    'M26 2 C26 2 28.5 22 29.5 25.5 C33 26.5 50 26 50 26 C50 26 33 26 29.5 27.5 C28.5 31 26 50 26 50 C26 50 23.5 31 22.5 27.5 C19 26 2 26 2 26 C2 26 19 26 22.5 25.5 C23.5 22 26 2 26 2 Z',
}
