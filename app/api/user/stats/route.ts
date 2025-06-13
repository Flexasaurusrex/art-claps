// app/api/user/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fid = searchParams.get('fid');
    const userId = searchParams.get('userId');

    // For now, return mock data to get the build working
    // We'll add real database queries after deployment succeeds
    const mockStats = {
      totalPoints: fid ? parseInt(fid) * 10 : 0, // Some dynamic mock data
      weeklyPoints: fid ? parseInt(fid) * 2 : 0,
      monthlyPoints: fid ? parseInt(fid) * 8 : 0,
      todaysPoints: fid ? Math.floor(Math.random() * 20) : 0,
      rank: fid ? Math.floor(Math.random() * 100) + 1 : 1,
      totalUsers: 150,
      percentile: fid ? Math.floor(Math.random() * 100) + 1 : 100,
      supportGiven: fid ? Math.floor(Math.random() * 50) : 0,
      supportReceived: fid ? Math.floor(Math.random() * 30) : 0,
      supportRatio: 1.5,
      artistsSupported: fid ? Math.floor(Math.random() * 15) : 0,
      connections: fid ? Math.floor(Math.random() * 25) : 0,
      activitiesCount: fid ? Math.floor(Math.random() * 100) : 0,
      streakDays: fid ? Math.floor(Math.random() * 10) : 0
    };

    return NextResponse.json({
      success: true,
      stats: mockStats,
      note: "Using mock data - database integration coming soon!"
    });

  } catch (error) {
    console.error('Error in stats route:', error);
    
    return NextResponse.json({
      success: true,
      stats: {
        totalPoints: 0,
        weeklyPoints: 0,
        monthlyPoints: 0,
        todaysPoints: 0,
        rank: 1,
        totalUsers: 1,
        percentile: 100,
        supportGiven: 0,
        supportReceived: 0,
        supportRatio: 0,
        artistsSupported: 0,
        connections: 0,
        activitiesCount: 0,
        streakDays: 0
      },
      note: "Fallback data"
    });
  }
}
