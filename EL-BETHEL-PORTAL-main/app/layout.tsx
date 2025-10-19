import type React from "react"
import type { Metadata } from "next"
import { Inter, Geist } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })
const geist = Geist({ subsets: ["latin"], variable: "--font-geist" })

export const metadata: Metadata = {
  title: "El Bethel Academy - Next-Generation Learning Platform",
  description: "AI-Powered School Management System with Advanced Analytics and Real-time Collaboration",
  keywords: ["education", "school management", "AI learning", "student portal", "e-learning"],
  authors: [{ name: "El Bethel Academy" }],
  creator: "El Bethel Academy",
  publisher: "El Bethel Academy",
  icons: {
    icon: "https://cdn.builder.io/api/v1/image/assets%2Fbd2820205fb947eb8af5752a50d16f87%2F5bda342765554afe869b9b86f5b4343a?format=webp&width=64",
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://portal.elbethelacademy.edu"),
  openGraph: {
    title: "El Bethel Academy - Next-Generation Learning Platform",
    description: "AI-Powered School Management System with Advanced Analytics and Real-time Collaboration",
    url: "https://portal.elbethelacademy.edu",
    siteName: "El Bethel Academy",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "El Bethel Academy Portal",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "El Bethel Academy - Next-Generation Learning Platform",
    description: "AI-Powered School Management System with Advanced Analytics and Real-time Collaboration",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${geist.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            {children}
            <Toaster richColors position="top-right" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
