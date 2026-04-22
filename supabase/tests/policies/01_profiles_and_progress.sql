-- 01_profiles_and_progress.sql
-- Testa RLS em profiles, lesson_progress, exercise_attempts (dados do aluno).
-- Garante isolamento cross-user e acesso admin via policy separada.

begin;
select plan(14);

-- ============================================================================
-- Setup: cria dois alunos sintéticos + 1 admin
-- ============================================================================

create schema if not exists _test;

create or replace function _test.make_user(p_email text, p_role public.user_role default 'student')
returns uuid language plpgsql as $$
declare u uuid;
begin
  u := gen_random_uuid();
  insert into auth.users (id, email, role, aud, instance_id, email_confirmed_at)
  values (u, p_email, 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000'::uuid, now());
  update public.profiles set role = p_role where id = u;
  return u;
end; $$;

create or replace function _test.as_user(p_user_id uuid) returns void language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', p_user_id, 'role', 'authenticated')::text, true);
end; $$;

create or replace function _test.as_service_role() returns void language plpgsql as $$
begin
  perform set_config('role', 'service_role', true);
  perform set_config('request.jwt.claims', '', true);
end; $$;

create or replace function _test.as_anon() returns void language plpgsql as $$
begin
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', '', true);
end; $$;

-- Reset role ao postgres para poder criar usuários
set role postgres;
select _test.make_user('alice@test.dev') \gset alice_

set role postgres;
select _test.make_user('bob@test.dev') \gset bob_

set role postgres;
select _test.make_user('admin@test.dev', 'admin') \gset admin_

-- Alice cria um unit + lesson + lesson_version para ter material de teste
set role postgres;
insert into public.units (id, slug, order_index, title_en, title_pt_br, status)
values ('11111111-1111-1111-1111-111111111111', 'test-unit-1', 1, 'Test Unit', 'Unidade de Teste', 'published');

insert into public.lessons (id, unit_id, slug, order_index, title_en, title_pt_br, level, status)
values ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'test-lesson-1', 1, 'Test Lesson', 'Lição de Teste', 'a1', 'published');

insert into public.unit_versions (id, unit_id, version, snapshot)
values ('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 1, '{}'::jsonb);

insert into public.lesson_versions (id, lesson_id, version, snapshot)
values ('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 1, '{}'::jsonb);

-- Alice cria progresso próprio
insert into public.lesson_progress (user_id, lesson_id, lesson_version_id, unit_version_id)
values (:'alice_make_user'::uuid, '22222222-2222-2222-2222-222222222222',
        '44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333');

-- ============================================================================
-- TEST 1: aluno só vê próprio profile
-- ============================================================================

select _test.as_user(:'alice_make_user'::uuid);

select is(
  (select count(*)::int from public.profiles),
  1,
  'Alice sees only her own profile via RLS'
);

select is(
  (select id from public.profiles limit 1),
  :'alice_make_user'::uuid,
  'Alice sees her own profile, not Bob''s'
);

-- ============================================================================
-- TEST 2: aluno não pode ler profile de outro aluno
-- ============================================================================

select is_empty(
  $$ select id from public.profiles where id = ':bob_make_user'::uuid $$,
  'Alice cannot read Bob''s profile'
);

-- ============================================================================
-- TEST 3: aluno não pode mudar próprio role
-- ============================================================================

select throws_ok(
  $$ update public.profiles set role = 'admin' where id = auth.uid() $$,
  NULL,
  NULL,
  'Alice cannot self-elevate to admin via UPDATE (WITH CHECK enforces)'
);

-- ============================================================================
-- TEST 4-5: lesson_progress — Alice vê próprio, não vê Bob
-- ============================================================================

select is(
  (select count(*)::int from public.lesson_progress),
  1,
  'Alice sees her own lesson_progress'
);

-- Bob tenta inserir progresso usando Alice's user_id — deve falhar
select _test.as_user(:'bob_make_user'::uuid);
select throws_ok(
  $$ insert into public.lesson_progress (user_id, lesson_id, lesson_version_id, unit_version_id)
     values (':alice_make_user'::uuid, '22222222-2222-2222-2222-222222222222',
             '44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333') $$,
  NULL,
  NULL,
  'Bob cannot insert lesson_progress impersonating Alice'
);

select is(
  (select count(*)::int from public.lesson_progress),
  0,
  'Bob sees zero lesson_progress (Alice''s is hidden)'
);

-- ============================================================================
-- TEST 6-7: exercise_attempts — isolamento
-- ============================================================================

-- Bob cria próprio progress para testar attempt
set role postgres;
insert into public.lesson_progress (user_id, lesson_id, lesson_version_id, unit_version_id)
values (:'bob_make_user'::uuid, '22222222-2222-2222-2222-222222222222',
        '44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333');

-- Bob cria section + exercise mínimo para attempt FK
insert into public.lesson_sections (id, lesson_id, order_index, kind)
values ('55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222222', 1, 'drill');

insert into public.exercises (id, lesson_section_id, type, order_index)
values ('66666666-6666-6666-6666-666666666666', '55555555-5555-5555-5555-555555555555', 'multiple_choice', 1);

select _test.as_user(:'bob_make_user'::uuid);
insert into public.exercise_attempts (user_id, exercise_id, lesson_version_id, grade)
values (:'bob_make_user'::uuid, '66666666-6666-6666-6666-666666666666', '44444444-4444-4444-4444-444444444444', 4);

select is(
  (select count(*)::int from public.exercise_attempts),
  1,
  'Bob sees only his own attempts'
);

select _test.as_user(:'alice_make_user'::uuid);
select is(
  (select count(*)::int from public.exercise_attempts),
  0,
  'Alice does not see Bob''s attempts'
);

-- ============================================================================
-- TEST 8: admin vê progresso de ambos via policy admin_select
-- ============================================================================

select _test.as_user(:'admin_make_user'::uuid);
select is(
  (select count(*)::int from public.lesson_progress),
  2,
  'Admin sees both users'' lesson_progress'
);

select is(
  (select count(*)::int from public.exercise_attempts),
  1,
  'Admin sees Bob''s exercise_attempts'
);

-- ============================================================================
-- TEST 9: anon não vê nada
-- ============================================================================

select _test.as_anon();
select is(
  (select count(*)::int from public.profiles),
  0,
  'Anon sees zero profiles'
);

select is(
  (select count(*)::int from public.lesson_progress),
  0,
  'Anon sees zero lesson_progress'
);

-- ============================================================================
-- TEST 10: conteúdo published visível a authenticated, invisível a anon
-- ============================================================================

select _test.as_user(:'alice_make_user'::uuid);
select is(
  (select count(*)::int from public.lessons where status = 'published'),
  1,
  'Alice sees published lessons'
);

select _test.as_anon();
select is(
  (select count(*)::int from public.lessons),
  0,
  'Anon sees zero lessons (published requires authenticated)'
);

-- ============================================================================
-- TEST 11: service_role bypassa RLS
-- ============================================================================

select _test.as_service_role();
select cmp_ok(
  (select count(*)::int from public.lesson_progress),
  '>=',
  2,
  'service_role sees all lesson_progress (bypass RLS)'
);

select finish();
rollback;
