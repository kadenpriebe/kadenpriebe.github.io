import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyScoreSignature } from '@/lib/security';
import { Database } from '@/types/database';

const SCORE_SECRET = process.env.SCORE_SIGNING_SECRET || 'dev-secret-keep-it-safe';

type LeaderboardInsert = Database['public']['Tables']['leaderboard']['Insert'];

// Simple in-memory rate limiting map
// Key: IP address, Value: Timestamp of last request
const rateLimit = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute window
const MIN_REQUEST_INTERVAL = 5000;   // Minimum 5 seconds between requests

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

    // Clean up old entries periodically
    if (rateLimit.size > 1000) rateLimit.clear();

    const body = await req.json();
    const { name, score, game_id, signature, timestamp } = body;

    if (!name || typeof score !== 'number' || !game_id || !signature || !timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields: name, score, game_id, signature, timestamp' },
        { status: 400 }
      );
    }

    // Verify Score Signature (Anti-Cheat)
    const isVerified = verifyScoreSignature(score, game_id, timestamp, signature, SCORE_SECRET);
    if (!isVerified) {
       return NextResponse.json({ error: 'Invalid score signature' }, { status: 403 });
    }

    // Basic validation: prevent absurd scores
    if (score < 0 || score > 1000000) {
       return NextResponse.json({ error: 'Invalid score range' }, { status: 400 });
    }

    const entry: LeaderboardInsert = { 
      name: String(name), 
      score: Number(score), 
      game_id: String(game_id) 
    };

    const { data, error } = await supabase
      .from('leaderboard' as any)
      // @ts-ignore
      .insert(entry)
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to save score' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const game_id = searchParams.get('game_id');
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    let query = supabase
      .from('leaderboard' as any)
      .select('*')
      .order('score', { ascending: false })
      .limit(limit);

    if (game_id) {
      // @ts-ignore
      query = query.eq('game_id', game_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch leaderboard' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('API GET error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
