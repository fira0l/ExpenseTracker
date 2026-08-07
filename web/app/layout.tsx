import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SpendWise — Smart Expense Tracker',
  description: 'Track your daily expenses, set budgets, and take control of your monthly income with SpendWise.',
  keywords: ['expense tracker', 'budget', 'personal finance', 'spending tracker'],
  openGraph: {
    title: 'SpendWise — Smart Expense Tracker',
    description: 'Take control of your finances with smart expense tracking and budget alerts.',
    type: 'website',
  },
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' }
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@400;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
