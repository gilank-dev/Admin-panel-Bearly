import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Bearly Admin Panel',
    template: '%s | Bearly Admin',
  },
  description: 'Admin dashboard for AI Chatbot user management, usage limits, and settings.',
  keywords: ['admin', 'dashboard', 'firebase', 'users', 'analytics'],
  icons: [
    { rel: 'icon', url: '/favicon.svg', type: 'image/svg+xml' },
    { rel: 'icon', url: '/favicon.svg' },
    { rel: 'apple-touch-icon', url: '/apple-touch-icon.svg', type: 'image/svg+xml' },
  ],
  manifest: '/site.webmanifest',
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: 'Bearly Admin Panel',
    description: 'Admin dashboard for AI Chatbot user management, usage limits, and settings.',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Bearly Admin Panel',
      },
    ],
  },
  alternates: {
    canonical: '/',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}