import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'PicStore - 디지털 이미지 마켓플레이스',
  description: '누구나 디지털 이미지를 업로드하고 판매할 수 있는 마켓플레이스',
  openGraph: {
    title: 'PicStore',
    description: '누구나 디지털 이미지를 업로드하고 판매할 수 있는 마켓플레이스',
    images: ['/og-thumbnail.png'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PicStore',
    description: '누구나 디지털 이미지를 업로드하고 판매할 수 있는 마켓플레이스',
    images: ['/og-thumbnail.png'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Header />
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
        <footer className="border-t border-[var(--gray-200)] py-8 text-center text-sm text-[var(--gray-500)]">
          <p>PicStore - 디지털 이미지 마켓플레이스</p>
        </footer>
      </body>
    </html>
  )
}
