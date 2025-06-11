import { NextResponse } from "next/server"

export async function GET() {
  // Temporary simple response until database is set up
  return NextResponse.json({
    totalPoints: 0,
    weeklyPoints: 0,
    rank: 1,
    supportRatio: 1.0,
    artistsSupported: 0
  })
}
