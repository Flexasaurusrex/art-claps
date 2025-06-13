// app/api/activities/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    const validActivityTypes = [
      'SHARE_ARTIST_WORK',
      'QUALITY_REPLY',
      'ARTIST_DISCOVERY',
      'WORK_SHARED',
      'QUALITY_REPLY_RECEIVED',
      'COLLABORATION_TAG',
      'CROSS_PROMOTION',
      'CLAP_REACTION',
      'DETAILED_CRITIQUE',
      'ARTIST_SPOTLIGHT',
      'RECAST_WITH_COMMENT',
      'ART_THREAD_CREATION',
      'ARTIST_TAG_MENTION',
      'FOLLOW_NEW_ARTIST',
      'ART_EVENT_PROMOTION',
      'CROSS_PLATFORM_SHARE',
      'TUTORIAL_CREATION'
    ];

    if (!validActivityTypes.includes(activityType)) {
      return NextResponse.json(
        { error: 'Invalid activity type' },
        { status: 400 }
      );
    }

    // Check for duplicate activities (prevent spam)
    if (farcasterCastHash) {
      const { data: existingActivity } = await supabase
        .from('activities')
        .select('id')
        .eq('userId', userId)
        .eq('activityType', activityType)
        .eq('farcasterCastHash', farcasterCastHash)
        .eq('targetUserId', targetUserId)
        .single();

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
    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .insert({
        userId,
        activityType,
        pointsEarned,
        targetUserId,
        farcasterCastHash,
        metadata,
        processed: true
      })
      .select()
      .single();

    if (activityError) throw activityError;

    // Update user's point totals
    const { data: user } = await supabase
      .from('users')
      .select('totalPoints, weeklyPoints, monthlyPoints, supportGiven')
      .eq('id', userId)
      .single();

    if (user) {
      await supabase
        .from('users')
        .update({
          totalPoints: user.totalPoints + pointsEarned,
          weeklyPoints: user.weeklyPoints + pointsEarned,
          monthlyPoints: user.monthlyPoints + pointsEarned,
          supportGiven: user.supportGiven + 1
        })
        .eq('id', userId);
    }

    // If there's a target user, update their support received count
    if (targetUserId) {
      const { data: targetUser } = await supabase
        .from('users')
        .select('supportReceived')
        .eq('id', targetUserId)
        .single();

      if (targetUser) {
        await supabase
          .from('users')
          .update({
            supportReceived: targetUser.supportReceived + 1
          })
          .eq('id', targetUserId);
      }

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

    const { data: activities, error, count } = await supabase
      .from('activities')
      .select(`
        *,
        targetUser:users!activities_targetUserId_fkey(
          username,
          displayName,
          pfpUrl
        )
      `, { count: 'exact' })
      .eq('userId', userId)
      .order('createdAt', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      activities: activities || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (offset + limit) < (count || 0)
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
    const { data: existingConnection } = await supabase
      .from('artist_connections')
      .select('*')
      .eq('fromUserId', fromUserId)
      .eq('toUserId', toUserId)
      .single();

    if (existingConnection) {
      await supabase
        .from('artist_connections')
        .update({
          interactionCount: existingConnection.interactionCount + 1,
          lastInteraction: new Date().toISOString(),
          relationshipStrength: existingConnection.relationshipStrength + 0.1
        })
        .eq('fromUserId', fromUserId)
        .eq('toUserId', toUserId);
    } else {
      await supabase
        .from('artist_connections')
        .insert({
          fromUserId,
          toUserId,
          interactionCount: 1,
          lastInteraction: new Date().toISOString(),
          relationshipStrength: 1.0
        });
    }
  } catch (error) {
    console.error('Error updating artist connection:', error);
  }
}
