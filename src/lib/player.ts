import { cookies } from 'next/headers';

const PLAYER_NAME_COOKIE = 'kp_player_name';

/**
 * Returns the player's name from cookies.
 * Server-side only (Next.js 13+ App Router).
 */
export async function getPlayerName(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(PLAYER_NAME_COOKIE)?.value || null;
}

/**
 * Sets the player's name in cookies.
 * Server-side only (Server Action).
 */
export async function setPlayerName(name: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(PLAYER_NAME_COOKIE, name, {
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
}

/**
 * Checks if the player has a valid name.
 */
export async function hasPlayerName(): Promise<boolean> {
  const name = await getPlayerName();
  return !!name && name.length > 0;
}
