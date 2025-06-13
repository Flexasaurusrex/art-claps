// app/api/sync-farcaster/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { NeynarAPIClient } from '@neynar/nodejs-sdk';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const neynarApiKey = process.env.NEYNAR_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);
const neynar = new NeynarAPIClient(neynarApiKey);

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
      // Get user's recent casts (last 50 casts)
      const userCastsResponse = await neynar.fetchCastsForUser(userFid, {
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
      }

      // Get user's reactions - using the correct API method
      try {
        const userReactionsResponse = await neynar.fetchUserReactions(userFid, "likes", {
          limit: 50
        });

        console.log(`❤️ Found ${userReactionsResponse.reactions.length} recent reactions from user`);

        // Check reactions to verified artists' casts
        for (const reaction of userReactionsResponse.reactions) {
          // Get timestamp from the cast object instead
          const reactionTimestamp = new Date(reaction.cast.timestamp);
          
          // Only check reactions from the last 24 hours
          if (reactionTimestamp < twentyFourHoursAgo) continue;

          // Find if the reaction target is a verified artist
          const targetArtist = artists.find(artist => artist.farcasterFid === reaction.cast.author.fid);
          
          if (targetArtist) {
            // Check if we already recorded this reaction
            const { data: existingActivity } = await supabase
              .from('activities')
              .select('id')
              .eq('"userId"', user.id)
              .eq('"activityType"', 'CLAP_REACTION')
              .eq('"farcasterCastHash"', reaction.cast.hash)
              .eq('"targetUserId"', targetArtist.id)
              .single();

            if (existingActivity) {
              console.log(`⚠️ Reaction already recorded for cast ${reaction.cast.hash}`);
              continue;
            }

            // Award points for supporting artist
            try {
              const activityResponse = await fetch(`${request.nextUrl.origin}/api/activities`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  userId: user.id,
                  activityType: 'CLAP_REACTION',
                  targetUserId: targetArtist.id,
                  farcasterCastHash: reaction.cast.hash,
                  metadata: {
                    syncedFromFarcaster: true,
                    realFarcasterData: true,
                    reactionType: 'like',
                    castText: reaction.cast.text,
                    timestamp: reaction.cast.timestamp,
                    targetArtistUsername: targetArtist.username
                  }
                })
              });

              if (activityResponse.ok) {
                const activityResult = await activityResponse.json();
                totalActivitiesDetected++;
                
                detectedActivities.push({
                  type: 'CLAP_REACTION',
                  targetArtist: targetArtist.username,
                  points: activityResult.pointsAwarded,
                  timestamp: reaction.cast.timestamp,
                  castHash: reaction.cast.hash
                });

                console.log(`✅ Awarded ${activityResult.pointsAwarded} points for liking @${targetArtist.username}'s cast`);
              }
            } catch (error) {
              console.error(`❌ Error recording reaction activity:`, error);
            }
          }
        }
      } catch (reactionError) {
        console.log('⚠️ Could not fetch user reactions, skipping reaction detection');
      }

      // Check for recasts by looking at user's casts with parent_hash
      for (const cast of userCastsResponse.casts) {
        const castTimestamp = new Date(cast.timestamp);
        
        // Only check recasts from the last 24 hours
        if (castTimestamp < twentyFourHoursAgo) continue;

        // Check if this is a recast (has parent_hash)
        if (cast.parent_hash) {
          try {
            // Get the original cast to see if it's from an artist
            const originalCastResponse = await neynar.lookUpCastByHash(cast.parent_hash);
            const originalArtist = artists.find(artist => artist.farcasterFid === originalCastResponse.cast.author.fid);
            
            if (originalArtist) {
              // Check if we already recorded this recast
              const { data: existingActivity } = await supabase
                .from('activities')
                .select('id')
                .eq('"userId"', user.id)
                .eq('"activityType"', 'SHARE_ARTIST_WORK')
                .eq('"farcasterCastHash"', cast.hash)
                .eq('"targetUserId"', originalArtist.id)
                .single();

              if (existingActivity) {
                console.log(`⚠️ Recast already recorded for cast ${cast.hash}`);
                continue;
              }

              // Award points for sharing artist work
              try {
                const activityResponse = await fetch(`${request.nextUrl.origin}/api/activities`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    userId: user.id,
                    activityType: 'SHARE_ARTIST_WORK',
                    targetUserId: originalArtist.id,
                    farcasterCastHash: cast.hash,
                    metadata: {
                      syncedFromFarcaster: true,
                      realFarcasterData: true,
                      originalCastHash: cast.parent_hash,
                      recastText: cast.text,
                      timestamp: cast.timestamp,
                      targetArtistUsername: originalArtist.username
                    }
                  })
                });

                if (activityResponse.ok) {
                  const activityResult = await activityResponse.json();
                  totalActivitiesDetected++;
                  
                  detectedActivities.push({
                    type: 'SHARE_ARTIST_WORK',
                    targetArtist: originalArtist.username,
                    points: activityResult.pointsAwarded,
                    timestamp: cast.timestamp,
                    castHash: cast.hash
                  });

                  console.log(`✅ Awarded ${activityResult.pointsAwarded} points for sharing @${originalArtist.username}'s work`);
                }
              } catch (error) {
                console.error(`❌ Error recording recast activity:`, error);
              }
            }
          } catch (error) {
            console.log(`⚠️ Could not fetch original cast for hash ${cast.parent_hash}`);
          }
        }
      }

    } catch (neynarError) {
      console.error('❌ Neynar API Error:', neynarError);
      
      // If Neynar fails, return a helpful error message
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch data from Farcaster. Please try again later.',
        details: neynarError instanceof Error ? neynarError.message : 'Unknown error'
      }, { status: 500 });
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
      note: 'Real Farcaster integration active! 🎉'
    });

  } catch (error) {
    console.error('Error in Farcaster sync:', error);
    return NextResponse.json({
      error: 'Failed to sync Farcaster activities'
    }, { status: 500 });
  }
}
