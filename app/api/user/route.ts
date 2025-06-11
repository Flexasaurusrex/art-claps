// app/api/user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { farcasterFid, username, displayName, pfpUrl, bio } = body;

    if (!farcasterFid || !username) {
      return NextResponse.json(
        { error: 'Farcaster FID and username are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { farcasterFid: parseInt(farcasterFid) }
    });

    if (user) {
      // Update existing user with latest Farcaster data
      user = await prisma.user.update({
        where: { farcasterFid: parseInt(farcasterFid) },
        data: {
          username,
          displayName: displayName || username,
          pfpUrl,
          bio,
          updatedAt: new Date()
        }
      });
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          farcasterFid: parseInt(farcasterFid),
          username,
          displayName: displayName || username,
          pfpUrl,
          bio,
          totalPoints: 0,
          weeklyPoints: 0,
          monthlyPoints: 0,
          supportGiven: 0,
          supportReceived: 0,
          verifiedArtist: false // Can be manually verified later
        }
      });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        farcasterFid: user.farcasterFid,
        username: user.username,
        displayName: user.displayName,
        pfpUrl: user.pfpUrl,
        totalPoints: user.totalPoints,
        weeklyPoints: user.weeklyPoints,
        monthlyPoints: user.monthlyPoints,
        verifiedArtist: user.verifiedArtist
      }
    });

  } catch (error) {
    console.error('Error managing user:', error);
    return NextResponse.json(
      { error: 'Failed to create/update user' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get('fid');

    if (!fid) {
      return NextResponse.json(
        { error: 'Farcaster FID is required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { farcasterFid: parseInt(fid) },
      include: {
        activitiesGiven: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        activitiesReceived: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        farcasterFid: user.farcasterFid,
        username: user.username,
        displayName: user.displayName,
        pfpUrl: user.pfpUrl,
        totalPoints: user.totalPoints,
        weeklyPoints: user.weeklyPoints,
        monthlyPoints: user.monthlyPoints,
        supportGiven: user.supportGiven,
        supportReceived: user.supportReceived,
        verifiedArtist: user.verifiedArtist,
        recentActivitiesGiven: user.activitiesGiven,
        recentActivitiesReceived: user.activitiesReceived
      }
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}
