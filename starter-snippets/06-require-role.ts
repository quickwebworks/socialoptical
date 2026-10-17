import 'server-only';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
type Role = 'admin' | 'editor' | 'author' | 'ads_manager';
export async function requireRole(allowed: Role[]) {
  const db = await createClient();
  const { data, error } = await db.auth.getClaims();
  if (error || !data?.claims?.sub) redirect('/login');
  const { data: member, error: roleError } = await db.from('staff_roles')
    .select('role').eq('user_id', data.claims.sub).single();
  if (roleError || !member || !allowed.includes(member.role as Role)) {
    throw new Error('Forbidden');
  }
  return { db, userId: data.claims.sub };
}
