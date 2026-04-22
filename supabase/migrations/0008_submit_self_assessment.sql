-- 0008_submit_self_assessment.sql
-- submit_self_assessment: cria reviews conforme confidence; +200 pts; marca unit completa.
-- Esta migration recria a função (CREATE OR REPLACE) — em ambientes frescos,
-- a mesma função já foi criada por 0005; aqui apenas garantimos idempotência
-- e documentação isolada. Ver docs/use-cases/UC-06-self-assessment.md.

create or replace function public.submit_self_assessment(
  p_user_id uuid,
  p_unit_version_id uuid,
  p_items jsonb  -- [{unit_objective_id, confidence, note?}]
)
returns public.self_assessments
language plpgsql security definer
set search_path = public
as $$
declare
  sa public.self_assessments;
  uv public.unit_versions;
  u public.units;
  item jsonb;
  objective_id uuid;
  conf public.confidence_level;
begin
  if p_user_id <> auth.uid() and public.current_role() not in ('admin') then
    raise exception 'Not allowed';
  end if;

  select * into uv from public.unit_versions where id = p_unit_version_id;
  if not found then raise exception 'unit_version % not found', p_unit_version_id; end if;
  select * into u from public.units where id = uv.unit_id;

  insert into public.self_assessments (user_id, unit_id, unit_version_id)
  values (p_user_id, u.id, p_unit_version_id)
  on conflict (user_id, unit_version_id) do update set submitted_at = now()
  returning * into sa;

  delete from public.self_assessment_items where self_assessment_id = sa.id;

  for item in select * from jsonb_array_elements(p_items)
  loop
    objective_id := (item->>'unit_objective_id')::uuid;
    conf := (item->>'confidence')::public.confidence_level;

    insert into public.self_assessment_items (
      self_assessment_id, unit_objective_id, confidence, note
    ) values (sa.id, objective_id, conf, item->>'note');

    if conf = 'cant_yet' then
      -- vocabulario
      insert into public.reviews (user_id, item_type, item_id, stage, interval_days, due_at, origin_lesson_version_id)
      select p_user_id, 'vocab'::public.review_item_type, v.id, 'd1', 1, now(), l.published_version_id
      from public.unit_objectives o
      join public.lessons l on l.id = o.linked_lesson_id and l.status = 'published'
      join public.lesson_vocabulary lv on lv.lesson_id = l.id
      join public.vocabulary_items v on v.id = lv.vocabulary_item_id
      where o.id = objective_id
      on conflict (user_id, item_type, item_id) do update
        set stage = 'd1', interval_days = 1, due_at = now();

      -- phrases
      insert into public.reviews (user_id, item_type, item_id, stage, interval_days, due_at, origin_lesson_version_id)
      select p_user_id, 'phrase'::public.review_item_type, p.id, 'd1', 1, now(), l.published_version_id
      from public.unit_objectives o
      join public.lessons l on l.id = o.linked_lesson_id and l.status = 'published'
      join public.lesson_phrases lp on lp.lesson_id = l.id
      join public.phrase_patterns p on p.id = lp.phrase_pattern_id
      where o.id = objective_id
      on conflict (user_id, item_type, item_id) do update
        set stage = 'd1', interval_days = 1, due_at = now();

      -- grammar
      insert into public.reviews (user_id, item_type, item_id, stage, interval_days, due_at, origin_lesson_version_id)
      select p_user_id, 'grammar'::public.review_item_type, g.id, 'd1', 1, now(), l.published_version_id
      from public.unit_objectives o
      join public.lessons l on l.id = o.linked_lesson_id and l.status = 'published'
      join public.lesson_grammar lg on lg.lesson_id = l.id
      join public.grammar_points g on g.id = lg.grammar_point_id
      where o.id = objective_id
      on conflict (user_id, item_type, item_id) do update
        set stage = 'd1', interval_days = 1, due_at = now();

    elsif conf = 'not_sure' then
      insert into public.reviews (user_id, item_type, item_id, stage, interval_days, due_at, origin_lesson_version_id)
      select p_user_id, 'vocab'::public.review_item_type, v.id, 'd3', 3, now() + interval '3 days', l.published_version_id
      from public.unit_objectives o
      join public.lessons l on l.id = o.linked_lesson_id and l.status = 'published'
      join public.lesson_vocabulary lv on lv.lesson_id = l.id
      join public.vocabulary_items v on v.id = lv.vocabulary_item_id
      where o.id = objective_id
      on conflict (user_id, item_type, item_id) do nothing;
    end if;
  end loop;

  insert into public.unit_progress (user_id, unit_id, unit_version_id, status, started_at, completed_at)
  values (p_user_id, u.id, p_unit_version_id, 'completed', now(), now())
  on conflict (user_id, unit_version_id) do update
    set status = 'completed', completed_at = now();

  if not exists (
    select 1 from public.points_ledger
    where user_id = p_user_id and reason = 'unit_completed' and ref_id = p_unit_version_id
  ) then
    insert into public.points_ledger (user_id, amount, reason, ref_type, ref_id)
    values (p_user_id, 200, 'unit_completed', 'unit_version', p_unit_version_id);
  end if;

  update public.learning_path_progress
  set current_unit_id = (
    select nxt.id from public.units nxt
    where nxt.status = 'published' and nxt.order_index > u.order_index
    order by nxt.order_index limit 1
  )
  where user_id = p_user_id
    and (current_unit_id = u.id or current_unit_id is null);

  return sa;
end;
$$;

comment on function public.submit_self_assessment is
  'Submete autoavaliação, cria reviews conforme confidence, conclui unit. +200 pts idempotente. Ver UC-06.';
