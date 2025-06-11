// app/api/user/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get('fid');
    const userId = searchParams.get('userId');

    if (!fid && !userId) {
      return NextResponse.json(
        { error: 'Either fid or userId is required' },
        { status: 400 }
      );
    }

    // Find the user
    let user;
    if (fid) {
      user = await prisma.user.findUnique({
        where: { farcasterFid: parseInt(fid) },
        include: {
          activitiesGiven: {
            where: {
              createdAt: {
                gte: getWeekStart(),
              }
            }
          },
          activitiesReceived: true,
          connectionsFrom: true,
          connectionsTo: true
        }
      });
    } else {
      user = await prisma.user.findUnique({
        where: { id: userId! },
        include: {
          activitiesGiven: {
            where: {
              createdAt: {
                gte: getWeekStart(),
              }
            }
          },
          activitiesReceived: true,
          connectionsFrom: true,
          connectionsTo: true
        }
      });
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Calculate user's rank based on total points
    const rank = await prisma.user.count({
      where: {
        totalPoints: {
          gt: user.totalPoints
        }
      }
    }) + 1;

    // Calculate total number of users for percentile
    const totalUsers = await prisma.user.count();

    // Calculate weekly points from activities
    const weeklyPoints = user.activitiesGiven.reduce(
      (total, activity) => total + activity.pointsEarned, 
      0
    );

    // Calculate support ratio (given vs received)
    const supportRatio = user.supportReceived > 0 
      ? user.supportGiven / user.supportReceived 
      : user.supportGiven;

    // Get unique artists supported (count distinct target users)
    const uniqueArtistsSupported = await prisma.activity.groupBy({
      by: ['targetUserId'],
      where: {
        userId: user.id,
        targetUserId: { not: null }
      }
    });

    // Calculate streak days
    const streakDays = await calculateStreakDays(user.id);

    // Get today's points
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todaysActivities = await prisma.activity.findMany({
      where: {
        userId: user.id,
        createdAt: {
          gte: todayStart,
          lte: todayEnd
        }
      }
    });

    const todaysPoints = todaysActivities.reduce(
      (total, activity) => total + activity.pointsEarned,
      0
    );

    // Get leaderboard position context (users above and below)
    const usersAbove = await prisma.user.findMany({
      where: {
        totalPoints: { gt: user.totalPoints }
      },
      orderBy: { totalPoints: 'asc' },
      take: 3,
      select: {
        username: true,
        displayName: true,
        totalPoints: true,
        pfpUrl: true
      }
    });

    const usersBelow = await prisma.user.findMany({
      where: {
        totalPoints: { lt: user.totalPoints }
      },
      orderBy: { totalPoints: 'desc' },
      take: 3,
      select: {
        username: true,
        displayName: true,
        totalPoints: true,
        pfpUrl: true
      }
    });

    // Calculate percentile
    const percentile = Math.round(((totalUsers - rank + 1) / totalUsers) * 100);

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
        supportRatio: Math.round(supportRatio * 100) / 100,
        artistsSupported: uniqueArtistsSupported.length,
        
        // Social metrics
        connections: user.connectionsFrom.length + user.connectionsTo.length,
        activitiesCount: user.activitiesGiven.length + user.activitiesReceived.length,
        
        // Streak and consistency
        streakDays: streakDays,
        
        // Leaderboard context
        leaderboardContext: {
          usersAbove: usersAbove.reverse(), // Show closest to user first
          usersBelow: usersBelow
        },
        
        // Recent performance
        weeklyRank: await getWeeklyRank(user.id, weeklyPoints)
      }
    });

  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user statistics' },
      { status: 500 }
    );
  }
}

// Helper function to get start of current week (Monday)
function getWeekStart(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

// Helper function to calculate streak days
async function calculateStreakDays(userId: string): Promise<number> {
  try {
    // Get user's activities grouped by date (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activities = await prisma.activity.findMany({
      where: {
        userId: userId,
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Group activities by date
    const activitiesByDate = activities.reduce((acc, activity) => {
      const date = activity.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(activity);
      return acc;
    }, {} as Record<string, any[]>);

    // Calculate streak starting from today
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateString = checkDate.toISOString().split('T')[0];
      
      if (activitiesByDate[dateString] && activitiesByDate[dateString].length > 0) {
        streak++;
      } else {
        break; // Streak broken
      }
    }

    return streak;
  } catch (error) {
    console.error('Error calculating streak:', error);
    return 0;
  }
}

// Helper function to get weekly rank
async function getWeeklyRank(userId: string, userWeeklyPoints: number): Promise<number> {
  try {
    const weekStart = getWeekStart();
    
    // Get all users' weekly points
    const usersWithWeeklyPoints = await prisma.user.findMany({
      include: {
        activitiesGiven: {
          where: {
            createdAt: {
              gte: weekStart
            }
          }
        }
      }
    });

    // Calculate weekly points for each user and sort
    const weeklyRankings = usersWithWeeklyPoints
      .map(user => ({
        userId: user.id,
        weeklyPoints: user.activitiesGiven.reduce(
          (total, activity) => total + activity.pointsEarned,
          0
        )
      }))
      .sort((a, b) => b.weeklyPoints - a.weeklyPoints);

    // Find user's position
    const userRank = weeklyRankings.findIndex(user => user.userId === userId) + 1;
    return userRank || 1;
    
  } catch (error) {
    console.error('Error calculating weekly rank:', error);
    return 1;
  }
}
