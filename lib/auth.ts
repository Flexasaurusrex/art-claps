import { NextAuthOptions } from "next-auth"
import { prisma } from "./prisma"

export const authOptions: NextAuthOptions = {
  providers: [
    {
      id: "farcaster",
      name: "Farcaster",
      type: "oauth",
      authorization: {
        url: "https://warpcast.com/~/siwn",
        params: {
          scope: "read",
          response_type: "code",
        },
      },
      token: "https://api.warpcast.com/v2/oauth/token",
      userinfo: "https://api.warpcast.com/v2/me",
      clientId: process.env.FARCASTER_CLIENT_ID,
      clientSecret: process.env.FARCASTER_CLIENT_SECRET,
      profile(profile: any) {
        return {
          id: profile.fid.toString(),
          name: profile.displayName,
          email: `${profile.username}@farcaster.xyz`,
          image: profile.pfpUrl,
          fid: profile.fid,
          username: profile.username,
        }
      },
    },
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.fid = (profile as any).fid
        token.username = (profile as any).username
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).fid = token.fid
        (session.user as any).username = token.username
      }
      return session
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === "farcaster" && profile) {
        const p = profile as any
        await prisma.user.upsert({
          where: { farcasterFid: p.fid },
          update: {
            username: p.username,
            displayName: p.displayName,
            pfpUrl: p.pfpUrl,
            bio: p.bio,
          },
          create: {
            farcasterFid: p.fid,
            username: p.username,
            displayName: p.displayName,
            pfpUrl: p.pfpUrl,
            bio: p.bio,
          },
        })
      }
      return true
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
  },
}
