// app/api/admin/pending-artists/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    // Get pending artists with referrer info
    const { data: artists, error } = await supabase
      .from('users')
      .select(`
        id,
        farcasterFid,
        username,
        displayName,
        pfpUrl,
        bio,
        verificationNotes,
        createdAt,
        referredBy,
        referrer:users!users_referredBy_fkey(
          username,
          displayName
        )
      `)
      .eq('artistStatus', 'pending_artist')
      .order('createdAt', { ascending: true });

    if (error) throw error;

    const formattedArtists = artists?.map(artist => ({
      id: artist.id,
      farcasterFid: artist.farcasterFid,
      username: artist.username,
      displayName: artist.displayName || artist.username,
      pfpUrl: artist.pfpUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${artist.username}`,
      bio: artist.bio || '',
      verificationNotes: artist.verificationNotes || '',
      createdAt: artist.createdAt,
      referredBy: artist.referrer ? {
        username: artist.referrer.username,
        displayName: artist.referrer.displayName
      } : null
    })) || [];

    return NextResponse.json({
      success: true,
      artists: formattedArtists
    });

  } catch (error) {
    console.error('Error fetching pending artists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending artists' },
      { status: 500 }
    );
  }
}
