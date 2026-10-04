import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MealPrep',
  description: 'Weekly and monthly meal planning with variety',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}