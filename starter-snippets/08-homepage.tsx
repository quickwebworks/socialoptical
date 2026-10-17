import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
export const dynamic = 'force-dynamic';
export default async function Home() {
  // No session cookies: published-content query cannot leak staff previews.
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
  const { data: posts, error } = await db.from('posts')
    .select('id,slug,title,excerpt,publish_at')
    .eq('status', 'published').is('deleted_at', null)
    .lte('publish_at', new Date().toISOString())
    .order('publish_at', { ascending: false }).limit(20);
  if (error) throw new Error('News feed unavailable');
  return <main className="mx-auto max-w-6xl px-4 py-10">
    <h1 className="mb-8 text-4xl font-bold">Latest News</h1>
    {!posts?.length && <p>No published stories yet.</p>}
    <div className="grid gap-6 md:grid-cols-3">
      {posts?.map(post => <article key={post.id} className="rounded-xl border p-5">
        <h2 className="text-xl font-semibold">
          <Link href={`/news/${post.slug}`}>{post.title}</Link>
        </h2>
        <p className="mt-3">{post.excerpt}</p>
      </article>)}
    </div>
  </main>;
}
