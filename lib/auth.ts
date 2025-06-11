import { NextAuthOptions } from "next-auth"
import { prisma } from "./prisma"

export const authOptions: NextAuthOptions = {
  providers: [
    {
      id: "farcaster",
      name: "Farcaster",
      type: "credentials",
      credentials: {
        message: { label: "Message", type: "text" },
        signature: { label: "Signature", type: "text" },
        name: { label: "Name", type: "text" },
        pfp: { label: "Pfp", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.message || !credentials?.signature) {
          return null
        }

        // For now, return a simple user object
        // We'll enhance this with proper Farcaster verification later
        return {
          id: "temp-user-123",
          name: credentials.name || "Farcaster User", 
          email: "user@farcaster.xyz",
          image: credentials.pfp || null,
        }
      },
    },
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
}
