 import './globals.css'
import { Providers } from './providers'
export const metadata = {
  title: 'Art Claps - Support Artists, Earn Rewards',
  description: 'The SocialFi platform where supporting Farcaster artists earns you points and builds community.',
}
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
and provider.tsx 'use client';
import '@farcaster/auth-kit/styles.css';
import { AuthKitProvider } from '@farcaster/auth-kit';
const config = {
  rpcUrl: 'https://mainnet.optimism.io',
  domain: 'art-claps.vercel.app',
  siweUri: 'https://art-claps.vercel.app/login',
  // Critical auth persistence settings
  relay: 'https://relay.farcaster.xyz',
  version: 'v1',
  // Enable session persistence
  storage: 'localStorage', // This persists auth across page reloads
  // Optional: Extend session duration
  sessionDuration: 86400, // 24 hours in seconds (default is 1 hour)
};
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthKitProvider config={config}>
      {children}
    </AuthKitProvider>
  );
}
