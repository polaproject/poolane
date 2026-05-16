import type { Metadata } from 'next'
import { Cormorant_Garamond, Plus_Jakarta_Sans } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import './globals.css'

const cormorantGaramond = Cormorant_Garamond({
  variable: '--font-heading',
  subsets: ['latin'],
  weight: ['400', '600'],
  style: ['normal', 'italic'],
  display: 'swap',
})

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-body',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Poolane — Dạy bơi không chỉ để bơi',
    template: '%s · Poolane',
  },
  description: 'Lớp dạy bơi cho người lớn 16-40 tuổi. Bơi Ếch, Sải, Bướm — hệ thống đánh giá kỹ năng chuẩn hoá, theo dõi tiến độ trực quan.',
  keywords: ['học bơi', 'lớp bơi', 'poolane', 'pola project', 'poolane.vn', 'bơi ếch', 'bơi sải', 'bơi bướm', 'lớp bơi người lớn'],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://poolane.vn'),
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Poolane',
  },
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    siteName: 'Poolane',
    title: 'Poolane — Dạy bơi không chỉ để bơi',
    description: 'Học bơi cùng cộng đồng người lớn 16-40 tuổi · Bơi Ếch · Sải · Bướm',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Poolane',
    description: 'Dạy bơi không chỉ để bơi — Pola Project',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport = {
  themeColor: '#1C2B4A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

/**
 * Inline blocking script — apply theme class lên <html> NGAY trước khi
 * paint đầu tiên để tránh FOUC (Flash Of Unstyled Content). Phải chạy
 * sync trước React hydrate, nếu không sẽ flash dark/light vài chục ms.
 * Đồng bộ logic với ThemeProvider (key 'poolane-theme-v2', default 'light').
 */
const themeInitScript = `(function(){try{var s=localStorage.getItem('poolane-theme-v2');var t=(s==='dark'||s==='light')?s:'light';var h=document.documentElement;h.classList.add('theme-'+t);if(t==='dark')h.classList.add('lqg-dark');h.setAttribute('data-theme',t);}catch(e){document.documentElement.classList.add('theme-light');document.documentElement.setAttribute('data-theme','light');}})();`

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className={`${cormorantGaramond.variable} ${plusJakartaSans.variable} font-body antialiased`}
      >
        <ThemeProvider>
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
