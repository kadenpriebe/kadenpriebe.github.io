import { supabase } from './supabase';

/**
 * Increments the view count for a specific slug (blog, project, etc).
 * Uses Postgres 'upsert' to either create the record or increment it.
 */
export async function incrementView(slug: string): Promise<number | null> {
  const { data, error } = await supabase.rpc('increment_view_count' as any, {
    page_slug: slug
  } as any);

  if (error) {
    // If RPC isn't available, we fallback to a simple read/write (less atomic)
    // In production, we'd use the SQL function below.
    console.error('Error incrementing view count:', error);
    return null;
  }

  return data as number;
}

/**
 * SQL snippet for Supabase SQL Editor to support 'increment_view_count' RPC:
 * 
 * CREATE OR REPLACE FUNCTION increment_view_count(page_slug TEXT)
 * RETURNS INTEGER AS $$
 * BEGIN
 *   INSERT INTO views (slug, count)
 *   VALUES (page_slug, 1)
 *   ON CONFLICT (slug)
 *   DO UPDATE SET count = views.count + 1, updated_at = NOW()
 *   RETURNING count;
 * END;
 * $$ LANGUAGE plpgsql;
 */

export async function getViews(slug: string): Promise<number> {
  const { data, error } = await supabase
    .from('views' as any)
    .select('count')
    .eq('slug', slug)
    .single();

  if (error || !data) return 0;
  return (data as any).count;
}
