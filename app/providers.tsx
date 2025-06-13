'use client'

import '@farcaster/auth-kit/styles.css'
import { AuthKitProvider } from '@farcaster/auth-kit'
import { AuthProvider } from './contexts/AuthContext'

const config = {
  rpcUrl: 'https://mainnet.optimism.io',
  domain: 'art-claps.vercel.app',
  siweUri: 'https://art-claps.vercel.app',
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthKitProvider config={config}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </AuthKitProvider>
  )
}
