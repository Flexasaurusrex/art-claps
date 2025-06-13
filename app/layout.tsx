// app/layout.tsx
'use client'

import './globals.css'
import '@farcaster/auth-kit/styles.css'
import { AuthKitProvider } from '@farcaster/auth-kit'

export const metadata = {
  title: 'Art Claps – Support Artists, Earn Rewards',
  description:
    'The SocialFi platform where supporting Farcaster artists earns you points and builds community.',
}

const authConfig = {
  rpcUrl: 'https://mainnet.optimism.io',
  domain: 'art-claps.vercel.app',
  siweUri: 'https://art-claps.vercel.app/login',
  relay: 'https://relay.farcaster.xyz',
  version: 'v1',
  storage: 'localStorage',    // persists auth across reloads
  sessionDuration: 86400,     // 24h in seconds
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthKitProvider config={authConfig}>
          {children}
        </AuthKitProvider>
      </body>
    </html>
  )
}
