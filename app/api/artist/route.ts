import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');
    const currentUserFid = searchParams.get('currentUserFid');

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Fetch artist profile
    const { data: artist, error: artistError } = await supabase
      .from('users')
      .select(`
        id,
        "farcasterFid",
        "username",
        "displayName",
        "pfpUrl",
        bio,
        "artistStatus",
        "totalPoints",
        "supportReceived",
        "createdAt",
        "artistLinks",
        "extendedBio"
      `)
      .eq('"username"', username)
      .eq('"artistStatus"', 'verified_artist')
      .single();

    if (artistError || !artist) {
      return NextResponse.json(
        { error: 'Artist not found' },
        { status: 404 }
      );
    }

    // Get artist's total claps received
    const { data: clapData } = await supabase
      .from('activities')
      .select('id')
      .eq('"targetUserId"', artist.id)
      .eq('"activityType"', 'CLAP_REACTION');

    const totalClaps = clapData?.length || 0;

    // Get artist's connection count (supporters)
    const { data: connectionData } = await supabase
      .from('artist_connections')
      .select('id')
      .eq('"toUserId"', artist.id);

    const connections = connectionData?.length || 0;

    // Get artist's total activities
    const { data: activityData } = await supabase
      .from('activities')
      .select('id')
      .eq('"targetUserId"', artist.id);

    const totalActivities = activityData?.length || 0;

    // Check if current user already clapped today (if authenticated)
    let alreadyClappedToday = false;
    if (currentUserFid) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: currentUser } = await supabase
        .from('users')
        .select('id')
        .eq('"farcasterFid"', parseInt(currentUserFid))
        .single();

      if (currentUser) {
        const { data: todayClap } = await supabase
          .from('activities')
          .select('id')
          .eq('"userId"', currentUser.id)
          .eq('"targetUserId"', artist.id)
          .eq('"activityType"', 'CLAP_REACTION')
          .gte('"createdAt"', today.toISOString())
          .single();

        alreadyClappedToday = !!todayClap;
      }
    }

    // Format the response
    const artistProfile = {
      id: artist.id,
      farcasterFid: artist.farcasterFid,
      username: artist.username,
      displayName: artist.displayName,
      pfpUrl: artist.pfpUrl,
      bio: artist.bio,
      extendedBio: artist.extendedBio,
      verifiedArtist: artist.artistStatus === 'verified_artist',
      claps: totalClaps,
      connections: connections,
      totalActivities: totalActivities,
      supportReceived: artist.supportReceived || 0,
      joinedDate: artist.createdAt,
      artistLinks: artist.artistLinks || []
    };

    return NextResponse.json({
      success: true,
      artist: artistProfile,
      alreadyClappedToday
    });

  } catch (error) {
    console.error('Error fetching artist profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch artist profile' },
      { status: 500 }
    );
  }
}
