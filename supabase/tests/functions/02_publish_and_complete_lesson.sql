-- 02_publish_and_complete_lesson.sql
-- Testa publish_lesson (snapshot + version) e complete_lesson (critério de conclusão).
-- Refs: docs/adr/008-conteudo-e-versionamento.md, docs/use-cases/UC-02, UC-08

begin;
select plan(10);

-- Setup
set role postgres;

insert into auth.users (id, email, role, aud, instance_id, email_confirmed_at)
values
  ('bbbbbbbb-0000-0000-0000-000000000001'::uuid, 'author@t.dev', 'authenticated', 'authenticated',
   '00000000-0000-0000-0000-000000000000'::uuid, now()),
  ('bbbbbbbb-0000-0000-0000-000000000002'::uuid, 'student@t.dev', 'authenticated', 'authenticated',
   '00000000-0000-0000-0000-000000000000'::uuid, now());

update public.profiles set role = 'author' where id = 'bbbbbbbb-0000-0000-0000-000000000001'::uuid;

-- Unit + lesson em draft
insert into public.units (id, slug, order_index, title_en, title_pt_br, status)
values ('bbbbbbbb-0000-0000-0000-000000000100'::uuid, 'greetings', 1, 'Greetings', 'Cumprimentos', 'draft');

insert into public.lessons (id, unit_id, slug, order_index, title_en, title_pt_br, level, status)
values ('bbbbbbbb-0000-0000-0000-000000000200'::uuid,
        'bbbbbbbb-0000-0000-0000-000000000100'::uuid,
        'hello', 1, 'Hello', 'Olá', 'a0', 'draft');

-- 2 sections: uma drill (output) e uma new_words (input)
insert into public.lesson_sections (id, lesson_id, order_index, kind, required)
values
  ('bbbbbbbb-0000-0000-0000-000000000301'::uuid,
   'bbbbbbbb-0000-0000-0000-000000000200'::uuid, 1, 'new_words', true),
  ('bbbbbbbb-0000-0000-0000-000000000302'::uuid,
   'bbbbbbbb-0000-0000-0000-000000000200'::uuid, 2, 'drill', true),
  ('bbbbbbbb-0000-0000-0000-000000000303'::uuid,
   'bbbbbbbb-0000-0000-0000-000000000200'::uuid, 3, 'recap', true);

-- Exercícios
insert into public.exercises (id, lesson_section_id, type, order_index, payload, expected)
values
  ('bbbbbbbb-0000-0000-0000-000000000401'::uuid,
   'bbbbbbbb-0000-0000-0000-000000000302'::uuid, 'multiple_choice', 1,
   '{"question": "What?", "options": ["a","b"]}'::jsonb, '{"answer": 0}'::jsonb),
  ('bbbbbbbb-0000-0000-0000-000000000402'::uuid,
   'bbbbbbbb-0000-0000-0000-000000000303'::uuid, 'review_quiz', 1,
   '{}'::jsonb, '{}'::jsonb);

-- ============================================================================
-- TEST 1: author publica lesson -> cria lesson_versions v1
-- ============================================================================

perform set_config('role', 'authenticated', true);
perform set_config('request.jwt.claims',
  json_build_object('sub', 'bbbbbbbb-0000-0000-0000-000000000001', 'role', 'authenticated')::text, true);

select public.publish_lesson('bbbbbbbb-0000-0000-0000-000000000200'::uuid) \gset lv1_

select is(
  (select status::text from public.lessons where id = 'bbbbbbbb-0000-0000-0000-000000000200'::uuid),
  'published',
  'lesson.status = published after publish_lesson'
);

select is(
  (select version from public.lesson_versions where lesson_id = 'bbbbbbbb-0000-0000-0000-000000000200'::uuid),
  1,
  'lesson_versions v1 created'
);

-- Snapshot contém sections
select cmp_ok(
  (select jsonb_array_length(snapshot->'sections') from public.lesson_versions
   where lesson_id = 'bbbbbbbb-0000-0000-0000-000000000200'::uuid),
  '=',
  3,
  'snapshot captures all 3 sections'
);

select cmp_ok(
  (select jsonb_array_length(snapshot->'exercises') from public.lesson_versions
   where lesson_id = 'bbbbbbbb-0000-0000-0000-000000000200'::uuid),
  '=',
  2,
  'snapshot captures all 2 exercises'
);

-- ============================================================================
-- TEST 5: segundo publish incrementa versão
-- ============================================================================

set role postgres;
update public.lessons set status = 'draft' where id = 'bbbbbbbb-0000-0000-0000-000000000200'::uuid;

perform set_config('role', 'authenticated', true);
perform set_config('request.jwt.claims',
  json_build_object('sub', 'bbbbbbbb-0000-0000-0000-000000000001', 'role', 'authenticated')::text, true);

select public.publish_lesson('bbbbbbbb-0000-0000-0000-000000000200'::uuid);

select is(
  (select count(*)::int from public.lesson_versions where lesson_id = 'bbbbbbbb-0000-0000-0000-000000000200'::uuid),
  2,
  'second publish creates v2 (two versions total)'
);

-- ============================================================================
-- TEST 6: student tenta publicar -> erro
-- ============================================================================

perform set_config('role', 'authenticated', true);
perform set_config('request.jwt.claims',
  json_build_object('sub', 'bbbbbbbb-0000-0000-0000-000000000002', 'role', 'authenticated')::text, true);

select throws_ok(
  $$ select public.publish_lesson('bbbbbbbb-0000-0000-0000-000000000200'::uuid) $$,
  NULL,
  NULL,
  'student cannot publish lesson'
);

-- ============================================================================
-- TEST 7: unit snapshot também
-- ============================================================================

set role postgres;
insert into public.unit_versions (id, unit_id, version, snapshot)
values ('bbbbbbbb-0000-0000-0000-000000000500'::uuid,
        'bbbbbbbb-0000-0000-0000-000000000100'::uuid, 1, '{}'::jsonb);

update public.units
  set status = 'published', published_version_id = 'bbbbbbbb-0000-0000-0000-000000000500'::uuid
  where id = 'bbbbbbbb-0000-0000-0000-000000000100'::uuid;

-- Student cria progresso
perform set_config('role', 'authenticated', true);
perform set_config('request.jwt.claims',
  json_build_object('sub', 'bbbbbbbb-0000-0000-0000-000000000002', 'role', 'authenticated')::text, true);

-- Pega lesson_version mais recente
select id::text into temp table _lv from public.lesson_versions
  where lesson_id = 'bbbbbbbb-0000-0000-0000-000000000200'::uuid
  order by version desc limit 1;

set role postgres;
insert into public.lesson_progress (
  user_id, lesson_id, lesson_version_id, unit_version_id, sections_completed
) select
  'bbbbbbbb-0000-0000-0000-000000000002'::uuid,
  'bbbbbbbb-0000-0000-0000-000000000200'::uuid,
  id::uuid,
  'bbbbbbbb-0000-0000-0000-000000000500'::uuid,
  array['new_words','drill','recap']::public.lesson_section_kind[]
from _lv;

-- Precisamos de snapshot.sections com required=true em lesson_versions;
-- ajustar manualmente para o teste:
update public.lesson_versions
  set snapshot = jsonb_build_object(
    'sections', jsonb_build_array(
      jsonb_build_object('kind', 'new_words', 'required', true),
      jsonb_build_object('kind', 'drill', 'required', true),
      jsonb_build_object('kind', 'recap', 'required', true)
    )
  )
  where lesson_id = 'bbbbbbbb-0000-0000-0000-000000000200'::uuid;

-- Attempts com grade 4 em output -> avg >= 3.0
insert into public.exercise_attempts (
  user_id, exercise_id, lesson_version_id, grade
)
select 'bbbbbbbb-0000-0000-0000-000000000002'::uuid,
       'bbbbbbbb-0000-0000-0000-000000000401'::uuid,
       id::uuid, 4
from _lv;

insert into public.exercise_attempts (
  user_id, exercise_id, lesson_version_id, grade
)
select 'bbbbbbbb-0000-0000-0000-000000000002'::uuid,
       'bbbbbbbb-0000-0000-0000-000000000402'::uuid,
       id::uuid, 5
from _lv;

-- ============================================================================
-- TEST 8: complete_lesson sucesso
-- ============================================================================

perform set_config('role', 'authenticated', true);
perform set_config('request.jwt.claims',
  json_build_object('sub', 'bbbbbbbb-0000-0000-0000-000000000002', 'role', 'authenticated')::text, true);

select public.complete_lesson(
  'bbbbbbbb-0000-0000-0000-000000000002'::uuid,
  (select id from _lv)::uuid
);

select is(
  (select status::text from public.lesson_progress
    where user_id = 'bbbbbbbb-0000-0000-0000-000000000002'::uuid),
  'completed',
  'complete_lesson marks status=completed when criteria met'
);

select cmp_ok(
  (select avg_grade from public.lesson_progress
    where user_id = 'bbbbbbbb-0000-0000-0000-000000000002'::uuid),
  '>=',
  3.0::numeric(3,2),
  'avg_grade recorded and >= 3.0'
);

-- ============================================================================
-- TEST 10: +50 pts registrado
-- ============================================================================

select is(
  (select amount from public.points_ledger
    where user_id = 'bbbbbbbb-0000-0000-0000-000000000002'::uuid
      and reason = 'lesson_completed'),
  50,
  '+50 points registered on lesson_completed'
);

-- ============================================================================
-- TEST 11 (11): complete_lesson falha com avg_grade < 3.0
-- ============================================================================

set role postgres;
delete from public.exercise_attempts where user_id = 'bbbbbbbb-0000-0000-0000-000000000002'::uuid;
update public.lesson_progress
  set status = 'in_progress', completed_at = null, avg_grade = null
  where user_id = 'bbbbbbbb-0000-0000-0000-000000000002'::uuid;

insert into public.exercise_attempts (user_id, exercise_id, lesson_version_id, grade)
select 'bbbbbbbb-0000-0000-0000-000000000002'::uuid,
       'bbbbbbbb-0000-0000-0000-000000000401'::uuid,
       id::uuid, 1
from _lv;

perform set_config('role', 'authenticated', true);
perform set_config('request.jwt.claims',
  json_build_object('sub', 'bbbbbbbb-0000-0000-0000-000000000002', 'role', 'authenticated')::text, true);

select throws_ok(
  $sq$ select public.complete_lesson(
    'bbbbbbbb-0000-0000-0000-000000000002'::uuid,
    (select id from _lv)::uuid
  ) $sq$,
  NULL,
  NULL,
  'complete_lesson raises when avg_grade < 3.0'
);

select finish();
rollback;
