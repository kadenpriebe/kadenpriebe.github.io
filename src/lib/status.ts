import { supabase } from './supabase';

export interface StatusData {
  text: string;
  emoji: string | null;
  created_at: string;
}

/**
 * Returns the most recent active status.
 */
export async function getCurrentStatus(): Promise<StatusData | null> {
  const { data, error } = await supabase
    .from('status' as any)
    .select('text, emoji, created_at')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data as any;
}

/**
 * Sets a new active status.
 */
export async function updateStatus(text: string, emoji?: string): Promise<void> {
  // Option: deactivate old statuses? Or just insert new one?
  // Usually, we just insert and take the latest.
  const { error } = await supabase
    .from('status' as any)
    .insert([{ text, emoji, is_active: true }] as any);

  if (error) {
    console.error('Error updating status:', error);
    throw new Error('Failed to update status.');
  }
}
