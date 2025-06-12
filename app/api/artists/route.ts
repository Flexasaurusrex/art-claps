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
    const currentUserFid = searchParams.get('currentUserFid');

    // ONLY show verified artists in discovery
    const { data: artists, error, count } = await supabase
      .from('users')
      .select('*', { count: 'exact' })
      .eq('artistStatus', 'verified_artist') // ONLY verified artists
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
      bio: artist.bio || `Verified artist on Farcaster • @${artist.username}`,
      verifiedArtist: true, // All results are verified artists
      claps: artist.supportReceived,
      totalActivities: 0,
      connections: 0,
      joinedAt: artist.createdAt,
      alreadyClappedToday: todaysClaps.includes(artist.id),
      artistStatus: artist.artistStatus
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

// Updated POST to handle artist applications
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      farcasterFid, 
      username, 
      displayName, 
      pfpUrl, 
      bio, 
      portfolioUrl,
      referralCode,
      applicationMessage
    } = body;

    if (!farcasterFid || !username) {
      return NextResponse.json(
        { error: 'Farcaster FID and username are required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('farcasterFid', parseInt(farcasterFid))
      .single();

    let artistStatus = 'supporter'; // Default for new users
    let referredBy = null;

    // Check referral code if provided
    if (referralCode) {
      const { data: validCode } = await supabase
        .from('referral_codes')
        .select('*')
        .eq('code', referralCode)
        .eq('used', false)
        .single();

      if (validCode) {
        artistStatus = 'verified_artist'; // Auto-verify with valid referral
        referredBy = validCode.createdBy;
        
        // Mark referral code as used
        await supabase
          .from('referral_codes')
          .update({ 
            used: true, 
            usedBy: existingUser?.id || 'pending'
          })
          .eq('code', referralCode);
      } else {
        return NextResponse.json(
          { error: 'Invalid or expired referral code' },
          { status: 400 }
        );
      }
    } else if (applicationMessage) {
      // Manual application - needs approval
      artistStatus = 'pending_artist';
    }

    const userData = {
      farcasterFid: parseInt(farcasterFid),
      username,
      displayName: displayName || username,
      pfpUrl,
      bio,
      artistStatus,
      referredBy,
      verificationNotes: applicationMessage || `Applied via ${referralCode ? 'referral' : 'manual application'}`,
      updatedAt: new Date().toISOString()
    };

    let user;
    if (existingUser) {
      // Update existing user
      const { data, error } = await supabase
        .from('users')
        .update(userData)
        .eq('farcasterFid', parseInt(farcasterFid))
        .select()
        .single();

      if (error) throw error;
      user = data;
    } else {
      // Create new user
      const { data, error } = await supabase
        .from('users')
        .insert({
          ...userData,
          totalPoints: 0,
          weeklyPoints: 0,
          monthlyPoints: 0,
          supportGiven: 0,
          supportReceived: 0
        })
        .select()
        .single();

      if (error) throw error;
      user = data;
    }

    const message = artistStatus === 'verified_artist' 
      ? 'Welcome! You are now a verified artist.' 
      : artistStatus === 'pending_artist'
      ? 'Application submitted! Awaiting approval.'
      : 'Account updated successfully.';

    return NextResponse.json({
      success: true,
      message,
      user: {
        id: user.id,
        fid: user.farcasterFid,
        username: user.username,
        displayName: user.displayName,
        artistStatus: user.artistStatus
      }
    });

  } catch (error) {
    console.error('Error creating/updating artist:', error);
    return NextResponse.json(
      { error: 'Failed to process artist application' },
      { status: 500 }
    );
  }
}
