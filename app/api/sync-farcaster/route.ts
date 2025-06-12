// app/api/sync-farcaster/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Farcaster Hub endpoint - using public hub
const HUB_URL = 'https://hub.farcaster.xyz/v1';

interface FarcasterReaction {
  data: {
    type: string;
    fid: number;
    timestamp: number;
    reactionBody: {
      type: 'REACTION_TYPE_LIKE' | 'REACTION_TYPE_RECAST';
      targetCastId: {
        fid: number;
        hash: string;
      };
    };
  };
  hash: string;
}

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

    // Get user from database
    const { data: user } = await supabase
      .from('users')
      .select('id, "farcasterFid", "username"')
      .eq('"farcasterFid"', userFid)
      .single();

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get all verified artists from database
    const { data: artists } = await supabase
      .from('users')
      .select('id, "farcasterFid", "username"')
      .eq('"artistStatus"', 'verified_artist');

    if (!artists || artists.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No verified artists found to sync',
        activitiesDetected: 0
      });
    }

    const artistFids = artists.map(a => a.farcasterFid);
    console.log(`👨‍🎨 Found ${artists.length} verified artists to check`);

    // Calculate timestamp for last 24 hours
    const oneDayAgo = Math.floor(Date.now() / 1000) - (24 * 60 * 60);

    let totalActivitiesDetected = 0;
    const detectedActivities = [];

    // Fetch user's recent reactions (likes and recasts)
    try {
      console.log(`📡 Fetching reactions for FID ${userFid}...`);
      
      const reactionsResponse = await fetch(
        `${HUB_URL}/reactionsByFid?fid=${userFid}&pageSize=100`
      );

      if (!reactionsResponse.ok) {
        throw new Error(`Farcaster API error: ${reactionsResponse.status}`);
      }

      const reactionsData = await reactionsResponse.json();
      const reactions: FarcasterReaction[] = reactionsData.messages || [];

      console.log(`💫 Found ${reactions.length} total reactions`);

      // Filter reactions from last 24 hours to artist posts
      for (const reaction of reactions) {
        const reactionTimestamp = reaction.data.timestamp;
        
        // Skip old reactions
        if (reactionTimestamp < oneDayAgo) continue;

        const targetFid = reaction.data.reactionBody.targetCastId.fid;
        const targetArtist = artists.find(a => a.farcasterFid === targetFid);

        // Skip if not reacting to a verified artist
        if (!targetArtist) continue;

        const reactionType = reaction.data.reactionBody.type;
        const castHash = reaction.data.reactionBody.targetCastId.hash;

        // Determine activity type and points
        let activityType: string;
        if (reactionType === 'REACTION_TYPE_LIKE') {
          activityType = 'CLAP_REACTION';
        } else if (reactionType === 'REACTION_TYPE_RECAST') {
          activityType = 'RECAST_WITH_COMMENT';
        } else {
          continue; // Skip unknown reaction types
        }

        // Check if we already recorded this activity
        const { data: existingActivity } = await supabase
          .from('activities')
          .select('id')
          .eq('"userId"', user.id)
          .eq('"activityType"', activityType)
          .eq('"farcasterCastHash"', castHash)
          .eq('"targetUserId"', targetArtist.id)
          .single();

        if (existingActivity) {
          console.log(`⚠️ Activity already recorded: ${activityType} on ${castHash}`);
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
              activityType,
              targetUserId: targetArtist.id,
              farcasterCastHash: castHash,
              metadata: {
                syncedFromFarcaster: true,
                reactionHash: reaction.hash,
                timestamp: reactionTimestamp,
                targetArtistUsername: targetArtist.username
              }
            })
          });

          if (activityResponse.ok) {
            const activityResult = await activityResponse.json();
            totalActivitiesDetected++;
            
            detectedActivities.push({
              type: activityType,
              targetArtist: targetArtist.username,
              points: activityResult.pointsAwarded,
              timestamp: reactionTimestamp
            });

            console.log(`✅ Awarded ${activityResult.pointsAwarded} points for ${activityType} to ${targetArtist.username}`);
          } else {
            console.error(`❌ Failed to record activity: ${await activityResponse.text()}`);
          }
        } catch (error) {
          console.error(`❌ Error recording activity:`, error);
        }
      }

    } catch (error) {
      console.error('Error fetching reactions from Farcaster:', error);
      return NextResponse.json(
        { error: 'Failed to fetch Farcaster data' },
        { status: 500 }
      );
    }

    // Update user's last sync time
    await supabase
      .from('users')
      .update({ '"lastFarcasterSync"': new Date().toISOString() })
      .eq('id', user.id);

    console.log(`🎉 Sync complete! Detected ${totalActivitiesDetected} new activities`);

    return NextResponse.json({
      success: true,
      activitiesDetected: totalActivitiesDetected,
      activities: detectedActivities,
      message: totalActivitiesDetected > 0 
        ? `Found ${totalActivitiesDetected} new activities! Points awarded.`
        : 'No new activities found in the last 24 hours.'
    });

  } catch (error) {
    console.error('Error in Farcaster sync:', error);
    return NextResponse.json(
      { error: 'Failed to sync Farcaster activities' },
      { status: 500 }
    );
  }
}
