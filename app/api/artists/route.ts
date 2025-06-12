// app/api/artists/route.ts - FIXED for your schema
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to safely extract data from Supabase foreign key relationships
function extractRelationshipData<T>(data: T | T[] | null): T | null {
  if (!data) return null;
  return Array.isArray(data) ? data[0] : data;
}

// GET - Return all verified artists for discovery page
export async function GET() {
  try {
    const { data: artists, error } = await supabase
      .from('users')
      .select(`
        id,
        username,
        "displayName",
        "pfpUrl",
        bio,
        "totalPoints",
        "weeklyPoints",
        "monthlyPoints",
        "supportReceived",
        "createdAt"
      `)
      .eq('artiststatus', 'verified_artist')  // Fixed: lowercase column name
      .order('"weeklyPoints"', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      artists: artists || []
    });

  } catch (error) {
    console.error('Error fetching artists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch artists' },
      { status: 500 }
    );
  }
}

// POST - Handle artist application
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

    // Check if user already exists
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('id, artiststatus')  // Fixed: lowercase column name
      .eq('"farcasterFid"', parseInt(farcasterFid))  // Fixed: quoted column name
      .single();

    if (userCheckError && userCheckError.code !== 'PGRST116') {
      throw userCheckError;
    }

    if (existingUser) {
      if (existingUser.artiststatus === 'verified_artist') {
        return NextResponse.json(
          { error: 'You are already a verified artist!' },
          { status: 400 }
        );
      }
      
      if (existingUser.artiststatus === 'pending_artist') {
        return NextResponse.json(
          { error: 'Your application is already under review' },
          { status: 400 }
        );
      }
    }

    let referrerId = null;
    let isInstantVerification = false;

    // Check referral code if provided
    if (referralCode) {
      const { data: referralData, error: referralError } = await supabase
        .from('referral_codes')
        .select(`
          id,
          createdby,  
          used,
          creator:users!referral_codes_createdby_fkey(
            id,
            username,
            artiststatus
          )
        `)
        .eq('code', referralCode.toUpperCase())
        .single();

      if (referralError || !referralData) {
        return NextResponse.json(
          { error: 'Invalid referral code' },
          { status: 400 }
        );
      }

      if (referralData.used) {
        return NextResponse.json(
          { error: 'This referral code has already been used' },
          { status: 400 }
        );
      }

      // Safely extract creator data
      const creatorData = extractRelationshipData(referralData.creator);
      
      if (!creatorData || creatorData.artiststatus !== 'verified_artist') {
        return NextResponse.json(
          { error: 'Invalid referral code - creator not verified' },
          { status: 400 }
        );
      }

      referrerId = referralData.createdby;
      isInstantVerification = true;
    }

    // Determine artist status
    const artistStatus = isInstantVerification ? 'verified_artist' : 'pending_artist';

    // Create or update user
    const userData = {
      "farcasterFid": parseInt(farcasterFid),  // Fixed: quoted column name
      username,
      "displayName": displayName || username,  // Fixed: quoted column name
      "pfpUrl": pfpUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,  // Fixed: quoted column name
      bio: bio || '',
      artiststatus: artistStatus,  // Fixed: lowercase column name
      verificationnotes: applicationMessage || 'Applied via referral code',  // Fixed: lowercase column name
      referredby: referrerId,  // Fixed: lowercase column name
      "totalPoints": 0,  // Fixed: quoted column name
      "weeklyPoints": 0,  // Fixed: quoted column name
      "monthlyPoints": 0,  // Fixed: quoted column name
      "supportGiven": 0,  // Fixed: quoted column name
      "supportReceived": 0,  // Fixed: quoted column name
      "createdAt": new Date().toISOString(),  // Fixed: quoted column name
      "updatedAt": new Date().toISOString()  // Fixed: quoted column name
    };

    let user;

    if (existingUser) {
      // Update existing user
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update(userData)
        .eq('id', existingUser.id)
        .select()
        .single();

      if (updateError) throw updateError;
      user = updatedUser;
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          id: `user_${Date.now()}_${Math.random().toString(36).substring(2)}`,
          ...userData
        })
        .select()
        .single();

      if (createError) throw createError;
      user = newUser;
    }

    // Mark referral code as used if instant verification
    if (isInstantVerification && referralCode) {
      const { error: referralUpdateError } = await supabase
        .from('referral_codes')
        .update({
          used: true,
          usedby: user.id,  // Fixed: lowercase column name
          updatedat: new Date().toISOString()  // Fixed: lowercase column name
        })
        .eq('code', referralCode.toUpperCase());

      if (referralUpdateError) {
        console.error('Error marking referral code as used:', referralUpdateError);
      }

      // Log the referral activity
      const { error: activityError } = await supabase
        .from('activities')
        .insert({
          id: `activity_${Date.now()}_${Math.random().toString(36).substring(2)}`,
          userId: user.id,
          activityType: 'ARTIST_DISCOVERY',
          pointsEarned: 0,
          targetUserId: referrerId,
          metadata: {
            referralCode: referralCode,
            instantVerification: true
          },
          processed: true,
          createdAt: new Date().toISOString()
        });

      if (activityError) {
        console.error('Error logging referral activity:', activityError);
      }
    }

    // Return success response
    const message = isInstantVerification
      ? `🎉 Welcome to Art Claps! You've been instantly verified and can now receive claps from supporters. Start sharing your art!`
      : `✨ Application submitted successfully! We'll review your application and get back to you soon. Thank you for wanting to join our community!`;

    return NextResponse.json({
      success: true,
      message,
      user: {
        id: user.id,
        artistStatus: user.artiststatus,  // Fixed: lowercase column name
        instantVerification: isInstantVerification
      }
    });

  } catch (error) {
    console.error('Error processing artist application:', error);
    return NextResponse.json(
      { error: 'Failed to process application' },
      { status: 500 }
    );
  }
}
