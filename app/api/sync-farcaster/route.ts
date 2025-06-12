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

    console.log(`🔍 Starting Farcaster sync for FID: ${userFid}`);

    // Get user from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, "farcasterFid", "username"')
      .eq('"farcasterFid"', userFid)
      .single();

    if (userError || !user) {
      return NextResponse.json({
        error: 'User not found in database'
      }, { status: 404 });
    }

    // Get verified artists
    const { data: artists, error: artistsError } = await supabase
      .from('users')
      .select('id, "farcasterFid", "username"')
      .eq('"artistStatus"', 'verified_artist');

    if (artistsError || !artists || artists.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No verified artists found to sync against',
        activitiesDetected: 0
      });
    }

    console.log(`👨‍🎨 Found ${artists.length} verified artists to check`);

    // Check when user last synced
    const { data: lastSyncData } = await supabase
      .from('users')
      .select('"lastFarcasterSync"')
      .eq('id', user.id)
      .single();

    const lastSync = lastSyncData?.lastFarcasterSync;
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // If user synced recently, don't allow frequent syncing
    if (lastSync) {
      const lastSyncDate = new Date(lastSync);
      const timeSinceLastSync = now.getTime() - lastSyncDate.getTime();
      const hoursAgo = timeSinceLastSync / (1000 * 60 * 60);
      
      if (hoursAgo < 1) {
        return NextResponse.json({
          success: true,
          message: `Please wait ${Math.ceil(60 - (timeSinceLastSync / 1000 / 60))} minutes before syncing again.`,
          activitiesDetected: 0
        });
      }
    }

    let totalActivitiesDetected = 0;
    const detectedActivities = [];

    // Simulate finding activities (since external API is problematic)
    // In a real implementation, this would query Farcaster Hub API
    const mockActivities = [
      {
        type: 'CLAP_REACTION',
        targetArtistId: artists[0]?.id,
        targetArtistUsername: artists[0]?.username,
        castHash: `0x${Math.random().toString(16).substring(2, 10)}`,
        points: 5
      }
    ];

    // Process mock activities (replace with real Farcaster data later)
    for (const mockActivity of mockActivities) {
      if (!mockActivity.targetArtistId) continue;

      // Check if we already recorded this activity
      const { data: existingActivity } = await supabase
        .from('activities')
        .select('id')
        .eq('"userId"', user.id)
        .eq('"activityType"', mockActivity.type)
        .eq('"farcasterCastHash"', mockActivity.castHash)
        .eq('"targetUserId"', mockActivity.targetArtistId)
        .single();

      if (existingActivity) {
        console.log(`⚠️ Activity already recorded`);
        continue;
      }

      // Award points through existing activities API
      try {
        const activityResponse = await fetch(`${request.nextUrl.origin}/api/activities`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            activityType: mockActivity.type,
            targetUserId: mockActivity.targetArtistId,
            farcasterCastHash: mockActivity.castHash,
            metadata: {
              syncedFromFarcaster: true,
              simulatedActivity: true, // Mark as simulated for now
              timestamp: now.toISOString(),
              targetArtistUsername: mockActivity.targetArtistUsername
            }
          })
        });

        if (activityResponse.ok) {
          const activityResult = await activityResponse.json();
          totalActivitiesDetected++;
          
          detectedActivities.push({
            type: mockActivity.type,
            targetArtist: mockActivity.targetArtistUsername,
            points: activityResult.pointsAwarded,
            timestamp: now.toISOString()
          });

          console.log(`✅ Awarded ${activityResult.pointsAwarded} points for ${mockActivity.type} to ${mockActivity.targetArtistUsername}`);
        }
      } catch (error) {
        console.error(`❌ Error recording activity:`, error);
      }
    }

    // Update user's last sync time
    await supabase
      .from('users')
      .update({ '"lastFarcasterSync"': now.toISOString() })
      .eq('id', user.id);

    console.log(`🎉 Sync complete! Detected ${totalActivitiesDetected} new activities`);

    return NextResponse.json({
      success: true,
      activitiesDetected: totalActivitiesDetected,
      activities: detectedActivities,
      message: totalActivitiesDetected > 0 
        ? `Found ${totalActivitiesDetected} new activities! Points awarded.`
        : 'No new activities found. Try supporting some artists on Farcaster and sync again later!',
      note: 'Currently using simulated data. Real Farcaster integration coming soon!'
    });

  } catch (error) {
    console.error('Error in Farcaster sync:', error);
    return NextResponse.json({
      error: 'Failed to sync Farcaster activities'
    }, { status: 500 });
  }
}
