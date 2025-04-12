import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { NewsProvider } from "@/context/news-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "AI News Pipeline",
  description: "Generate AI-powered news articles from RSS feeds",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <NewsProvider>{children}</NewsProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
