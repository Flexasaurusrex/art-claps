// app/api/follow/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Check follow status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userFid = searchParams.get('userFid');
    const targetFid = searchParams.get('targetFid');

    if (!userFid || !targetFid) {
      return NextResponse.json(
        { success: false, error: 'Missing userFid or targetFid' }, 
        { status: 400 }
      );
    }

    // Get user IDs from FIDs
    const [userResult, targetResult] = await Promise.all([
      supabase.from('users').select('id').eq('farcasterFid', parseInt(userFid)).single(),
      supabase.from('users').select('id').eq('farcasterFid', parseInt(targetFid)).single()
    ]);

    if (userResult.error || targetResult.error) {
      return NextResponse.json(
        { success: false, error: 'User not found' }, 
        { status: 404 }
      );
    }

    // Check if follow relationship exists
    const { data: followData, error: followError } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', userResult.data.id)
      .eq('following_id', targetResult.data.id)
      .single();

    return NextResponse.json({
      success: true,
      isFollowing: !!followData && !followError
    });

  } catch (error) {
    console.error('Error checking follow status:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// POST - Follow/Unfollow user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userFid, targetFid, action } = body;

    if (!userFid || !targetFid || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    if (!['follow', 'unfollow'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be "follow" or "unfollow"' }, 
        { status: 400 }
      );
    }

    // Get user IDs from FIDs
    const [userResult, targetResult] = await Promise.all([
      supabase.from('users').select('id, totalPoints').eq('farcasterFid', parseInt(userFid)).single(),
      supabase.from('users').select('id, follower_count').eq('farcasterFid', parseInt(targetFid)).single()
    ]);

    if (userResult.error || targetResult.error) {
      return NextResponse.json(
        { success: false, error: 'User not found' }, 
        { status: 404 }
      );
    }

    const userId = userResult.data.id;
    const targetId = targetResult.data.id;

    if (action === 'follow') {
      // Check if already following
      const { data: existingFollow } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', userId)
        .eq('following_id', targetId)
        .single();

      if (existingFollow) {
        return NextResponse.json(
          { success: false, error: 'Already following this user' }, 
          { status: 400 }
        );
      }

      // Create follow relationship
      const { error: followError } = await supabase
        .from('follows')
        .insert({
          follower_id: userId,
          following_id: targetId
        });

      if (followError) {
        console.error('Error creating follow:', followError);
        return NextResponse.json(
          { success: false, error: 'Failed to follow user' }, 
          { status: 500 }
        );
      }

      // Update follower count for target user
      const { error: targetUpdateError } = await supabase
        .from('users')
        .update({ 
          follower_count: (targetResult.data.follower_count || 0) + 1 
        })
        .eq('id', targetId);

      if (targetUpdateError) {
        console.error('Error updating target follower count:', targetUpdateError);
      }

      // Award 10 points to user and update following count
      const newTotalPoints = (userResult.data.totalPoints || 0) + 10;
      
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({ 
          totalPoints: newTotalPoints,
          weeklyPoints: supabase.sql`weeklyPoints + 10`,
          monthlyPoints: supabase.sql`monthlyPoints + 10`,
          following_count: supabase.sql`following_count + 1`
        })
        .eq('id', userId);

      if (userUpdateError) {
        console.error('Error updating user points:', userUpdateError);
      }

      // Record activity
      await supabase
        .from('activities')
        .insert({
          user_id: userId,
          type: 'follow_artist',
          points: 10,
          description: `Followed artist (FID: ${targetFid})`,
          metadata: { targetFid: parseInt(targetFid) }
        });

      return NextResponse.json({
        success: true,
        message: 'Successfully followed user',
        newTotalPoints: newTotalPoints
      });

    } else { // unfollow
      // Remove follow relationship
      const { error: unfollowError } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', userId)
        .eq('following_id', targetId);

      if (unfollowError) {
        console.error('Error unfollowing user:', unfollowError);
        return NextResponse.json(
          { success: false, error: 'Failed to unfollow user' }, 
          { status: 500 }
        );
      }

      // Update follower count for target user
      const { error: targetUpdateError } = await supabase
        .from('users')
        .update({ 
          follower_count: Math.max(0, (targetResult.data.follower_count || 0) - 1)
        })
        .eq('id', targetId);

      if (targetUpdateError) {
        console.error('Error updating target follower count:', targetUpdateError);
      }

      // Update following count for user (no points deducted)
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({ 
          following_count: supabase.sql`following_count - 1`
        })
        .eq('id', userId);

      if (userUpdateError) {
        console.error('Error updating user following count:', userUpdateError);
      }

      return NextResponse.json({
        success: true,
        message: 'Successfully unfollowed user'
      });
    }

  } catch (error) {
    console.error('Error in follow API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
