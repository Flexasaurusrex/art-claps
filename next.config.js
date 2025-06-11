/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['imagedelivery.net', 'res.cloudinary.com', 'i.imgur.com'],
  },
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
  },
}

module.exports = nextConfig
