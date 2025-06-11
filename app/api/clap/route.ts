// app/api/clap/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, ActivityType } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userFid, targetFid } = body;

    if (!userFid || !targetFid) {
      return NextResponse.json(
        { error: 'userFid and targetFid are required' },
        { status: 400 }
      );
    }

    // Don't allow self-clapping
    if (userFid === targetFid) {
      return NextResponse.json(
        { error: 'Cannot clap for yourself' },
        { status: 400 }
      );
    }

    // Find both users in our database
    const [user, targetUser] = await Promise.all([
      prisma.user.findUnique({
        where: { farcasterFid: parseInt(userFid) }
      }),
      prisma.user.findUnique({
        where: { farcasterFid: parseInt(targetFid) }
      })
    ]);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found. Please sign in again.' },
        { status: 404 }
      );
    }

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Target artist not found in our database' },
        { status: 404 }
      );
    }

    // Check if user already clapped for this artist today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingClap = await prisma.activity.findFirst({
      where: {
        userId: user.id,
        targetUserId: targetUser.id,
        activityType: ActivityType.CLAP_REACTION,
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    if (existingClap) {
      return NextResponse.json(
        { error: 'You already clapped for this artist today!' },
        { status: 409 }
      );
    }

    // Create the clap activity
    const activity = await prisma.activity.create({
      data: {
        userId: user.id,
        targetUserId: targetUser.id,
        activityType: ActivityType.CLAP_REACTION,
        pointsEarned: 5, // 5 points for a clap
        processed: true,
        metadata: {
          action: 'clap',
          timestamp: new Date().toISOString()
        }
      }
    });

    // Update user points
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        totalPoints: { increment: 5 },
        weeklyPoints: { increment: 5 },
        monthlyPoints: { increment: 5 },
        supportGiven: { increment: 1 }
      }
    });

    // Update target user's support received
    await prisma.user.update({
      where: { id: targetUser.id },
      data: {
        supportReceived: { increment: 1 }
      }
    });

    // Update artist connection
    await updateArtistConnection(user.id, targetUser.id);

    return NextResponse.json({
      success: true,
      message: 'Clap recorded successfully! +5 CLAPS points',
      pointsEarned: 5,
      newTotalPoints: updatedUser.totalPoints,
      activity: {
        id: activity.id,
        type: activity.activityType,
        createdAt: activity.createdAt
      }
    });

  } catch (error) {
    console.error('Error processing clap:', error);
    return NextResponse.json(
      { error: 'Failed to process clap' },
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
  }
}
