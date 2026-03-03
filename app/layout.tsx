import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from './providers/ThemeProvider'
import { ToastProvider } from './providers/ToastProvider'
import { I18nProvider } from './providers/I18nProvider'

export const metadata: Metadata = {
  title: 'Web Tools - Developer Tools Suite',
  description: 'A collection of useful developer tools including JSON formatter, image converter, JWT decoder, and more.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <I18nProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}