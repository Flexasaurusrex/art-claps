// app/api/referrals/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    // Get user info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, artistStatus')
      .eq('farcasterFid', parseInt(fid))
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (user.artistStatus !== 'verified_artist') {
      return NextResponse.json(
        { error: 'Only verified artists can access referral codes' },
        { status: 403 }
      );
    }

    // Get referral codes with usage info
    const { data: codes, error: codesError } = await supabase
      .from('referral_codes')
      .select(`
        id,
        code,
        used,
        createdAt,
        usedBy:users!referral_codes_usedBy_fkey(
          username,
          displayName
        )
      `)
      .eq('createdBy', user.id)
      .order('createdAt', { ascending: false });

    if (codesError) throw codesError;

    const formattedCodes = codes?.map(code => ({
      id: code.id,
      code: code.code,
      used: code.used,
      createdAt: code.createdAt,
      usedBy: code.usedBy ? {
        username: code.usedBy.username,
        displayName: code.usedBy.displayName
      } : null
    })) || [];

    const totalCodes = codes?.length || 0;
    const usedCodes = codes?.filter(code => code.used).length || 0;

    return NextResponse.json({
      success: true,
      codes: formattedCodes,
      user: {
        artistStatus: user.artistStatus,
        totalCodes,
        usedCodes
      }
    });

  } catch (error) {
    console.error('Error fetching referral codes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referral codes' },
      { status: 500 }
    );
  }
}
