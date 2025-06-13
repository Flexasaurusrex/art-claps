// app/api/referrals/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
// Fix for dynamic server usage error
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userFid } = body;

    if (!userFid) {
      return NextResponse.json(
        { error: 'User FID is required' },
        { status: 400 }
      );
    }

    // Get user info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, username, artistStatus')
      .eq('farcasterFid', parseInt(userFid))
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Allow both verified artists and admins (FID 7418)
    const isAuthorized = user.artistStatus === 'verified_artist' || parseInt(userFid) === 7418;
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Only verified artists can generate referral codes' },
        { status: 403 }
      );
    }

    // Check current code count (limit to reasonable number)
    const { count: currentCodes } = await supabase
      .from('referral_codes')
      .select('*', { count: 'exact', head: true })
      .eq('createdby', user.id)
      .eq('used', false);

    if ((currentCodes || 0) >= 10) {
      return NextResponse.json(
        { error: 'Maximum number of unused codes reached (10)' },
        { status: 400 }
      );
    }

    // Generate unique code
    let attempts = 0;
    let code = '';
    let isUnique = false;

    while (!isUnique && attempts < 10) {
      code = generateReferralCode(user.username);
      
      const { data: existingCode } = await supabase
        .from('referral_codes')
        .select('id')
        .eq('code', code)
        .single();

      if (!existingCode) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return NextResponse.json(
        { error: 'Failed to generate unique code. Please try again.' },
        { status: 500 }
      );
    }

    // Create the referral code
    const { data: newCode, error: codeError } = await supabase
      .from('referral_codes')
      .insert({
        code,
        createdby: user.id,
        used: false
      })
      .select()
      .single();

    if (codeError) throw codeError;

    return NextResponse.json({
      success: true,
      message: 'Referral code generated successfully!',
      code: {
        id: newCode.id,
        code: newCode.code,
        used: false,
        createdAt: newCode.createdat,
        usedBy: null
      }
    });

  } catch (error) {
    console.error('Error generating referral code:', error);
    return NextResponse.json(
      { error: 'Failed to generate referral code' },
      { status: 500 }
    );
  }
}

// Helper function to generate referral codes
function generateReferralCode(username: string): string {
  const cleanUsername = username.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 6);
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const timestamp = Date.now().toString(36).substring(-2).toUpperCase();
  
  return `${cleanUsername}-${randomSuffix}${timestamp}`;
}
