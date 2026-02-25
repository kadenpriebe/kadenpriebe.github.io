import { createHmac } from 'crypto';

/**
 * Generates a HMAC-SHA256 signature for a game score.
 * This ensures the score hasn't been tampered with between the client and server.
 */
export function generateScoreSignature(
  score: number, 
  gameId: string, 
  timestamp: number, 
  secret: string
): string {
  const data = `${score}:${gameId}:${timestamp}`;
  return createHmac('sha256', secret).update(data).digest('hex');
}

/**
 * Verifies a score signature.
 */
export function verifyScoreSignature(
  score: number, 
  gameId: string, 
  timestamp: number, 
  signature: string, 
  secret: string
): boolean {
  // Check if timestamp is too old (e.g., > 1 minute) to prevent replay attacks
  const now = Date.now();
  if (now - timestamp > 60 * 1000) {
    return false;
  }

  const expected = generateScoreSignature(score, gameId, timestamp, secret);
  return expected === signature;
}
