// app/api/artist/[username]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;
    const { searchParams } = new URL(request.url);
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
        username,
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
      .eq('username', username)
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

// PUT endpoint for artists to update their profile
export async function PUT(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;
    const body = await request.json();
    const { 
      userFid, 
      extendedBio, 
      artistLinks 
    } = body;

    if (!userFid) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify the user is updating their own profile
    const { data: user } = await supabase
      .from('users')
      .select('id, username, "artistStatus"')
      .eq('"farcasterFid"', userFid)
      .eq('username', username)
      .single();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized or user not found' },
        { status: 403 }
      );
    }

    if (user.artistStatus !== 'verified_artist') {
      return NextResponse.json(
        { error: 'Only verified artists can update profile' },
        { status: 403 }
      );
    }

    // Validate artist links
    if (artistLinks && Array.isArray(artistLinks)) {
      for (const link of artistLinks) {
        if (!link.platform || !link.url || !link.label) {
          return NextResponse.json(
            { error: 'Invalid link format. Platform, URL, and label are required.' },
            { status: 400 }
          );
        }
        
        // Basic URL validation
        try {
          new URL(link.url);
        } catch {
          return NextResponse.json(
            { error: `Invalid URL: ${link.url}` },
            { status: 400 }
          );
        }
      }
    }

    // Update artist profile
    const updateData: any = {};
    if (extendedBio !== undefined) updateData.extendedBio = extendedBio;
    if (artistLinks !== undefined) updateData.artistLinks = artistLinks;

    const { error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Error updating artist profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
