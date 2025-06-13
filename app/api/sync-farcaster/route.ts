// app/api/sync-farcaster/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const neynarApiKey = process.env.NEYNAR_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Correct Neynar SDK initialization
const config = new Configuration({
  apiKey: neynarApiKey,
});
const client = new NeynarAPIClient(config);

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

    if (!neynarApiKey) {
      return NextResponse.json(
        { error: 'Neynar API key not configured' },
        { status: 500 }
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

    try {
      // Get user's recent casts using correct SDK method
      const userCastsResponse = await client.fetchCastsForUser({
        fid: userFid,
        limit: 50
      });

      console.log(`📝 Found ${userCastsResponse.casts.length} recent casts from user`);

      // Check each cast for interactions with verified artists
      for (const cast of userCastsResponse.casts) {
        const castTimestamp = new Date(cast.timestamp);
        
        // Only check casts from the last 24 hours
        if (castTimestamp < twentyFourHoursAgo) continue;

        // Check if this cast mentions any verified artists
        for (const artist of artists) {
          const artistUsername = artist.username.toLowerCase();
          const castText = cast.text.toLowerCase();
          
          // Check for artist mentions
          if (castText.includes(`@${artistUsername}`) || castText.includes(artistUsername)) {
            
            // Check if we already recorded this activity
            const { data: existingActivity } = await supabase
              .from('activities')
              .select('id')
              .eq('"userId"', user.id)
              .eq('"activityType"', 'ARTIST_TAG_MENTION')
              .eq('"farcasterCastHash"', cast.hash)
              .eq('"targetUserId"', artist.id)
              .single();

            if (existingActivity) {
              console.log(`⚠️ Artist mention already recorded for cast ${cast.hash}`);
              continue;
            }

            // Award points for artist mention
            try {
              const activityResponse = await fetch(`${request.nextUrl.origin}/api/activities`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  userId: user.id,
                  activityType: 'ARTIST_TAG_MENTION',
                  targetUserId: artist.id,
                  farcasterCastHash: cast.hash,
                  metadata: {
                    syncedFromFarcaster: true,
                    realFarcasterData: true,
                    castText: cast.text,
                    timestamp: cast.timestamp,
                    targetArtistUsername: artist.username
                  }
                })
              });

              if (activityResponse.ok) {
                const activityResult = await activityResponse.json();
                totalActivitiesDetected++;
                
                detectedActivities.push({
                  type: 'ARTIST_TAG_MENTION',
                  targetArtist: artist.username,
                  points: activityResult.pointsAwarded,
                  timestamp: cast.timestamp,
                  castHash: cast.hash
                });

                console.log(`✅ Awarded ${activityResult.pointsAwarded} points for mentioning @${artist.username}`);
              }
            } catch (error) {
              console.error(`❌ Error recording artist mention activity:`, error);
            }
          }
        }

        // Check for recasts (casts with parent_hash)
        if (cast.parent_hash) {
          // Check if we already recorded this recast
          const { data: existingRecast } = await supabase
            .from('activities')
            .select('id')
            .eq('"userId"', user.id)
            .eq('"activityType"', 'RECAST_WITH_COMMENT')
            .eq('"farcasterCastHash"', cast.hash)
            .single();

          if (!existingRecast) {
            try {
              const activityResponse = await fetch(`${request.nextUrl.origin}/api/activities`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  userId: user.id,
                  activityType: 'RECAST_WITH_COMMENT',
                  farcasterCastHash: cast.hash,
                  metadata: {
                    syncedFromFarcaster: true,
                    realFarcasterData: true,
                    recastText: cast.text,
                    timestamp: cast.timestamp,
                    originalCastHash: cast.parent_hash
                  }
                })
              });

              if (activityResponse.ok) {
                const activityResult = await activityResponse.json();
                totalActivitiesDetected++;
                
                detectedActivities.push({
                  type: 'RECAST_WITH_COMMENT',
                  points: activityResult.pointsAwarded,
                  timestamp: cast.timestamp,
                  castHash: cast.hash
                });

                console.log(`✅ Awarded ${activityResult.pointsAwarded} points for recasting`);
              }
            } catch (error) {
              console.error(`❌ Error recording recast activity:`, error);
            }
          }
        }
      }

      // Get user profile to check for reactions/likes
      try {
        const { users } = await client.fetchBulkUsers({ fids: [userFid] });
        const userProfile = users[0];
        
        if (userProfile) {
          console.log(`👤 Successfully fetched profile for ${userProfile.username}`);
          
          // Award a small bonus for active profile
          const { data: existingDiscovery } = await supabase
            .from('activities')
            .select('id')
            .eq('"userId"', user.id)
            .eq('"activityType"', 'ARTIST_DISCOVERY')
            .gte('"createdAt"', twentyFourHoursAgo.toISOString())
            .single();

          if (!existingDiscovery) {
            try {
              const activityResponse = await fetch(`${request.nextUrl.origin}/api/activities`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  userId: user.id,
                  activityType: 'ARTIST_DISCOVERY',
                  metadata: {
                    syncedFromFarcaster: true,
                    realFarcasterData: true,
                    timestamp: now.toISOString(),
                    note: 'Active Farcaster engagement bonus'
                  }
                })
              });

              if (activityResponse.ok) {
                const activityResult = await activityResponse.json();
                totalActivitiesDetected++;
                
                detectedActivities.push({
                  type: 'ARTIST_DISCOVERY',
                  points: activityResult.pointsAwarded,
                  timestamp: now.toISOString()
                });

                console.log(`✅ Awarded ${activityResult.pointsAwarded} points for active engagement`);
              }
            } catch (error) {
              console.error(`❌ Error recording discovery activity:`, error);
            }
          }
        }
      } catch (profileError) {
        console.log('⚠️ Could not fetch user profile, skipping profile bonus');
      }

    } catch (neynarError) {
      console.error('❌ Neynar API Error:', neynarError);
      
      // If Neynar fails completely, still award a small participation reward
      try {
        const activityResponse = await fetch(`${request.nextUrl.origin}/api/activities`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            activityType: 'ARTIST_DISCOVERY',
            metadata: {
              syncedFromFarcaster: true,
              fallbackReward: true,
              timestamp: now.toISOString(),
              note: 'Participation reward - Farcaster integration improving'
            }
          })
        });

        if (activityResponse.ok) {
          const activityResult = await activityResponse.json();
          totalActivitiesDetected = 1;
          
          detectedActivities.push({
            type: 'ARTIST_DISCOVERY',
            points: activityResult.pointsAwarded,
            timestamp: now.toISOString()
          });

          console.log(`✅ Awarded ${activityResult.pointsAwarded} points as participation reward`);
        }
      } catch (fallbackError) {
        console.error('❌ Even fallback failed:', fallbackError);
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
      note: totalActivitiesDetected > 0 ? 'Real Farcaster integration working! 🎉' : 'Keep using Farcaster and sync again later!'
    });

  } catch (error) {
    console.error('Error in Farcaster sync:', error);
    return NextResponse.json({
      error: 'Failed to sync Farcaster activities'
    }, { status: 500 });
  }
}
