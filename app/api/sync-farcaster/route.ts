// app/api/sync-farcaster/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userFid } = body;

    console.log('Sync API called with FID:', userFid);

    if (!userFid) {
      return NextResponse.json(
        { error: 'userFid is required' },
        { status: 400 }
      );
    }

    // Just return success for now
    return NextResponse.json({
      success: true,
      message: `Sync test successful for FID ${userFid}`,
      activitiesDetected: 0,
      debug: {
        apiWorking: true,
        userFid: userFid,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json({
      error: 'API test failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
