// app/api/user/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('farcasterFid', farcasterFid)
      .single();

    let user;
    if (existingUser) {
      // Update existing user
      const { data, error } = await supabase
        .from('users')
        .update({
          username,
          displayName: displayName || username,
          pfpUrl,
          bio,
          updatedAt: new Date().toISOString()
        })
        .eq('farcasterFid', farcasterFid)
        .select()
        .single();

      if (error) throw error;
      user = data;
    } else {
      // Create new user
      const { data, error } = await supabase
        .from('users')
        .insert({
          farcasterFid,
          username,
          displayName: displayName || username,
          pfpUrl,
          bio,
          totalPoints: 0,
          weeklyPoints: 0,
          monthlyPoints: 0,
          supportGiven: 0,
          supportReceived: 0,
          verifiedArtist: false
        })
        .select()
        .single();

      if (error) throw error;
      user = data;
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

    const { data: user, error } = await supabase
      .from('users')
      .select(`
        *,
        activitiesGiven:activities!activities_userId_fkey(
          id,
          activityType,
          pointsEarned,
          createdAt
        ),
        activitiesReceived:activities!activities_targetUserId_fkey(
          id,
          activityType,
          pointsEarned,
          createdAt
        )
      `)
      .eq('farcasterFid', fid)
      .single();

    if (error || !user) {
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
        recentActivitiesGiven: user.activitiesGiven?.slice(0, 10) || [],
        recentActivitiesReceived: user.activitiesReceived?.slice(0, 10) || []
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
