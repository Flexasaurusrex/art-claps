// Add these meta tags to your app/layout.tsx <head> section

export const metadata: Metadata = {
  title: 'Art Claps - SocialFi for Farcaster Creators',
  description: 'Support amazing Farcaster artists, earn CLAPS points, and climb the leaderboard. The premier SocialFi platform for creator discovery and rewards.',
  keywords: 'Farcaster, SocialFi, NFT, creators, artists, crypto, social media, claps, leaderboard',
  authors: [{ name: 'Art Claps' }],
  creator: 'Art Claps',
  publisher: 'Art Claps',
  
  // Open Graph (Facebook, LinkedIn, WhatsApp)
  openGraph: {
    title: '🎨 Art Claps - SocialFi for Farcaster Creators',
    description: 'Discover amazing artists, earn CLAPS points, and compete on the leaderboard. Join the hottest creator economy on Farcaster! 🔥',
    url: 'https://art-claps.vercel.app',
    siteName: 'Art Claps',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: 'https://art-claps.vercel.app/og-image.png', // We'll create this
        width: 1200,
        height: 630,
        alt: 'Art Claps - SocialFi Platform for Farcaster Creators',
        type: 'image/png',
      },
    ],
  },

  // Twitter Cards
  twitter: {
    card: 'summary_large_image',
    title: '🎨 Art Claps - SocialFi for Farcaster Creators',
    description: 'Discover artists, earn CLAPS points, climb the leaderboard! The hottest creator economy on Farcaster 🔥👏',
    site: '@artclaps', // Add your Twitter handle
    creator: '@artclaps',
    images: [
      {
        url: 'https://art-claps.vercel.app/twitter-image.png', // We'll create this
        width: 1200,
        height: 600,
        alt: 'Art Claps - SocialFi Platform',
      },
    ],
  },

  // Additional Meta Tags
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Icons and Favicon
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },

  // Manifest for PWA
  manifest: '/site.webmanifest',

  // Additional SEO
  category: 'SocialFi',
  classification: 'Social Media Platform',
  referrer: 'origin-when-cross-origin',
}

// Also add these additional meta tags in the <head> if needed
const additionalMetaTags = `
  <!-- Additional Social Media Meta Tags -->
  <meta property="fb:app_id" content="YOUR_FACEBOOK_APP_ID" />
  <meta name="theme-color" content="#8B5CF6" />
  <meta name="msapplication-TileColor" content="#8B5CF6" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  
  <!-- Rich Snippets -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Art Claps",
    "description": "SocialFi platform for Farcaster creators to earn CLAPS points and build community",
    "url": "https://art-claps.vercel.app",
    "applicationCategory": "SocialNetworkingApplication",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "author": {
      "@type": "Organization",
      "name": "Art Claps"
    }
  }
  </script>
`;
