// app/api/sync-farcaster/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const { userFid } = await request.json();

    if (!userFid) {
      return NextResponse.json(
        { error: 'userFid is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Starting Farcaster sync for FID: ${userFid}`);

    // Step 1: Check if user exists
    console.log('Step 1: Checking user...');
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, "farcasterFid", "username"')
      .eq('"farcasterFid"', userFid)
      .single();

    if (userError) {
      console.error('User query error:', userError);
      return NextResponse.json({
        error: `Database error: ${userError.message}`,
        step: 'user_lookup'
      }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    console.log(`✅ Found user: ${user.username}`);

    // Step 2: Check for verified artists
    console.log('Step 2: Checking for verified artists...');
    const { data: artists, error: artistsError } = await supabase
      .from('users')
      .select('id, "farcasterFid", "username"')
      .eq('"artistStatus"', 'verified_artist');

    if (artistsError) {
      console.error('Artists query error:', artistsError);
      return NextResponse.json({
        error: `Database error: ${artistsError.message}`,
        step: 'artists_lookup'
      }, { status: 500 });
    }

    if (!artists || artists.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No verified artists found to sync against',
        activitiesDetected: 0
      });
    }

    console.log(`✅ Found ${artists.length} verified artists`);

    // Step 3: Test Farcaster Hub API
    console.log('Step 3: Testing Farcaster Hub API...');
    
    try {
      const testResponse = await fetch(`https://hub.farcaster.xyz/v1/info`);
      
      if (!testResponse.ok) {
        throw new Error(`Hub API returned ${testResponse.status}`);
      }
      
      const hubInfo = await testResponse.json();
      console.log('✅ Farcaster Hub API is accessible');
      
    } catch (hubError) {
      console.error('Farcaster Hub API error:', hubError);
      return NextResponse.json({
        error: `Failed to connect to Farcaster Hub: ${hubError instanceof Error ? hubError.message : String(hubError)}`,
        step: 'farcaster_hub_test'
      }, { status: 500 });
    }

    // Step 4: Try to fetch user's reactions
    console.log('Step 4: Fetching user reactions...');
    
    try {
      const reactionsResponse = await fetch(
        `https://hub.farcaster.xyz/v1/reactionsByFid?fid=${userFid}&pageSize=10`
      );

      if (!reactionsResponse.ok) {
        throw new Error(`Reactions API returned ${reactionsResponse.status}`);
      }

      const reactionsData = await reactionsResponse.json();
      console.log(`✅ Retrieved ${reactionsData.messages?.length || 0} reactions`);

      return NextResponse.json({
        success: true,
        message: `Debug complete. Found ${artists.length} artists and ${reactionsData.messages?.length || 0} reactions.`,
        activitiesDetected: 0,
        debug: {
          userFound: true,
          artistsCount: artists.length,
          reactionsCount: reactionsData.messages?.length || 0,
          hubApiWorking: true
        }
      });

    } catch (reactionError) {
      console.error('Reactions fetch error:', reactionError);
      return NextResponse.json({
        error: `Failed to fetch reactions: ${reactionError instanceof Error ? reactionError.message : String(reactionError)}`,
        step: 'fetch_reactions'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('General sync error:', error);
    return NextResponse.json({
      error: `Sync failed: ${error instanceof Error ? error.message : String(error)}`,
      step: 'general_error'
    }, { status: 500 });
  }
}
