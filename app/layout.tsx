import './globals.css'
import Providers from './providers'

export const metadata = {
  title: 'Art Claps – Support Artists, Earn Rewards',
  description:
    'The SocialFi platform where supporting Farcaster artists earns you points and builds community.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
