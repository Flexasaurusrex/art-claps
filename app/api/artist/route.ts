import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');
  
  if (!username) {
    return NextResponse.json({ error: 'Username required' }, { status: 400 });
  }
  
  return NextResponse.json({
    success: true,
    message: `API working for username: ${username}`,
    timestamp: new Date().toISOString()
  });
}
