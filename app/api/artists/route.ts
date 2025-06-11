// app/api/artists/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const verified = searchParams.get('verified') === 'true';
    const currentUserFid = searchParams.get('currentUserFid');

    // Build where clause
    const where: any = {};
    if (verified) {
      where.verifiedArtist = true;
    }

    // Fetch artists with their stats
    const artists = await prisma.user.findMany({
      where,
      select: {
        id: true,
        farcasterFid: true,
        username: true,
        displayName: true,
        pfpUrl: true,
        bio: true,
        verifiedArtist: true,
        totalPoints: true,
        supportReceived: true,
        createdAt: true,
        _count: {
          select: {
            activitiesReceived: true,
            connectionsTo: true
          }
        }
      },
      orderBy: [
        { verifiedArtist: 'desc' }, // Verified artists first
        { supportReceived: 'desc' }, // Then by support received
        { totalPoints: 'desc' } // Then by total points
      ],
      take: limit,
      skip: offset
    });

    // If we have a current user, check which artists they've already clapped for today
    let todaysClaps: string[] = [];
    if (currentUserFid) {
      const currentUser = await prisma.user.findUnique({
        where: { farcasterFid: parseInt(currentUserFid) }
      });

      if (currentUser) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const clappedToday = await prisma.activity.findMany({
          where: {
            userId: currentUser.id,
            activityType: 'CLAP_REACTION',
            createdAt: {
              gte: today,
              lt: tomorrow
            }
          },
          select: {
            targetUserId: true
          }
        });

        todaysClaps = clappedToday.map(clap => clap.targetUserId!);
      }
    }

    // Format the response
    const formattedArtists = artists.map(artist => ({
      id: artist.id,
      fid: artist.farcasterFid,
      username: artist.username,
      displayName: artist.displayName || artist.username,
      pfpUrl: artist.pfpUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${artist.username}`,
      bio: artist.bio || `Artist on Farcaster • @${artist.username}`,
      verifiedArtist: artist.verifiedArtist,
      claps: artist.supportReceived,
      totalActivities: artist._count.activitiesReceived,
      connections: artist._count.connectionsTo,
      joinedAt: artist.createdAt,
      alreadyClappedToday: todaysClaps.includes(artist.id)
    }));

    const totalArtists = await prisma.user.count({ where });

    return NextResponse.json({
      success: true,
      artists: formattedArtists,
      pagination: {
        total: totalArtists,
        limit,
        offset,
        hasMore: offset + limit < totalArtists
      }
    });

  } catch (error) {
    console.error('Error fetching artists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch artists' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { farcasterFid, username, displayName, pfpUrl, bio, verifyAsArtist } = body;

    if (!farcasterFid || !username) {
      return NextResponse.json(
        { error: 'Farcaster FID and username are required' },
        { status: 400 }
      );
    }

    // Create or update artist
    const artist = await prisma.user.upsert({
      where: { farcasterFid: parseInt(farcasterFid) },
      update: {
        username,
        displayName: displayName || username,
        pfpUrl,
        bio,
        verifiedArtist: verifyAsArtist || false,
        updatedAt: new Date()
      },
      create: {
        farcasterFid: parseInt(farcasterFid),
        username,
        displayName: displayName || username,
        pfpUrl,
        bio,
        verifiedArtist: verifyAsArtist || false,
        totalPoints: 0,
        weeklyPoints: 0,
        monthlyPoints: 0,
        supportGiven: 0,
        supportReceived: 0
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Artist created/updated successfully',
      artist: {
        id: artist.id,
        fid: artist.farcasterFid,
        username: artist.username,
        displayName: artist.displayName,
        verifiedArtist: artist.verifiedArtist
      }
    });

  } catch (error) {
    console.error('Error creating/updating artist:', error);
    return NextResponse.json(
      { error: 'Failed to create/update artist' },
      { status: 500 }
    );
  }
}
