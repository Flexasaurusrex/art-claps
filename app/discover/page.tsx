// app/api/leaderboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all'; // 'all', 'weekly', 'monthly'
    const currentUserFid = searchParams.get('currentUserFid');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Determine which points column to use
    let pointsColumn = 'totalPoints';
    if (period === 'weekly') pointsColumn = 'weeklyPoints';
    if (period === 'monthly') pointsColumn = 'monthlyPoints';

    // Get leaderboard data
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        id,
        farcasterFid,
        username,
        displayName,
        pfpUrl,
        artistStatus,
        totalPoints,
        weeklyPoints,
        monthlyPoints,
        follower_count,
        following_count
      `)
      .not(pointsColumn, 'is', null)
      .gt(pointsColumn, 0)
      .order(pointsColumn, { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching leaderboard:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch leaderboard' },
        { status: 500 }
      );
    }

    // Add rankings to users
    const rankedUsers = users.map((user, index) => ({
      ...user,
      rank: offset + index + 1,
      points: (user as any)[pointsColumn] || 0
    }));

    // Get current user's position if FID provided
    let currentUserRank = null;
    if (currentUserFid) {
      const { data: currentUser } = await supabase
        .from('users')
        .select(`farcasterFid, ${pointsColumn}`)
        .eq('farcasterFid', parseInt(currentUserFid))
        .single();

      if (currentUser && (currentUser as any)[pointsColumn] > 0) {
        // Count users with higher points to get rank
        const { count } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .gt(pointsColumn, (currentUser as any)[pointsColumn]);

        currentUserRank = (count || 0) + 1;
      }
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .not(pointsColumn, 'is', null)
      .gt(pointsColumn, 0);

    // Get some fun stats
    const { data: stats } = await supabase
      .from('users')
      .select(pointsColumn)
      .not(pointsColumn, 'is', null)
      .gt(pointsColumn, 0);

    const totalPointsAwarded = stats?.reduce((sum, user) => sum + ((user as any)[pointsColumn] || 0), 0) || 0;
    const averagePoints = stats?.length ? Math.round(totalPointsAwarded / stats.length) : 0;

    return NextResponse.json({
      success: true,
      data: {
        users: rankedUsers,
        currentUserRank,
        pagination: {
          total: totalCount || 0,
          limit,
          offset,
          hasMore: (offset + limit) < (totalCount || 0)
        },
        stats: {
          totalUsers: totalCount || 0,
          totalPointsAwarded,
          averagePoints,
          period
        }
      }
    });

  } catch (error) {
    console.error('Error in leaderboard API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
