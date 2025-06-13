'use client'

import '@farcaster/auth-kit/styles.css'
import { AuthKitProvider } from '@farcaster/auth-kit'

const config = {
  rpcUrl: 'https://mainnet.optimism.io',
  domain: 'art-claps.vercel.app',
  siweUri: 'https://art-claps.vercel.app/login',
  relay: 'https://relay.farcaster.xyz',
  version: 'v1',
  storage: 'localStorage',
  sessionDuration: 86400,
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return <AuthKitProvider config={config}>{children}</AuthKitProvider>
}
