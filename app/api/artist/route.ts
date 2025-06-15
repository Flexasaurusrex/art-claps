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
    
    // IF USERNAME PROVIDED: Return single artist (for profile pages)
    if (username) {
      // Fetch specific artist profile
      const { data: artist, error: artistError } = await supabase
        .from('users')
        .select(`
          id,
          farcasterFid,
          username,
          displayName,
          pfpUrl,
          bio,
          artistStatus,
          totalPoints,
          supportReceived,
          createdAt,
          artistLinks,
          extendedBio
        `)
        .eq('username', username)
        .eq('artistStatus', 'verified_artist')
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
        .eq('targetUserId', artist.id)
        .eq('activityType', 'CLAP_REACTION');

      const totalClaps = clapData?.length || 0;

      // Get artist's connection count (supporters)
      const { data: connectionData } = await supabase
        .from('follows')
        .select('id')
        .eq('followedUserId', artist.id);

      const connections = connectionData?.length || 0;

      // Get artist's total activities
      const { data: activityData } = await supabase
        .from('activities')
        .select('id')
        .eq('targetUserId', artist.id);

      const totalActivities = activityData?.length || 0;

      // Check if current user already clapped today (if authenticated)
      let alreadyClappedToday = false;
      if (currentUserFid) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data: currentUser } = await supabase
          .from('users')
          .select('id')
          .eq('farcasterFid', parseInt(currentUserFid))
          .single();

        if (currentUser) {
          const { data: todayClap } = await supabase
            .from('activities')
            .select('id')
            .eq('userId', currentUser.id)
            .eq('targetUserId', artist.id)
            .eq('activityType', 'CLAP_REACTION')
            .gte('createdAt', today.toISOString())
            .single();

          alreadyClappedToday = !!todayClap;
        }
      }

      // Format the single artist response
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
        artistLinks: artist.artistLinks || [],
        follower_count: connections
      };

      // RETURN SINGLE ARTIST FORMAT (matching what frontend expects)
      return NextResponse.json({
        success: true,
        artist: artistProfile,        // Single artist object
        alreadyClappedToday
      });
    }
    
    // ELSE: Return multiple artists (for discover page)
    
    // Fetch all verified artists
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        id,
        farcasterFid,
        username,
        displayName,
        pfpUrl,
        bio,
        artistStatus,
        totalPoints,
        supportReceived,
        createdAt
      `)
      .eq('artistStatus', 'verified_artist')
      .order('totalPoints', { ascending: false });

    if (error) {
      console.error('Error fetching artists:', error);
      return NextResponse.json(
        { error: 'Failed to fetch artists' },
        { status: 500 }
      );
    }

    if (!users || users.length === 0) {
      return NextResponse.json({
        success: true,
        artists: []
      });
    }

    // Get clap counts for all artists
    const artistIds = users.map(user => user.id);
    const { data: allClaps } = await supabase
      .from('activities')
      .select('targetUserId')
      .eq('activityType', 'CLAP_REACTION')
      .in('targetUserId', artistIds);

    // Get connection counts for all artists
    const { data: allConnections } = await supabase
      .from('follows')
      .select('followedUserId')
      .in('followedUserId', artistIds);

    // Get total activities for all artists
    const { data: allActivities } = await supabase
      .from('activities')
      .select('targetUserId')
      .in('targetUserId', artistIds);

    // Check if current user already clapped today for each artist
    let userClapsToday = [];
    if (currentUserFid) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: currentUser } = await supabase
        .from('users')
        .select('id')
        .eq('farcasterFid', parseInt(currentUserFid))
        .single();

      if (currentUser) {
        const { data: todayClaps } = await supabase
          .from('activities')
          .select('targetUserId')
          .eq('userId', currentUser.id)
          .eq('activityType', 'CLAP_REACTION')
          .gte('createdAt', today.toISOString())
          .in('targetUserId', artistIds);

        userClapsToday = todayClaps?.map(clap => clap.targetUserId) || [];
      }
    }

    // Format artists with their stats
    const artistsWithStats = users.map(user => {
      const clapCount = allClaps?.filter(clap => clap.targetUserId === user.id).length || 0;
      const connectionCount = allConnections?.filter(conn => conn.followedUserId === user.id).length || 0;
      const activityCount = allActivities?.filter(activity => activity.targetUserId === user.id).length || 0;
      const alreadyClappedToday = userClapsToday.includes(user.id);

      return {
        id: user.id,
        fid: user.farcasterFid,
        username: user.username,
        displayName: user.displayName,
        pfpUrl: user.pfpUrl,
        bio: user.bio,
        verifiedArtist: user.artistStatus === 'verified_artist',
        claps: clapCount,
        totalActivities: activityCount,
        connections: connectionCount,
        alreadyClappedToday
      };
    });

    // Sort by claps (descending)
    artistsWithStats.sort((a, b) => b.claps - a.claps);

    return NextResponse.json({
      success: true,
      artists: artistsWithStats        // Array of artists
    });

  } catch (error) {
    console.error('Error fetching artists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch artists' },
      { status: 500 }
    );
  }
}
