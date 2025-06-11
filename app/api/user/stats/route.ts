// app/api/user/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Proper Prisma client initialization for serverless
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get('fid');
    const userId = searchParams.get('userId');

    // If no parameters provided, return default stats
    if (!fid && !userId) {
      return NextResponse.json({
        success: true,
        stats: {
          totalPoints: 0,
          weeklyPoints: 0,
          monthlyPoints: 0,
          todaysPoints: 0,
          rank: 1,
          totalUsers: 1,
          percentile: 100,
          supportGiven: 0,
          supportReceived: 0,
          supportRatio: 0,
          artistsSupported: 0,
          connections: 0,
          activitiesCount: 0,
          streakDays: 0
        }
      });
    }

    // Find the user
    let user;
    if (fid) {
      user = await prisma.user.findUnique({
        where: { farcasterFid: parseInt(fid) }
      });
    } else {
      user = await prisma.user.findUnique({
        where: { id: userId! }
      });
    }

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
        stats: {
          totalPoints: 0,
          weeklyPoints: 0,
          monthlyPoints: 0,
          todaysPoints: 0,
          rank: 1,
          totalUsers: 1,
          percentile: 0,
          supportGiven: 0,
          supportReceived: 0,
          supportRatio: 0,
          artistsSupported: 0,
          connections: 0,
          activitiesCount: 0,
          streakDays: 0
        }
      });
    }

    // Calculate basic stats
    const [rankCount, totalUsers, weeklyActivities, todaysActivities, artistsSupported] = await Promise.all([
      // Calculate rank
      prisma.user.count({
        where: {
          totalPoints: {
            gt: user.totalPoints
          }
        }
      }),
      // Total users
      prisma.user.count(),
      // Weekly activities
      prisma.activity.findMany({
        where: {
          userId: user.id,
          createdAt: {
            gte: getWeekStart()
          }
        }
      }),
      // Today's activities
      prisma.activity.findMany({
        where: {
          userId: user.id,
          createdAt: {
            gte: getTodayStart(),
            lte: getTodayEnd()
          }
        }
      }),
      // Unique artists supported
      prisma.activity.groupBy({
        by: ['targetUserId'],
        where: {
          userId: user.id,
          targetUserId: { not: null }
        }
      })
    ]);

    const rank = rankCount + 1;
    const percentile = totalUsers > 0 ? Math.round(((totalUsers - rank + 1) / totalUsers) * 100) : 100;
    
    const weeklyPoints = weeklyActivities.reduce((sum, activity) => sum + activity.pointsEarned, 0);
    const todaysPoints = todaysActivities.reduce((sum, activity) => sum + activity.pointsEarned, 0);
    
    const supportRatio = user.supportReceived > 0 
      ? Math.round((user.supportGiven / user.supportReceived) * 100) / 100
      : user.supportGiven;

    return NextResponse.json({
      success: true,
      stats: {
        // Core stats
        totalPoints: user.totalPoints,
        weeklyPoints: weeklyPoints,
        monthlyPoints: user.monthlyPoints,
        todaysPoints: todaysPoints,
        
        // Rankings
        rank: rank,
        totalUsers: totalUsers,
        percentile: percentile,
        
        // Engagement metrics
        supportGiven: user.supportGiven,
        supportReceived: user.supportReceived,
        supportRatio: supportRatio,
        artistsSupported: artistsSupported.length,
        
        // Basic counts (we'll enhance these later)
        connections: 0, // Will be calculated when we need it
        activitiesCount: weeklyActivities.length + todaysActivities.length,
        streakDays: 0 // Will be calculated when we need it
      }
    });

  } catch (error) {
    console.error('Error fetching user stats:', error);
    
    // Return safe fallback data instead of erroring
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch user statistics',
      stats: {
        totalPoints: 0,
        weeklyPoints: 0,
        monthlyPoints: 0,
        todaysPoints: 0,
        rank: 1,
        totalUsers: 1,
        percentile: 0,
        supportGiven: 0,
        supportReceived: 0,
        supportRatio: 0,
        artistsSupported: 0,
        connections: 0,
        activitiesCount: 0,
        streakDays: 0
      }
    });
  }
}

// Helper functions
function getWeekStart(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getTodayStart(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function getTodayEnd(): Date {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return today;
}
