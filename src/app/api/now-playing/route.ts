import { NextResponse } from 'next/server';
import { getNowPlaying } from '@/lib/lastfm';

export async function GET() {
  try {
    const data = await getNowPlaying();

    return NextResponse.json(data, { 
      status: 200, 
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=15' } 
    });
  } catch (error) {
    console.error('Apple Music (Last.fm) API error:', error);
    return NextResponse.json({ isPlaying: false, error: 'Failed to fetch status' }, { status: 500 });
  }
}
