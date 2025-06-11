// app/api/activities/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, ActivityType } from '@prisma/client';

const prisma = new PrismaClient();

// Points awarded for different activities
const ACTIVITY_POINTS = {
  CLAP_REACTION: 5,
  SHARE_ARTIST_WORK: 15,
  QUALITY_REPLY: 10,
  ARTIST_DISCOVERY: 20,
  COLLABORATION_TAG: 25,
  DETAILED_CRITIQUE: 30,
  ARTIST_SPOTLIGHT: 40,
  RECAST_WITH_COMMENT: 12,
  ART_THREAD_CREATION: 35,
  ARTIST_TAG_MENTION: 8,
  FOLLOW_NEW_ARTIST: 10,
  CROSS_PROMOTION: 20,
  WORK_SHARED: 0, // Received activity, no points for user
  QUALITY_REPLY_RECEIVED: 0 // Received activity, no points for user
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId, 
      activityType, 
      targetUserId, 
      farcasterCastHash, 
      metadata 
    } = body;

    if (!userId || !activityType) {
      return NextResponse.json(
        { error: 'userId and activityType are required' },
        { status: 400 }
      );
    }

    // Validate activity type
    if (!Object.keys(ActivityType).includes(activityType)) {
      return NextResponse.json(
        { error: 'Invalid activity type' },
        { status: 400 }
      );
    }

    // Check for duplicate activities (prevent spam)
    if (farcasterCastHash) {
      const existingActivity = await prisma.activity.findFirst({
        where: {
          userId,
          activityType: activityType as ActivityType,
          farcasterCastHash,
          targetUserId
        }
      });

      if (existingActivity) {
        return NextResponse.json(
          { error: 'Activity already recorded' },
          { status: 409 }
        );
      }
    }

    // Calculate points for this activity
    const pointsEarned = ACTIVITY_POINTS[activityType as keyof typeof ACTIVITY_POINTS] || 0;

    // Create the activity record
    const activity = await prisma.activity.create({
      data: {
        userId,
        activityType: activityType as ActivityType,
        pointsEarned,
        targetUserId,
        farcasterCastHash,
        metadata,
        processed: true
      }
    });

    // Update user's point totals
    await prisma.user.update({
      where: { id: userId },
      data: {
        totalPoints: { increment: pointsEarned },
        weeklyPoints: { increment: pointsEarned },
        monthlyPoints: { increment: pointsEarned },
        supportGiven: { increment: 1 }
      }
    });

    // If there's a target user, update their support received count
    if (targetUserId) {
      await prisma.user.update({
        where: { id: targetUserId },
        data: {
          supportReceived: { increment: 1 }
        }
      });

      // Update artist connection
      await updateArtistConnection(userId, targetUserId);
    }

    return NextResponse.json({
      success: true,
      activity: {
        id: activity.id,
        activityType: activity.activityType,
        pointsEarned: activity.pointsEarned,
        createdAt: activity.createdAt
      },
      pointsAwarded: pointsEarned
    });

  } catch (error) {
    console.error('Error recording activity:', error);
    return NextResponse.json(
      { error: 'Failed to record activity' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const activities = await prisma.activity.findMany({
      where: { userId },
      include: {
        targetUser: {
          select: {
            username: true,
            displayName: true,
            pfpUrl: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    const totalActivities = await prisma.activity.count({
      where: { userId }
    });

    return NextResponse.json({
      success: true,
      activities,
      pagination: {
        total: totalActivities,
        limit,
        offset,
        hasMore: offset + limit < totalActivities
      }
    });

  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}

// Helper function to update artist connections
async function updateArtistConnection(fromUserId: string, toUserId: string) {
  try {
    const existingConnection = await prisma.artistConnection.findUnique({
      where: {
        fromUserId_toUserId: {
          fromUserId,
          toUserId
        }
      }
    });

    if (existingConnection) {
      // Update existing connection
      await prisma.artistConnection.update({
        where: {
          fromUserId_toUserId: {
            fromUserId,
            toUserId
          }
        },
        data: {
          interactionCount: { increment: 1 },
          lastInteraction: new Date(),
          relationshipStrength: { increment: 0.1 }
        }
      });
    } else {
      // Create new connection
      await prisma.artistConnection.create({
        data: {
          fromUserId,
          toUserId,
          interactionCount: 1,
          lastInteraction: new Date(),
          relationshipStrength: 1.0
        }
      });
    }
  } catch (error) {
    console.error('Error updating artist connection:', error);
    // Don't throw - connection updates shouldn't fail the main activity
  }
}
