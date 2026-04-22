-- 01_apply_review_grade.sql
-- Testa SM-2 simplificado: avanço, manutenção, regressão, masterização.
-- Refs: docs/adr/006-spaced-repetition.md

begin;
select plan(18);

-- Setup minimal: aluno + review.
set role postgres;

insert into auth.users (id, email, role, aud, instance_id, email_confirmed_at)
values ('aaaaaaaa-0000-0000-0000-000000000001'::uuid, 'srs@test.dev', 'authenticated', 'authenticated',
        '00000000-0000-0000-0000-000000000000'::uuid, now());

-- Criar vocab seed
insert into public.vocabulary_items (id, en, pt_br, status)
values ('aaaaaaaa-0000-0000-0000-000000000100'::uuid, 'coffee', 'café', 'published');

-- Review inicial d1
insert into public.reviews (
  id, user_id, item_type, item_id, stage, interval_days, ease_factor, due_at
) values (
  'aaaaaaaa-0000-0000-0000-000000000010'::uuid,
  'aaaaaaaa-0000-0000-0000-000000000001'::uuid,
  'vocab', 'aaaaaaaa-0000-0000-0000-000000000100'::uuid,
  'd1', 1, 2.50, now() - interval '1 hour'
);

-- "Autentica" como o aluno para a função apply_review_grade respeitar RLS
perform set_config('role', 'authenticated', true);
perform set_config('request.jwt.claims',
  json_build_object('sub', 'aaaaaaaa-0000-0000-0000-000000000001', 'role', 'authenticated')::text, true);

-- ============================================================================
-- TEST 1-3: grade 5 avança d1 -> d3
-- ============================================================================

select public.apply_review_grade('aaaaaaaa-0000-0000-0000-000000000010'::uuid, 5);

select is(
  (select stage::text from public.reviews where id = 'aaaaaaaa-0000-0000-0000-000000000010'::uuid),
  'd3',
  'grade 5 on d1 -> advance to d3'
);

select is(
  (select interval_days from public.reviews where id = 'aaaaaaaa-0000-0000-0000-000000000010'::uuid),
  3,
  'interval = 3 days after d1 -> d3'
);

select is(
  (select ease_factor from public.reviews where id = 'aaaaaaaa-0000-0000-0000-000000000010'::uuid),
  2.60::numeric(3,2),
  'ease_factor += 0.10 on grade >= 4'
);

-- ============================================================================
-- TEST 4-5: grade 5 avança d3 -> d7
-- ============================================================================

select public.apply_review_grade('aaaaaaaa-0000-0000-0000-000000000010'::uuid, 5);

select is(
  (select stage::text from public.reviews where id = 'aaaaaaaa-0000-0000-0000-000000000010'::uuid),
  'd7',
  'grade 5 on d3 -> advance to d7'
);

select is(
  (select consecutive_passes from public.reviews where id = 'aaaaaaaa-0000-0000-0000-000000000010'::uuid),
  2,
  'consecutive_passes = 2 after two grade 5'
);

-- ============================================================================
-- TEST 6: grade 2 regride d7 -> d3 (não d1); reset passes; reduz ease
-- ============================================================================

select public.apply_review_grade('aaaaaaaa-0000-0000-0000-000000000010'::uuid, 2);

select is(
  (select stage::text from public.reviews where id = 'aaaaaaaa-0000-0000-0000-000000000010'::uuid),
  'd3',
  'grade 2 on d7 regresses to d3'
);

select is(
  (select interval_days from public.reviews where id = 'aaaaaaaa-0000-0000-0000-000000000010'::uuid),
  1,
  'interval resets to 1 day on grade <= 2'
);

select is(
  (select consecutive_passes from public.reviews where id = 'aaaaaaaa-0000-0000-0000-000000000010'::uuid),
  0,
  'consecutive_passes resets on grade <= 2'
);

select cmp_ok(
  (select ease_factor from public.reviews where id = 'aaaaaaaa-0000-0000-0000-000000000010'::uuid),
  '<',
  2.70::numeric(3,2),
  'ease_factor decreases on grade <= 2'
);

-- ============================================================================
-- TEST 10: ease_factor tem piso em 1.30
-- ============================================================================

-- Força 5 grades ruins seguidos
select public.apply_review_grade('aaaaaaaa-0000-0000-0000-000000000010'::uuid, 1);
select public.apply_review_grade('aaaaaaaa-0000-0000-0000-000000000010'::uuid, 1);
select public.apply_review_grade('aaaaaaaa-0000-0000-0000-000000000010'::uuid, 1);
select public.apply_review_grade('aaaaaaaa-0000-0000-0000-000000000010'::uuid, 1);
select public.apply_review_grade('aaaaaaaa-0000-0000-0000-000000000010'::uuid, 1);

select cmp_ok(
  (select ease_factor from public.reviews where id = 'aaaaaaaa-0000-0000-0000-000000000010'::uuid),
  '>=',
  1.30::numeric(3,2),
  'ease_factor floor at 1.30'
);

-- ============================================================================
-- TEST 11: grade 3 mantém stage
-- ============================================================================

-- reset stage para d3
set role postgres;
update public.reviews
  set stage = 'd3', interval_days = 3, ease_factor = 2.50, consecutive_passes = 0
  where id = 'aaaaaaaa-0000-0000-0000-000000000010'::uuid;

perform set_config('role', 'authenticated', true);
perform set_config('request.jwt.claims',
  json_build_object('sub', 'aaaaaaaa-0000-0000-0000-000000000001', 'role', 'authenticated')::text, true);

select public.apply_review_grade('aaaaaaaa-0000-0000-0000-000000000010'::uuid, 3);

select is(
  (select stage::text from public.reviews where id = 'aaaaaaaa-0000-0000-0000-000000000010'::uuid),
  'd3',
  'grade 3 maintains stage'
);

select is(
  (select ease_factor from public.reviews where id = 'aaaaaaaa-0000-0000-0000-000000000010'::uuid),
  2.50::numeric(3,2),
  'grade 3 does not change ease_factor'
);

-- ============================================================================
-- TEST 13-15: masterização d30 com 3 passes consecutivos
-- ============================================================================

set role postgres;
update public.reviews
  set stage = 'd30', interval_days = 30, ease_factor = 2.80, consecutive_passes = 2
  where id = 'aaaaaaaa-0000-0000-0000-000000000010'::uuid;

perform set_config('role', 'authenticated', true);
perform set_config('request.jwt.claims',
  json_build_object('sub', 'aaaaaaaa-0000-0000-0000-000000000001', 'role', 'authenticated')::text, true);

-- Primeiro pass em d30 já vem com 2 acumulados -> próximo é 3 -> masterizar
select public.apply_review_grade('aaaaaaaa-0000-0000-0000-000000000010'::uuid, 5);

select is(
  (select stage::text from public.reviews where id = 'aaaaaaaa-0000-0000-0000-000000000010'::uuid),
  'mastered',
  'grade 5 on d30 with 3+ consecutive_passes -> mastered'
);

select is(
  (select interval_days from public.reviews where id = 'aaaaaaaa-0000-0000-0000-000000000010'::uuid),
  0,
  'mastered has interval 0'
);

-- ============================================================================
-- TEST 16: +5 points on grade >= 3
-- ============================================================================

set role postgres;
-- reset
delete from public.points_ledger where user_id = 'aaaaaaaa-0000-0000-0000-000000000001'::uuid;
update public.reviews
  set stage = 'd1', interval_days = 1, ease_factor = 2.50, consecutive_passes = 0
  where id = 'aaaaaaaa-0000-0000-0000-000000000010'::uuid;

perform set_config('role', 'authenticated', true);
perform set_config('request.jwt.claims',
  json_build_object('sub', 'aaaaaaaa-0000-0000-0000-000000000001', 'role', 'authenticated')::text, true);

select public.apply_review_grade('aaaaaaaa-0000-0000-0000-000000000010'::uuid, 4);

select is(
  (select amount from public.points_ledger
    where user_id = 'aaaaaaaa-0000-0000-0000-000000000001'::uuid
      and reason = 'review_item_correct'),
  5,
  '+5 points registered on grade >= 3'
);

-- ============================================================================
-- TEST 17: grade fora do range 0-5 levanta exceção
-- ============================================================================

select throws_ok(
  $$ select public.apply_review_grade('aaaaaaaa-0000-0000-0000-000000000010'::uuid, 7::smallint) $$,
  NULL,
  NULL,
  'grade > 5 raises exception'
);

-- ============================================================================
-- TEST 18: review não existente levanta exceção
-- ============================================================================

select throws_ok(
  $$ select public.apply_review_grade('ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid, 5::smallint) $$,
  NULL,
  NULL,
  'nonexistent review raises exception'
);

select finish();
rollback;
