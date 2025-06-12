// app/api/admin/approve-artist/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { artistId, approved, adminFid } = body;

    if (!artistId || typeof approved !== 'boolean' || !adminFid) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify admin access (replace 7418 with your actual FID)
    if (adminFid !== 7418) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get the artist info
    const { data: artist, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', artistId)
      .eq('artistStatus', 'pending_artist')
      .single();

    if (fetchError || !artist) {
      return NextResponse.json(
        { error: 'Artist not found or not pending' },
        { status: 404 }
      );
    }

    if (approved) {
      // Approve the artist
      const { error: updateError } = await supabase
        .from('users')
        .update({
          artistStatus: 'verified_artist',
          verificationNotes: `Approved by admin on ${new Date().toISOString()}`,
          updatedAt: new Date().toISOString()
        })
        .eq('id', artistId);

      if (updateError) throw updateError;

      // Create initial referral codes for the new artist (3 codes)
      const referralCodes = [];
      for (let i = 0; i < 3; i++) {
        const code = generateReferralCode(artist.username);
        referralCodes.push({
          code,
          createdBy: artistId,
          used: false
        });
      }

      const { error: codesError } = await supabase
        .from('referral_codes')
        .insert(referralCodes);

      if (codesError) console.error('Error creating referral codes:', codesError);

      return NextResponse.json({
        success: true,
        message: `${artist.displayName} has been approved as a verified artist!`,
        referralCodes: referralCodes.map(rc => rc.code)
      });

    } else {
      // Reject the artist (change back to supporter)
      const { error: updateError } = await supabase
        .from('users')
        .update({
          artistStatus: 'supporter',
          verificationNotes: `Rejected by admin on ${new Date().toISOString()}`,
          updatedAt: new Date().toISOString()
        })
        .eq('id', artistId);

      if (updateError) throw updateError;

      return NextResponse.json({
        success: true,
        message: `Application from ${artist.displayName} has been rejected.`
      });
    }

  } catch (error) {
    console.error('Error processing approval:', error);
    return NextResponse.json(
      { error: 'Failed to process approval' },
      { status: 500 }
    );
  }
}

// Helper function to generate referral codes
function generateReferralCode(username: string): string {
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${username.toUpperCase()}-${randomSuffix}`;
}
