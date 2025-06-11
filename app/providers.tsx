'use client';

// NO CSS IMPORT - we'll style it ourselves
import { AuthKitProvider } from '@farcaster/auth-kit';

const config = {
  rpcUrl: 'https://mainnet.optimism.io',
  domain: 'art-claps.vercel.app',
  siweUri: 'https://art-claps.vercel.app/login',
  relay: 'https://relay.farcaster.xyz',
};

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthKitProvider config={config}>
      {children}
    </AuthKitProvider>
  );
}
