// app/api/sync-farcaster/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userFid } = body;

    if (!userFid) {
      return NextResponse.json(
        { error: 'userFid is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Testing database for FID: ${userFid}`);

    // Test 1: Find user in database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, "farcasterFid", "username"')
      .eq('"farcasterFid"', userFid)
      .single();

    if (userError) {
      return NextResponse.json({
        error: `Database error: ${userError.message}`,
        step: 'user_lookup'
      }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({
        error: 'User not found in database',
        step: 'user_lookup'
      }, { status: 404 });
    }

    console.log(`✅ Found user: ${user.username}`);

    // Test 2: Find verified artists
    const { data: artists, error: artistsError } = await supabase
      .from('users')
      .select('id, "farcasterFid", "username"')
      .eq('"artistStatus"', 'verified_artist')
      .limit(5); // Just get a few for testing

    if (artistsError) {
      return NextResponse.json({
        error: `Artists query error: ${artistsError.message}`,
        step: 'artists_lookup'
      }, { status: 500 });
    }

    console.log(`✅ Found ${artists?.length || 0} verified artists`);

    // Test 3: Check existing activities (to test our activity table)
    const { data: existingActivities, error: activitiesError } = await supabase
      .from('activities')
      .select('id, "activityType"')
      .eq('"userId"', user.id)
      .limit(5);

    if (activitiesError) {
      return NextResponse.json({
        error: `Activities query error: ${activitiesError.message}`,
        step: 'activities_lookup'
      }, { status: 500 });
    }

    console.log(`✅ Found ${existingActivities?.length || 0} existing activities`);

    // Success! Database is working
    return NextResponse.json({
      success: true,
      message: `Database test successful! Found user ${user.username} and ${artists?.length || 0} artists.`,
      activitiesDetected: 0,
      debug: {
        userFound: true,
        username: user.username,
        artistsCount: artists?.length || 0,
        existingActivitiesCount: existingActivities?.length || 0,
        databaseWorking: true
      }
    });

  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({
      error: 'Database test failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
