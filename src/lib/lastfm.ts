const LASTFM_API_KEY = process.env.LASTFM_API_KEY;
const LASTFM_USERNAME = process.env.LASTFM_USERNAME;
const LASTFM_ENDPOINT = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${LASTFM_USERNAME}&api_key=${LASTFM_API_KEY}&format=json&limit=1`;

/**
 * Returns the currently playing or most recent track from Last.fm (Apple Music).
 */
export async function getNowPlaying() {
  const response = await fetch(LASTFM_ENDPOINT, {
    next: { revalidate: 30 } // Cache for 30 seconds
  });

  if (!response.ok) {
    return { isPlaying: false };
  }

  const data = await response.json();
  const track = data.recenttracks.track[0];

  if (!track) {
    return { isPlaying: false };
  }

  // Check if it's actually playing right now
  const isPlaying = track['@attr']?.nowplaying === 'true';

  return {
    isPlaying,
    title: track.name,
    artist: track.artist['#text'],
    album: track.album['#text'],
    albumImageUrl: track.image[track.image.length - 1]['#text'], // Use the largest image
    songUrl: track.url,
  };
}
