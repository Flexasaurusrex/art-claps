// app/api/clap/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    // Find both users
    const [userResult, targetUserResult] = await Promise.all([
      supabase.from('users').select('*').eq('farcasterFid', parseInt(userFid)).single(),
      supabase.from('users').select('*').eq('farcasterFid', parseInt(targetFid)).single()
    ]);

    const user = userResult.data;
    const targetUser = targetUserResult.data;

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

    const { data: existingClap } = await supabase
      .from('activities')
      .select('id')
      .eq('userId', user.id)
      .eq('targetUserId', targetUser.id)
      .eq('activityType', 'CLAP_REACTION')
      .gte('createdAt', today.toISOString())
      .lt('createdAt', tomorrow.toISOString())
      .single();

    if (existingClap) {
      return NextResponse.json(
        { error: 'You already clapped for this artist today!' },
        { status: 409 }
      );
    }

    // Create the clap activity
    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .insert({
        userId: user.id,
        targetUserId: targetUser.id,
        activityType: 'CLAP_REACTION',
        pointsEarned: 5,
        processed: true,
        metadata: {
          action: 'clap',
          timestamp: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (activityError) throw activityError;

    // Update user points
    const { data: updatedUser, error: userUpdateError } = await supabase
      .from('users')
      .update({
        totalPoints: user.totalPoints + 5,
        weeklyPoints: user.weeklyPoints + 5,
        monthlyPoints: user.monthlyPoints + 5,
        supportGiven: user.supportGiven + 1
      })
      .eq('id', user.id)
      .select()
      .single();

    if (userUpdateError) throw userUpdateError;

    // Update target user's support received
    await supabase
      .from('users')
      .update({
        supportReceived: targetUser.supportReceived + 1
      })
      .eq('id', targetUser.id);

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
