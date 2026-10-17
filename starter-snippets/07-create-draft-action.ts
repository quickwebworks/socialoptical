'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth/require-role';
const Draft = z.object({
  title: z.string().trim().min(1).max(200),
  slug: z.string().min(1).max(180).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  excerpt: z.string().trim().max(500)
});
export async function createDraft(form: FormData) {
  const { db, userId } = await requireRole(['admin', 'editor', 'author']);
  const parsed = Draft.safeParse({
    title: form.get('title'), slug: form.get('slug'),
    excerpt: form.get('excerpt') ?? ''
  });
  if (!parsed.success) return { error: 'Check title, slug and excerpt.' };
  const { error } = await db.from('posts').insert({
    ...parsed.data, author_id: userId, status: 'draft',
    body: { type: 'doc', content: [] }
  });
  if (error) return { error: error.code === '23505' ? 'Slug already exists.' : 'Could not save draft.' };
  revalidatePath('/admin/posts');
  return { success: true };
}
