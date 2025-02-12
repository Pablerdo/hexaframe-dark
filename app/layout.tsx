import "./globals.css"
import type React from "react"

export const metadata = {
  title: "Hexaframe Demo",
  description: "Generate controllable videos with AI",
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

