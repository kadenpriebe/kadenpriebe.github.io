import { NextRequest, NextResponse } from 'next/server';
import { subscribeToBlog } from '@/lib/subscriptions';

// Key: IP address, Value: Timestamp of last request
const rateLimit = new Map<string, number>();
const MIN_REQUEST_INTERVAL = 10000; // 10 seconds

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    const lastRequest = rateLimit.get(ip) || 0;

    if (now - lastRequest < MIN_REQUEST_INTERVAL) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a moment.' },
        { status: 429 }
      );
    }
    rateLimit.set(ip, now);

    const body = await req.json();
    const { email, metadata } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const data = await subscribeToBlog(email, metadata);

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error: any) {
    console.error('Subscription API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
