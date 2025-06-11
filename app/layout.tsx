import { Providers } from './providers';

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
      <head>
        <style dangerouslySetInnerHTML={{
          __html: `
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              line-height: 1.6;
              overflow-x: hidden;
            }
            
            button {
              border: none;
              outline: none;
            }
            
            button:focus-visible {
              outline: 2px solid rgba(255, 255, 255, 0.5);
              outline-offset: 2px;
            }
            
            @media (max-width: 768px) {
              .grid-responsive {
                grid-template-columns: 1fr !important;
              }
            }
            
            /* Smooth scrolling */
            html {
              scroll-behavior: smooth;
            }
            
            /* Custom scrollbar */
            ::-webkit-scrollbar {
              width: 8px;
            }
            
            ::-webkit-scrollbar-track {
              background: rgba(255, 255, 255, 0.1);
            }
            
            ::-webkit-scrollbar-thumb {
              background: rgba(255, 255, 255, 0.3);
              border-radius: 4px;
            }
            
            ::-webkit-scrollbar-thumb:hover {
              background: rgba(255, 255, 255, 0.5);
            }
          `
        }} />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
