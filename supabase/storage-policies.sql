-- storage-policies.sql
-- Aplicar via Supabase Studio → SQL Editor (exige role supabase_storage_admin
-- que o MCP/CLI de migrations não tem).
--
-- Buckets já criados por migration 0009_storage_buckets.sql:
--   - tts-cache (público)
--   - recordings (privado, TTL 90d via UC-10)
--   - stt-uploads (privado, TTL 7d via job)
--
-- Convenção de path: {user_id}/rest-of-path.ext

-- ============================================================================
-- tts-cache: leitura pública; escrita só service_role (sem policy de INSERT)
-- ============================================================================

drop policy if exists "tts_cache_public_read" on storage.objects;
create policy "tts_cache_public_read" on storage.objects for select
  using (bucket_id = 'tts-cache');

-- ============================================================================
-- recordings: aluno CRUD próprio; admin SELECT com audit
-- ============================================================================

drop policy if exists "recordings_owner_read" on storage.objects;
create policy "recordings_owner_read" on storage.objects for select
  using (
    bucket_id = 'recordings'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "recordings_owner_insert" on storage.objects;
create policy "recordings_owner_insert" on storage.objects for insert
  with check (
    bucket_id = 'recordings'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "recordings_owner_update" on storage.objects;
create policy "recordings_owner_update" on storage.objects for update
  using (
    bucket_id = 'recordings'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'recordings'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "recordings_owner_delete" on storage.objects;
create policy "recordings_owner_delete" on storage.objects for delete
  using (
    bucket_id = 'recordings'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "recordings_admin_read" on storage.objects;
create policy "recordings_admin_read" on storage.objects for select
  using (
    bucket_id = 'recordings'
    and (select public.current_role()) = 'admin'
  );

-- ============================================================================
-- stt-uploads: aluno INSERT/SELECT próprio; Edge Function lê via service_role
-- ============================================================================

drop policy if exists "stt_uploads_owner_insert" on storage.objects;
create policy "stt_uploads_owner_insert" on storage.objects for insert
  with check (
    bucket_id = 'stt-uploads'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "stt_uploads_owner_read" on storage.objects;
create policy "stt_uploads_owner_read" on storage.objects for select
  using (
    bucket_id = 'stt-uploads'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
