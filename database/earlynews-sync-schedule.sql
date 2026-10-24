create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;
select cron.schedule('earlynews24-to-socialoptical','*/5 * * * *',$job$
select net.http_post(
 url:='https://totzocwtklrzgjnxnoqx.supabase.co/functions/v1/sync-earlynews24',
 headers:=jsonb_build_object('Content-Type','application/json','x-sync-token',(select decrypted_secret from vault.decrypted_secrets where name='earlynews24_sync_token')),
 body:='{}'::jsonb,timeout_milliseconds:=180000);
$job$);
