-- 0005_functions_and_triggers.sql
-- Funções de negócio + triggers que mantêm invariantes atômicas.
-- Refs: docs/knowledge/08-regras-de-negocio.md, docs/adr/006-spaced-repetition.md,
--       docs/use-cases/UC-02, UC-05, UC-06, UC-08.

-- ============================================================================
-- handle_new_auth_user: cria profile + streak + learning_path_progress
-- ao criar linha em auth.users (UC-01).
-- ============================================================================

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;

  insert into public.streaks (user_id) values (new.id)
  on conflict (user_id) do nothing;

  insert into public.learning_path_progress (user_id) values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

comment on function public.handle_new_auth_user is
  'Cria profile + streak + learning_path_progress quando auth.users recebe novo usuário.';

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ============================================================================
-- apply_review_grade: SM-2 simplificado (ADR-006, knowledge/12)
-- Usa grade 0-5; ajusta stage, interval, ease_factor, due_at, consecutive_passes.
-- ============================================================================

create or replace function public.apply_review_grade(
  p_review_id uuid,
  p_grade smallint
)
returns public.reviews
language plpgsql
security invoker
set search_path = public
as $$
declare
  r public.reviews;
  next_stage public.review_stage;
  next_interval int;
  next_ease numeric(3,2);
  next_passes int;
begin
  if p_grade not between 0 and 5 then
    raise exception 'Grade must be 0-5, got %', p_grade;
  end if;

  select * into r from public.reviews where id = p_review_id;
  if not found then
    raise exception 'Review % not found', p_review_id;
  end if;

  -- Segurança extra: RLS já restringe, mas policy pode mudar.
  if r.user_id <> auth.uid() and public.current_role() not in ('admin') then
    raise exception 'Not allowed';
  end if;

  if p_grade >= 4 then
    next_stage := case r.stage
      when 'd1' then 'd3'::public.review_stage
      when 'd3' then 'd7'::public.review_stage
      when 'd7' then 'd14'::public.review_stage
      when 'd14' then 'd30'::public.review_stage
      when 'd30' then r.stage   -- fica em d30 até consecutive_passes >= 3
      else r.stage
    end;
    next_interval := case next_stage
      when 'd1' then 1
      when 'd3' then 3
      when 'd7' then 7
      when 'd14' then 14
      when 'd30' then 30
      else r.interval_days
    end;
    next_ease := least(3.00, r.ease_factor + 0.10);
    next_passes := r.consecutive_passes + 1;

    if r.stage = 'd30' and next_passes >= 3 then
      next_stage := 'mastered';
      next_interval := 0;
    end if;

  elsif p_grade = 3 then
    next_stage := r.stage;
    next_interval := greatest(
      1,
      (case r.stage
        when 'd1' then 1
        when 'd3' then 3
        when 'd7' then 7
        when 'd14' then 14
        when 'd30' then 30
        else 1
      end * r.ease_factor)::int
    );
    next_ease := r.ease_factor;
    next_passes := r.consecutive_passes;

  else  -- grade <= 2
    next_stage := case r.stage
      when 'd30' then 'd14'::public.review_stage
      when 'd14' then 'd7'::public.review_stage
      when 'd7' then 'd3'::public.review_stage
      when 'd3' then 'd1'::public.review_stage
      else 'd1'::public.review_stage
    end;
    next_interval := 1;
    next_ease := greatest(1.30, r.ease_factor - 0.20);
    next_passes := 0;
  end if;

  update public.reviews
  set stage = next_stage,
      interval_days = next_interval,
      ease_factor = next_ease,
      due_at = case when next_stage = 'mastered' then due_at else now() + (next_interval || ' days')::interval end,
      last_grade = p_grade,
      last_reviewed_at = now(),
      consecutive_passes = next_passes
  where id = p_review_id
  returning * into r;

  -- +5 pts se acertou (grade >= 3)
  if p_grade >= 3 then
    insert into public.points_ledger (user_id, amount, reason, ref_type, ref_id)
    values (r.user_id, 5, 'review_item_correct', 'review', r.id);
  end if;

  return r;
end;
$$;

comment on function public.apply_review_grade is
  'SM-2 simplificado. grade 0-5 → atualiza stage/interval/ease_factor/due_at. Ver ADR-006.';

-- ============================================================================
-- upsert_review_on_error: cria/puxa review quando aluno erra (grade <= 2)
-- ============================================================================

create or replace function public.upsert_review_on_error(
  p_user_id uuid,
  p_item_type public.review_item_type,
  p_item_id uuid,
  p_origin_lesson_version_id uuid
)
returns public.reviews
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.reviews;
begin
  insert into public.reviews (
    user_id, item_type, item_id, stage, interval_days, ease_factor,
    due_at, last_grade, last_reviewed_at, consecutive_passes, origin_lesson_version_id
  )
  values (
    p_user_id, p_item_type, p_item_id, 'd1', 1, 2.30,
    now(), 2, now(), 0, p_origin_lesson_version_id
  )
  on conflict (user_id, item_type, item_id) do update
  set stage = 'd1',
      interval_days = 1,
      ease_factor = greatest(1.30, public.reviews.ease_factor - 0.20),
      due_at = now(),
      last_grade = 2,
      last_reviewed_at = now(),
      consecutive_passes = 0
  returning * into r;

  return r;
end;
$$;

comment on function public.upsert_review_on_error is
  'Chamada quando aluno erra exercício. Cria review d1=agora ou puxa existente. Ver knowledge/08.';

-- ============================================================================
-- create_initial_review: cria review d1 ao primeiro contato com item no INPUT
-- ============================================================================

create or replace function public.create_initial_review(
  p_user_id uuid,
  p_item_type public.review_item_type,
  p_item_id uuid,
  p_origin_lesson_version_id uuid
)
returns public.reviews
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.reviews;
begin
  insert into public.reviews (
    user_id, item_type, item_id, stage, interval_days, ease_factor,
    due_at, origin_lesson_version_id
  )
  values (
    p_user_id, p_item_type, p_item_id, 'd1', 1, 2.50,
    now() + interval '1 day', p_origin_lesson_version_id
  )
  on conflict (user_id, item_type, item_id) do nothing
  returning * into r;

  return r;  -- NULL se já existia (ok — primeira exposição já foi)
end;
$$;

comment on function public.create_initial_review is
  'Cria review d1 ao primeiro contato com item no INPUT. Idempotente. Ver UC-02.';

-- ============================================================================
-- refresh_streak: incrementa, mantém ou reseta streak com regra de freeze
-- Chamado ao final de atividade qualificante (lesson_completed, review_session_completed ≥5, speaking ≥3).
-- ============================================================================

create or replace function public.refresh_streak(
  p_user_id uuid
)
returns public.streaks
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.streaks;
  today date;
  days_gap int;
begin
  select * into s from public.streaks where user_id = p_user_id for update;
  if not found then
    insert into public.streaks (user_id, current_count, last_active_date)
    values (p_user_id, 1, current_date) returning * into s;
    return s;
  end if;

  today := (now() at time zone coalesce((select timezone from public.profiles where id = p_user_id), 'UTC'))::date;

  if s.last_active_date = today then
    return s;  -- já contabilizado hoje
  end if;

  if s.last_active_date is null then
    days_gap := 999;
  else
    days_gap := today - s.last_active_date;
  end if;

  if days_gap = 1 then
    update public.streaks
    set current_count = current_count + 1,
        longest_count = greatest(longest_count, current_count + 1),
        last_active_date = today,
        freeze_tokens = case
          when (current_count + 1) % 14 = 0 and freeze_tokens < 2 then freeze_tokens + 1
          else freeze_tokens
        end
    where user_id = p_user_id
    returning * into s;

  elsif days_gap = 2 and s.freeze_tokens > 0 then
    -- gasta freeze para cobrir 1 dia parado
    update public.streaks
    set current_count = current_count + 1,
        longest_count = greatest(longest_count, current_count + 1),
        last_active_date = today,
        freeze_tokens = freeze_tokens - 1
    where user_id = p_user_id
    returning * into s;

  else
    -- quebra streak
    update public.streaks
    set current_count = 1,
        last_active_date = today
    where user_id = p_user_id
    returning * into s;
  end if;

  return s;
end;
$$;

comment on function public.refresh_streak is
  'Atualiza streak ao final de atividade qualificante. Usa timezone do profile. Ver knowledge/09.';

-- ============================================================================
-- complete_lesson: valida critérios e marca lesson como concluída (UC-02)
-- ============================================================================

create or replace function public.complete_lesson(
  p_user_id uuid,
  p_lesson_version_id uuid
)
returns public.lesson_progress
language plpgsql
security definer
set search_path = public
as $$
declare
  lp public.lesson_progress;
  lv public.lesson_versions;
  l public.lessons;
  u public.units;
  avg_output_grade numeric(3,2);
  required_sections public.lesson_section_kind[];
  all_required_visited boolean;
begin
  select * into lp
    from public.lesson_progress
    where user_id = p_user_id and lesson_version_id = p_lesson_version_id
    for update;

  if not found then
    raise exception 'lesson_progress not found for user % version %', p_user_id, p_lesson_version_id;
  end if;

  if lp.status = 'completed' then
    return lp;  -- idempotente
  end if;

  select * into lv from public.lesson_versions where id = p_lesson_version_id;
  select * into l from public.lessons where id = lv.lesson_id;
  select * into u from public.units where id = l.unit_id;

  -- Extrai seções obrigatórias do snapshot (lesson_versions.snapshot.sections com required=true).
  select coalesce(array_agg((s->>'kind')::public.lesson_section_kind),
                  array[]::public.lesson_section_kind[])
  into required_sections
  from jsonb_array_elements(lv.snapshot->'sections') s
  where (s->>'required')::boolean = true;

  all_required_visited := required_sections <@ lp.sections_completed;

  -- avg_grade das seções de OUTPUT: drill, speak_now, pair_practice, pronunciation, recap.
  select round(avg(ea.grade)::numeric, 2) into avg_output_grade
  from public.exercise_attempts ea
  join public.exercises ex on ex.id = ea.exercise_id
  join public.lesson_sections ls on ls.id = ex.lesson_section_id
  where ea.user_id = p_user_id
    and ea.lesson_version_id = p_lesson_version_id
    and ls.kind in ('drill','speak_now','pair_practice','pronunciation','recap');

  if not all_required_visited then
    raise exception 'Required sections not all visited' using hint = 'Complete all required sections before calling complete_lesson';
  end if;

  if avg_output_grade is null or avg_output_grade < 3.0 then
    raise exception 'OUTPUT avg grade below threshold: %', avg_output_grade
      using hint = 'Student needs to retry output exercises';
  end if;

  update public.lesson_progress
  set status = 'completed',
      completed_at = now(),
      avg_grade = avg_output_grade
  where id = lp.id
  returning * into lp;

  -- +50 pts
  insert into public.points_ledger (user_id, amount, reason, ref_type, ref_id)
  values (p_user_id, 50, 'lesson_completed', 'lesson_version', p_lesson_version_id);

  -- unit_progress upsert
  insert into public.unit_progress (user_id, unit_id, unit_version_id, status, started_at)
  values (
    p_user_id, u.id,
    coalesce(u.published_version_id, (select id from public.unit_versions where unit_id = u.id order by version desc limit 1)),
    'in_progress', now()
  )
  on conflict (user_id, unit_version_id) do nothing;

  -- avança learning_path_progress para próxima lesson na mesma unit, se houver
  update public.learning_path_progress
  set current_lesson_id = coalesce((
    select nxt.id from public.lessons nxt
    where nxt.unit_id = l.unit_id
      and nxt.status = 'published'
      and nxt.order_index > l.order_index
    order by nxt.order_index asc
    limit 1
  ), current_lesson_id)
  where user_id = p_user_id;

  -- streak
  perform public.refresh_streak(p_user_id);

  return lp;
end;
$$;

comment on function public.complete_lesson is
  'Valida critérios e marca lesson completed. Idempotente. Ver UC-02, knowledge/08.';

-- ============================================================================
-- Trigger: após exercise_attempt com grade <= 2, criar/puxar reviews
-- Detalhe: identificação do item a revisar depende do tipo do exercício,
-- portanto a Edge Function que persiste o attempt também chama
-- upsert_review_on_error explicitamente. Este trigger é backup para casos
-- simples em que payload.target_item_id está presente.
-- ============================================================================

create or replace function public.trg_exercise_attempt_bad_grade()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
  target_type public.review_item_type;
begin
  if new.grade > 2 then
    return new;
  end if;

  select (p.payload->>'target_item_id')::uuid,
         (p.payload->>'target_item_type')::public.review_item_type
  into target_id, target_type
  from public.exercises p where p.id = new.exercise_id;

  if target_id is not null and target_type is not null then
    perform public.upsert_review_on_error(
      new.user_id, target_type, target_id, new.lesson_version_id
    );
  end if;

  return new;
end;
$$;

comment on function public.trg_exercise_attempt_bad_grade is
  'Backup: se exercise.payload declara target_item_id/type, cria review em grade <= 2.';

create trigger exercise_attempts_bad_grade_review
  after insert on public.exercise_attempts
  for each row execute function public.trg_exercise_attempt_bad_grade();

-- ============================================================================
-- publish_lesson: cria snapshot imutável + atualiza lessons.status
-- ============================================================================

create or replace function public.publish_lesson(
  p_lesson_id uuid
)
returns public.lesson_versions
language plpgsql
security definer
set search_path = public
as $$
declare
  l public.lessons;
  next_version int;
  snapshot jsonb;
  new_version public.lesson_versions;
begin
  if not public.is_content_editor() then
    raise exception 'Only author/reviewer/admin can publish';
  end if;

  select * into l from public.lessons where id = p_lesson_id for update;
  if not found then
    raise exception 'Lesson % not found', p_lesson_id;
  end if;

  select coalesce(max(version), 0) + 1 into next_version
    from public.lesson_versions where lesson_id = p_lesson_id;

  -- Snapshot: lesson + sections + exercises + referências resolvidas.
  select jsonb_build_object(
    'lesson', to_jsonb(l),
    'sections', coalesce((
      select jsonb_agg(to_jsonb(s) order by s.order_index)
      from public.lesson_sections s where s.lesson_id = l.id
    ), '[]'::jsonb),
    'exercises', coalesce((
      select jsonb_agg(to_jsonb(ex) order by ex.order_index)
      from public.exercises ex
      join public.lesson_sections s on s.id = ex.lesson_section_id
      where s.lesson_id = l.id
    ), '[]'::jsonb),
    'vocabulary', coalesce((
      select jsonb_agg(to_jsonb(v) order by lv.order_index)
      from public.lesson_vocabulary lv
      join public.vocabulary_items v on v.id = lv.vocabulary_item_id
      where lv.lesson_id = l.id
    ), '[]'::jsonb),
    'phrases', coalesce((
      select jsonb_agg(to_jsonb(p) order by lp.order_index)
      from public.lesson_phrases lp
      join public.phrase_patterns p on p.id = lp.phrase_pattern_id
      where lp.lesson_id = l.id
    ), '[]'::jsonb),
    'grammar', coalesce((
      select jsonb_agg(to_jsonb(g) order by lg.order_index)
      from public.lesson_grammar lg
      join public.grammar_points g on g.id = lg.grammar_point_id
      where lg.lesson_id = l.id
    ), '[]'::jsonb),
    'dialogs', coalesce((
      select jsonb_agg(to_jsonb(d) order by d.dialog_key, d.order_index)
      from public.dialog_lines d where d.lesson_id = l.id
    ), '[]'::jsonb),
    'pronunciation_targets', coalesce((
      select jsonb_agg(to_jsonb(pt) order by pt.order_index)
      from public.pronunciation_targets pt where pt.lesson_id = l.id
    ), '[]'::jsonb)
  ) into snapshot;

  insert into public.lesson_versions (lesson_id, version, snapshot, published_by)
  values (p_lesson_id, next_version, snapshot, auth.uid())
  returning * into new_version;

  update public.lessons
  set status = 'published',
      published_version_id = new_version.id
  where id = p_lesson_id;

  -- Audit
  insert into public.audit_log (actor_id, action, target_table, target_id, metadata)
  values (auth.uid(), 'content.lesson_published', 'lessons', p_lesson_id,
          jsonb_build_object('version', next_version));

  return new_version;
end;
$$;

comment on function public.publish_lesson is
  'Publica lesson: cria lesson_versions com snapshot + atualiza status. Ver ADR-008, UC-08.';

-- ============================================================================
-- publish_unit: análogo para unit (snapshot + lessons referenciadas)
-- ============================================================================

create or replace function public.publish_unit(
  p_unit_id uuid
)
returns public.unit_versions
language plpgsql
security definer
set search_path = public
as $$
declare
  u public.units;
  next_version int;
  snapshot jsonb;
  new_version public.unit_versions;
begin
  if not public.is_content_editor() then
    raise exception 'Only author/reviewer/admin can publish';
  end if;

  select * into u from public.units where id = p_unit_id for update;
  if not found then
    raise exception 'Unit % not found', p_unit_id;
  end if;

  select coalesce(max(version), 0) + 1 into next_version
    from public.unit_versions where unit_id = p_unit_id;

  select jsonb_build_object(
    'unit', to_jsonb(u),
    'objectives', coalesce((
      select jsonb_agg(to_jsonb(o) order by o.order_index)
      from public.unit_objectives o where o.unit_id = u.id
    ), '[]'::jsonb),
    'lessons', coalesce((
      select jsonb_agg(jsonb_build_object(
        'lesson_id', l.id,
        'order_index', l.order_index,
        'published_version_id', l.published_version_id,
        'title_en', l.title_en,
        'title_pt_br', l.title_pt_br
      ) order by l.order_index)
      from public.lessons l where l.unit_id = u.id and l.status = 'published'
    ), '[]'::jsonb)
  ) into snapshot;

  insert into public.unit_versions (unit_id, version, snapshot, published_by)
  values (p_unit_id, next_version, snapshot, auth.uid())
  returning * into new_version;

  update public.units
  set status = 'published',
      published_version_id = new_version.id
  where id = p_unit_id;

  insert into public.audit_log (actor_id, action, target_table, target_id, metadata)
  values (auth.uid(), 'content.unit_published', 'units', p_unit_id,
          jsonb_build_object('version', next_version));

  return new_version;
end;
$$;

comment on function public.publish_unit is
  'Publica unit + snapshot. Ver ADR-008, UC-08.';

-- ============================================================================
-- submit_self_assessment: cria reviews conforme confidence; +200 pts; marca unit completa
-- ============================================================================

create or replace function public.submit_self_assessment(
  p_user_id uuid,
  p_unit_version_id uuid,
  p_items jsonb  -- [{unit_objective_id, confidence, note?}]
)
returns public.self_assessments
language plpgsql
security definer
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
  if not found then
    raise exception 'unit_version % not found', p_unit_version_id;
  end if;
  select * into u from public.units where id = uv.unit_id;

  -- Insere ou atualiza self_assessment
  insert into public.self_assessments (user_id, unit_id, unit_version_id)
  values (p_user_id, u.id, p_unit_version_id)
  on conflict (user_id, unit_version_id) do update
    set submitted_at = now()
  returning * into sa;

  -- Limpa items anteriores (resubmit sobrescreve)
  delete from public.self_assessment_items where self_assessment_id = sa.id;

  -- Insere novos items
  for item in select * from jsonb_array_elements(p_items)
  loop
    objective_id := (item->>'unit_objective_id')::uuid;
    conf := (item->>'confidence')::public.confidence_level;

    insert into public.self_assessment_items (
      self_assessment_id, unit_objective_id, confidence, note
    ) values (
      sa.id, objective_id, conf, item->>'note'
    );

    -- Criar reviews conforme confidence
    if conf = 'cant_yet' then
      -- Cria reviews imediatas para todos os vocab/phrase/grammar das lessons-origem do objetivo
      insert into public.reviews (user_id, item_type, item_id, stage, interval_days, due_at, origin_lesson_version_id)
      select p_user_id, 'vocab'::public.review_item_type, v.id, 'd1', 1, now(), l.published_version_id
      from public.unit_objectives o
      join public.lessons l on l.id = o.linked_lesson_id and l.status = 'published'
      join public.lesson_vocabulary lv on lv.lesson_id = l.id
      join public.vocabulary_items v on v.id = lv.vocabulary_item_id
      where o.id = objective_id
      on conflict (user_id, item_type, item_id) do update
        set stage = 'd1', interval_days = 1, due_at = now();

      insert into public.reviews (user_id, item_type, item_id, stage, interval_days, due_at, origin_lesson_version_id)
      select p_user_id, 'phrase'::public.review_item_type, p.id, 'd1', 1, now(), l.published_version_id
      from public.unit_objectives o
      join public.lessons l on l.id = o.linked_lesson_id and l.status = 'published'
      join public.lesson_phrases lp on lp.lesson_id = l.id
      join public.phrase_patterns p on p.id = lp.phrase_pattern_id
      where o.id = objective_id
      on conflict (user_id, item_type, item_id) do update
        set stage = 'd1', interval_days = 1, due_at = now();

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
      -- Reviews em 3 dias
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

  -- unit_progress = completed
  insert into public.unit_progress (user_id, unit_id, unit_version_id, status, started_at, completed_at)
  values (p_user_id, u.id, p_unit_version_id, 'completed', now(), now())
  on conflict (user_id, unit_version_id) do update
    set status = 'completed', completed_at = now();

  -- +200 pts (só primeira vez)
  if not exists (
    select 1 from public.points_ledger
    where user_id = p_user_id and reason = 'unit_completed' and ref_id = p_unit_version_id
  ) then
    insert into public.points_ledger (user_id, amount, reason, ref_type, ref_id)
    values (p_user_id, 200, 'unit_completed', 'unit_version', p_unit_version_id);
  end if;

  -- Destrava próxima unit em learning_path_progress
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
  'Submete autoavaliação, cria reviews conforme confidence, conclui unit. Idempotente em +200pts. Ver UC-06.';

-- ============================================================================
-- Job: purge_expired_recordings (diário). Apenas marca audio_key=NULL no Postgres;
-- a Edge Function purge-recordings cuida do S3. Ver UC-10.
-- ============================================================================

create or replace function public.get_recordings_due_for_purge(p_limit int default 1000)
returns table (
  source_table text,
  row_id uuid,
  audio_key text,
  user_id uuid
)
language sql
security definer
set search_path = public
as $$
  select 'pronunciation_attempts'::text, pa.id, pa.audio_key, pa.user_id
  from public.pronunciation_attempts pa
  join public.profiles p on p.id = pa.user_id
  where pa.audio_key is not null
    and pa.created_at < now() - interval '90 days'
    and p.keep_recordings_indefinitely = false
  union all
  select 'speaking_turns'::text, st.id, st.audio_key, s.user_id
  from public.speaking_turns st
  join public.speaking_sessions s on s.id = st.session_id
  join public.profiles p on p.id = s.user_id
  where st.audio_key is not null
    and st.created_at < now() - interval '90 days'
    and p.keep_recordings_indefinitely = false
  limit p_limit;
$$;

comment on function public.get_recordings_due_for_purge is
  'Lista batch de audio_keys a purgar. Edge Function deleta em S3; marca audio_key=NULL depois. Ver UC-10.';

create or replace function public.mark_recording_purged(
  p_source_table text,
  p_row_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_source_table = 'pronunciation_attempts' then
    update public.pronunciation_attempts set audio_key = null where id = p_row_id;
  elsif p_source_table = 'speaking_turns' then
    update public.speaking_turns set audio_key = null where id = p_row_id;
  else
    raise exception 'Unknown source table %', p_source_table;
  end if;
end;
$$;

comment on function public.mark_recording_purged is
  'Chamada pela Edge Function após deletar o objeto em S3. Ver UC-10.';

-- ============================================================================
-- pg_cron: jobs agendados (ADR-013)
-- Nota: nomes com prefixo `w2_` para identificar; descomentar após confirmar ambiente.
-- ============================================================================

-- Executa diariamente às 02:00 UTC. No MVP usamos UTC; timezone local é fase 2.
-- select cron.schedule('w2_purge_recordings_daily', '0 2 * * *', $$
--   -- Edge Function fará a chamada real; aqui só garantimos execução do Postgres-side.
--   select 1;
-- $$);

-- Executa a cada 6h para recomputar 'due' reviews (backup caso trigger falhe).
-- select cron.schedule('w2_recompute_due_reviews', '0 */6 * * *', $$
--   select 1;  -- placeholder; logic vive em Edge Function.
-- $$);

-- Executa diário às 00:05 UTC para streak reset (aluno que não estudou ontem).
-- Lógica real é em Edge Function porque precisa do timezone do aluno.

-- ============================================================================
-- Permissões para service_role (Edge Functions) — default em Supabase.
-- Funções security definer já contornam RLS; nenhum grant adicional necessário.
-- ============================================================================
