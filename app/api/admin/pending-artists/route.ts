// app/api/admin/pending-artists/route.ts - FIXED COLUMN NAMES
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to safely extract data from Supabase foreign key relationships
function extractRelationshipData<T>(data: T | T[] | null): T | null {
  if (!data) return null;
  return Array.isArray(data) ? data[0] : data;
}

export async function GET(request: NextRequest) {
  try {
    // Get pending artists with referrer info - FIXED: using lowercase column names
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
        referredby,
        referrer:users!users_referredby_fkey(
          username,
          "displayName"
        )
      `)
      .eq('artiststatus', 'pending_artist')  // FIXED: lowercase column name
      .order('"createdAt"', { ascending: true });  // FIXED: quoted column name

    if (error) throw error;

    const formattedArtists = artists?.map(artist => {
      // Safely handle referrer relationship data (can be array or single object)
      const referrerData = extractRelationshipData(artist.referrer);
      
      return {
        id: artist.id,
        farcasterFid: artist.farcasterFid,
        username: artist.username,
        displayName: artist.displayName || artist.username,
        pfpUrl: artist.pfpUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${artist.username}`,
        bio: artist.bio || '',
        verificationNotes: artist.verificationnotes || '',  // FIXED: lowercase column name
        createdAt: artist.createdAt,
        referredBy: referrerData ? {
          username: referrerData.username,
          displayName: referrerData.displayName
        } : null
      };
    }) || [];

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

// POST endpoint for approving/rejecting artists - FIXED COLUMN NAMES
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

    // Update artist status - FIXED: using lowercase column names
    const { data: updatedArtist, error: updateError } = await supabase
      .from('users')
      .update({
        artiststatus: newStatus,  // FIXED: lowercase column name
        verificationnotes: adminNotes || null,  // FIXED: lowercase column name  
        "updatedAt": new Date().toISOString()  // FIXED: quoted column name
      })
      .eq('id', artistId)
      .eq('artiststatus', 'pending_artist')  // FIXED: lowercase column name
      .select()
      .single();

    if (updateError) throw updateError;

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
      { error: 'Failed to process artist verification' },
      { status: 500 }
    );
  }
}
