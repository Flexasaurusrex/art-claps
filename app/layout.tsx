import './globals.css'
import { Inter } from 'next/font/google'
import { Providers } from './providers'  // FIXED: Named import instead of default
import type { Metadata } from 'next'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Art Claps - SocialFi for Farcaster Creators',
  description: 'Support amazing Farcaster artists, earn CLAPS points, and climb the leaderboard. The premier SocialFi platform for creator discovery and rewards.',
  
  // Open Graph
  openGraph: {
    title: 'Art Claps - SocialFi for Farcaster Creators',
    description: 'Discover amazing artists, earn CLAPS points, and compete on the leaderboard. Join the hottest creator economy on Farcaster!',
    url: 'https://art-claps.vercel.app',
    siteName: 'Art Claps',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://art-claps.vercel.app/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Art Claps - SocialFi Platform for Farcaster Creators',
      },
    ],
  },
  // Twitter
  twitter: {
    card: 'summary_large_image',
    title: 'Art Claps - SocialFi for Farcaster Creators',
    description: 'Discover artists, earn CLAPS points, climb the leaderboard! The hottest creator economy on Farcaster',
    images: ['https://art-claps.vercel.app/og-image.png'],
  },
  // Basic Meta
  keywords: ['Farcaster', 'SocialFi', 'NFT', 'creators', 'artists', 'crypto'],
  authors: [{ name: 'Art Claps' }],
  creator: 'Art Claps',
  
  // Icons
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  // Manifest
  manifest: '/site.webmanifest',
  // Other
  robots: {
    index: true,
    follow: true,
  },
  
  // Theme
  themeColor: '#8b5cf6',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
