import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  return NextResponse.json({
    success: true,
    message: `API working for username: ${params.username}`,
    timestamp: new Date().toISOString()
  });
}
