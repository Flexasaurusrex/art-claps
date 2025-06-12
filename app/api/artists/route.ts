// app/api/artists/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const verified = searchParams.get('verified') === 'true';
    const currentUserFid = searchParams.get('currentUserFid');

    // Build query
    let query = supabase
      .from('users')
      .select('*', { count: 'exact' });

    if (verified) {
      query = query.eq('verifiedArtist', true);
    }

    const { data: artists, error, count } = await query
      .order('verifiedArtist', { ascending: false })
      .order('supportReceived', { ascending: false })
      .order('totalPoints', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Check which artists the current user has clapped for today
    let todaysClaps: string[] = [];
    if (currentUserFid) {
      const { data: currentUser } = await supabase
        .from('users')
        .select('id')
        .eq('farcasterFid', parseInt(currentUserFid))
        .single();

      if (currentUser) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const { data: claps } = await supabase
          .from('activities')
          .select('targetUserId')
          .eq('userId', currentUser.id)
          .eq('activityType', 'CLAP_REACTION')
          .gte('createdAt', today.toISOString())
          .lt('createdAt', tomorrow.toISOString());

        todaysClaps = claps?.map(clap => clap.targetUserId).filter(Boolean) || [];
      }
    }

    // Format the response
    const formattedArtists = artists?.map(artist => ({
      id: artist.id,
      fid: artist.farcasterFid,
      username: artist.username,
      displayName: artist.displayName || artist.username,
      pfpUrl: artist.pfpUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${artist.username}`,
      bio: artist.bio || `Artist on Farcaster • @${artist.username}`,
      verifiedArtist: artist.verifiedArtist,
      claps: artist.supportReceived,
      totalActivities: 0, // We can add this later if needed
      connections: 0, // We can add this later if needed
      joinedAt: artist.createdAt,
      alreadyClappedToday: todaysClaps.includes(artist.id)
    })) || [];

    return NextResponse.json({
      success: true,
      artists: formattedArtists,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (offset + limit) < (count || 0)
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

    const { data: artist, error } = await supabase
      .from('users')
      .upsert({
        farcasterFid: parseInt(farcasterFid),
        username,
        displayName: displayName || username,
        pfpUrl,
        bio,
        verifiedArtist: verifyAsArtist || false,
        updatedAt: new Date().toISOString()
      }, {
        onConflict: 'farcasterFid'
      })
      .select()
      .single();

    if (error) throw error;

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
