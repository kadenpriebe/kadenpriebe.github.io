import { supabase } from './supabase';

/**
 * Subscribes a user to the blog.
 * Pure logic, no UI dependencies.
 */
export async function subscribeToBlog(email: string, metadata: any = {}) {
  // Normalize email
  const normalizedEmail = email.trim().toLowerCase();
  
  // Basic validation
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    throw new Error('Invalid email address');
  }

  // Insert into Supabase
  const { data, error } = await supabase
    .from('subscriptions' as any)
    // @ts-ignore
    .upsert({ 
      email: normalizedEmail,
      metadata,
      status: 'active'
    }, { onConflict: 'email' })
    .select();

  if (error) {
    console.error('Subscription error:', error);
    throw new Error('Failed to subscribe. Please try again later.');
  }

  return data;
}

/**
 * Unsubscribes a user from the blog.
 */
export async function unsubscribeFromBlog(email: string) {
  const { data, error } = await supabase
    .from('subscriptions' as any)
    // @ts-ignore
    .update({ status: 'unsubscribed' })
    .eq('email', email.trim().toLowerCase())
    .select();

  if (error) {
    console.error('Unsubscribe error:', error);
    throw new Error('Failed to unsubscribe.');
  }

  return data;
}
