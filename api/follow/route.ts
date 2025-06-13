// app/api/follow/route.ts
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

    // Don't allow self-following
    if (userFid === targetFid) {
      return NextResponse.json(
        { error: 'Cannot follow yourself' },
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

    // Check if follow relationship already exists
    const { data: existingFollow } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', targetUser.id)
      .single();

    let isFollowing = false;
    let action = '';

    if (existingFollow) {
      // Unfollow - remove the relationship
      const { error: unfollowError } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUser.id);

      if (unfollowError) throw unfollowError;

      // Update follow counts
      await Promise.all([
        supabase
          .from('users')
          .update({ following_count: Math.max(0, user.following_count - 1) })
          .eq('id', user.id),
        supabase
          .from('users')
          .update({ follower_count: Math.max(0, targetUser.follower_count - 1) })
          .eq('id', targetUser.id)
      ]);

      isFollowing = false;
      action = 'unfollowed';

    } else {
      // Follow - create the relationship
      const { error: followError } = await supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          following_id: targetUser.id
        });

      if (followError) throw followError;

      // Update follow counts
      await Promise.all([
        supabase
          .from('users')
          .update({ following_count: (user.following_count || 0) + 1 })
          .eq('id', user.id),
        supabase
          .from('users')
          .update({ follower_count: (targetUser.follower_count || 0) + 1 })
          .eq('id', targetUser.id)
      ]);

      // Award points for following new artists
      await supabase
        .from('activities')
        .insert({
          userId: user.id,
          targetUserId: targetUser.id,
          activityType: 'FOLLOW_NEW_ARTIST',
          pointsEarned: 10,
          processed: true,
          metadata: {
            action: 'follow',
            timestamp: new Date().toISOString()
          }
        });

      // Update user's total points
      await supabase
        .from('users')
        .update({
          totalPoints: (user.totalPoints || 0) + 10,
          weeklyPoints: (user.weeklyPoints || 0) + 10,
          monthlyPoints: (user.monthlyPoints || 0) + 10
        })
        .eq('id', user.id);

      isFollowing = true;
      action = 'followed';
    }

    return NextResponse.json({
      success: true,
      message: `Successfully ${action} ${targetUser.displayName}!`,
      isFollowing,
      pointsEarned: isFollowing ? 10 : 0,
      action
    });

  } catch (error) {
    console.error('Error processing follow:', error);
    return NextResponse.json(
      { error: 'Failed to process follow request' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userFid = searchParams.get('userFid');
    const targetFid = searchParams.get('targetFid');

    if (!userFid || !targetFid) {
      return NextResponse.json(
        { error: 'userFid and targetFid are required' },
        { status: 400 }
      );
    }

    // Find both users
    const [userResult, targetUserResult] = await Promise.all([
      supabase.from('users').select('id').eq('farcasterFid', parseInt(userFid)).single(),
      supabase.from('users').select('id').eq('farcasterFid', parseInt(targetFid)).single()
    ]);

    const user = userResult.data;
    const targetUser = targetUserResult.data;

    if (!user || !targetUser) {
      return NextResponse.json({
        success: true,
        isFollowing: false
      });
    }

    // Check if follow relationship exists
    const { data: existingFollow } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', targetUser.id)
      .single();

    return NextResponse.json({
      success: true,
      isFollowing: !!existingFollow
    });

  } catch (error) {
    console.error('Error checking follow status:', error);
    return NextResponse.json(
      { error: 'Failed to check follow status' },
      { status: 500 }
    );
  }
}
