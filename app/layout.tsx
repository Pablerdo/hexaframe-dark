import "./globals.css"
import type React from "react"

export const metadata = {
  title: "Hexaframe",
  description: "Generate videos with AI",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  )
}

