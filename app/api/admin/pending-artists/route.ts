// app/api/admin/pending-artists/route.ts - SIMPLIFIED WORKING VERSION
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    // Get pending artists - SIMPLIFIED without foreign key relationships
    const { data: artists, error } = await supabase
      .from('users')
      .select(`
        id,
        "farcasterFid",
        username,
        "displayName",
        "pfpUrl",
        bio,
        verificationnotes,
        "createdAt",
        referredby
      `)
      .eq('artiststatus', 'pending_artist')
      .order('"createdAt"', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    console.log('Found pending artists:', artists?.length || 0);

    const formattedArtists = artists?.map(artist => ({
      id: artist.id,
      farcasterFid: artist.farcasterFid,
      username: artist.username,
      displayName: artist.displayName || artist.username,
      pfpUrl: artist.pfpUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${artist.username}`,
      bio: artist.bio || '',
      verificationNotes: artist.verificationnotes || '',
      createdAt: artist.createdAt,
      referredBy: null // Temporarily removed to fix the error
    })) || [];

    return NextResponse.json({
      success: true,
      artists: formattedArtists
    });

  } catch (error) {
    console.error('Error fetching pending artists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending artists', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// POST endpoint for approving/rejecting artists
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { artistId, action, adminNotes } = body;

    if (!artistId || !action) {
      return NextResponse.json(
        { error: 'Artist ID and action are required' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be either "approve" or "reject"' },
        { status: 400 }
      );
    }

    const newStatus = action === 'approve' ? 'verified_artist' : 'supporter';

    // Update artist status
    const { data: updatedArtist, error: updateError } = await supabase
      .from('users')
      .update({
        artiststatus: newStatus,
        verificationnotes: adminNotes || null,
        "updatedAt": new Date().toISOString()
      })
      .eq('id', artistId)
      .eq('artiststatus', 'pending_artist')
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      throw updateError;
    }

    if (!updatedArtist) {
      return NextResponse.json(
        { error: 'Artist not found or already processed' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Artist ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      artist: updatedArtist
    });

  } catch (error) {
    console.error('Error processing artist verification:', error);
    return NextResponse.json(
      { error: 'Failed to process artist verification', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
