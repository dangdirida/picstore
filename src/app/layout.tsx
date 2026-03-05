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
  metadataBase: new URL('https://picstore-sandy.vercel.app'),
  title: 'PicStore - 디지털 이미지 마켓플레이스',
  description: '크리에이터의 작품을 발견하고 소장하세요',
  openGraph: {
    title: 'PicStore',
    description: '크리에이터의 작품을 발견하고 소장하세요',
    url: 'https://picstore-sandy.vercel.app',
    siteName: 'PicStore',
    images: [
      {
        url: 'https://picstore-sandy.vercel.app/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PicStore - 디지털 이미지 마켓플레이스',
      },
    ],
    type: 'website',
    locale: 'ko_KR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PicStore',
    description: '크리에이터의 작품을 발견하고 소장하세요',
    images: ['https://picstore-sandy.vercel.app/og-image.png'],
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
        <main className="min-h-[calc(100vh-68px)]">{children}</main>
        <footer className="bg-white border-t border-[var(--gray-200)] py-10">
          <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-[var(--primary)] rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-[15px] font-extrabold text-[var(--gray-800)]">
                Pic<span className="text-[var(--primary)]">Store</span>
              </span>
            </div>
            <p className="text-[13px] font-medium text-[var(--gray-400)]">
              PicStore. All rights reserved.
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
