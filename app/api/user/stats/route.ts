import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { farcasterFid: (session.user as any).fid }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const higherRankedCount = await prisma.user.count({
      where: { totalPoints: { gt: user.totalPoints } }
    })
    const rank = higherRankedCount + 1

    const supportRatio = user.supportReceived > 0 
      ? Number((user.supportGiven / user.supportReceived).toFixed(1))
      : user.supportGiven

    const artistsSupported = await prisma.activity.count({
      where: {
        userId: user.id,
        activityType: {
          in: ['SHARE_ARTIST_WORK', 'QUALITY_REPLY', 'COLLABORATION_TAG']
        }
      },
      distinct: ['targetUserId']
    })

    const stats = {
      totalPoints: user.totalPoints,
      weeklyPoints: user.weeklyPoints,
      monthlyPoints: user.monthlyPoints,
      rank,
      supportRatio,
      artistsSupported,
      supportGiven: user.supportGiven,
      supportReceived: user.supportReceived
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching user stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
