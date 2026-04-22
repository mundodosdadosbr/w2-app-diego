-- 0006_rls_policies_optimized.sql
-- Reescreve policies de 0004 aplicando duas otimizações do Supabase Advisor:
--   1. auth_rls_initplan: wrap `auth.uid()` / `current_role()` / `is_content_editor()`
--      em `(select ...)` para que Postgres cacheie ao invés de avaliar por linha.
--   2. multiple_permissive_policies: separar policies FOR ALL de editor em
--      INSERT/UPDATE/DELETE específicas, e consolidar SELECT em policy única
--      com OR entre "published" e "editor".
-- Também adiciona índices em FKs hot-path (unindexed_foreign_keys INFO).
-- Referências: Supabase database linter 0003/0006/0001.

-- ============================================================================
-- Drop policies antigas (todas as de 0004)
-- ============================================================================

drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_select_admin on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_update_admin on public.profiles;
drop policy if exists profiles_delete_admin on public.profiles;

drop policy if exists units_select_published on public.units;
drop policy if exists units_select_editors on public.units;
drop policy if exists units_modify_editors on public.units;

drop policy if exists unit_objectives_select_published on public.unit_objectives;
drop policy if exists unit_objectives_select_editors on public.unit_objectives;
drop policy if exists unit_objectives_modify_editors on public.unit_objectives;

drop policy if exists unit_versions_select_all on public.unit_versions;
drop policy if exists unit_versions_insert_editors on public.unit_versions;

drop policy if exists lessons_select_published on public.lessons;
drop policy if exists lessons_select_editors on public.lessons;
drop policy if exists lessons_modify_editors on public.lessons;

drop policy if exists lesson_versions_select_all on public.lesson_versions;
drop policy if exists lesson_versions_insert_editors on public.lesson_versions;
drop policy if exists lesson_versions_update_editors on public.lesson_versions;

drop policy if exists lesson_sections_select_published on public.lesson_sections;
drop policy if exists lesson_sections_select_editors on public.lesson_sections;
drop policy if exists lesson_sections_modify_editors on public.lesson_sections;

drop policy if exists dialog_lines_select_published on public.dialog_lines;
drop policy if exists dialog_lines_select_editors on public.dialog_lines;
drop policy if exists dialog_lines_modify_editors on public.dialog_lines;

drop policy if exists exercises_select_published on public.exercises;
drop policy if exists exercises_select_editors on public.exercises;
drop policy if exists exercises_modify_editors on public.exercises;

drop policy if exists pronunciation_targets_select_published on public.pronunciation_targets;
drop policy if exists pronunciation_targets_select_editors on public.pronunciation_targets;
drop policy if exists pronunciation_targets_modify_editors on public.pronunciation_targets;

drop policy if exists vocabulary_items_select_published on public.vocabulary_items;
drop policy if exists vocabulary_items_select_editors on public.vocabulary_items;
drop policy if exists vocabulary_items_modify_editors on public.vocabulary_items;

drop policy if exists phrase_patterns_select_published on public.phrase_patterns;
drop policy if exists phrase_patterns_select_editors on public.phrase_patterns;
drop policy if exists phrase_patterns_modify_editors on public.phrase_patterns;

drop policy if exists grammar_points_select_published on public.grammar_points;
drop policy if exists grammar_points_select_editors on public.grammar_points;
drop policy if exists grammar_points_modify_editors on public.grammar_points;

drop policy if exists lesson_vocabulary_select on public.lesson_vocabulary;
drop policy if exists lesson_vocabulary_modify_editors on public.lesson_vocabulary;

drop policy if exists lesson_phrases_select on public.lesson_phrases;
drop policy if exists lesson_phrases_modify_editors on public.lesson_phrases;

drop policy if exists lesson_grammar_select on public.lesson_grammar;
drop policy if exists lesson_grammar_modify_editors on public.lesson_grammar;

drop policy if exists learning_path_progress_own on public.learning_path_progress;

drop policy if exists unit_progress_own on public.unit_progress;
drop policy if exists unit_progress_admin_select on public.unit_progress;

drop policy if exists lesson_progress_own on public.lesson_progress;
drop policy if exists lesson_progress_admin_select on public.lesson_progress;

drop policy if exists exercise_attempts_own on public.exercise_attempts;
drop policy if exists exercise_attempts_admin_select on public.exercise_attempts;

drop policy if exists speaking_sessions_own on public.speaking_sessions;
drop policy if exists speaking_sessions_admin_select on public.speaking_sessions;

drop policy if exists speaking_turns_own on public.speaking_turns;
drop policy if exists speaking_turns_admin_select on public.speaking_turns;

drop policy if exists pronunciation_attempts_own on public.pronunciation_attempts;
drop policy if exists pronunciation_attempts_admin_select on public.pronunciation_attempts;

drop policy if exists reviews_own on public.reviews;
drop policy if exists reviews_admin_select on public.reviews;

drop policy if exists self_assessments_own on public.self_assessments;
drop policy if exists self_assessments_admin_select on public.self_assessments;

drop policy if exists self_assessment_items_own on public.self_assessment_items;
drop policy if exists self_assessment_items_admin_select on public.self_assessment_items;

drop policy if exists skill_checkpoints_own on public.skill_checkpoints;
drop policy if exists skill_checkpoints_admin_select on public.skill_checkpoints;

drop policy if exists streaks_own on public.streaks;
drop policy if exists streaks_admin_select on public.streaks;

drop policy if exists points_ledger_own_select on public.points_ledger;
drop policy if exists points_ledger_admin_select on public.points_ledger;

drop policy if exists user_reviews_plan_own on public.user_reviews_plan;

drop policy if exists ai_usage_admin_select on public.ai_usage;
drop policy if exists audit_log_admin_select on public.audit_log;

drop policy if exists tts_pregen_failures_editors on public.tts_pregen_failures;

-- ============================================================================
-- profiles
-- ============================================================================

create policy profiles_select on public.profiles for select
  using (
    id = (select auth.uid())
    or (select public.current_role()) in ('admin', 'reviewer')
  );

-- Nota: profiles_update é consolidado em 0007 para evitar multiple_permissive_policies.
create policy profiles_update_own on public.profiles for update
  using (id = (select auth.uid()))
  with check (
    id = (select auth.uid())
    and role = (select p.role from public.profiles p where p.id = (select auth.uid()))
  );

create policy profiles_update_admin on public.profiles for update
  using ((select public.current_role()) = 'admin')
  with check ((select public.current_role()) = 'admin');

create policy profiles_delete_admin on public.profiles for delete
  using ((select public.current_role()) = 'admin');

-- ============================================================================
-- Content tables: SELECT único (published OR editor) + editor split em INSERT/UPDATE/DELETE
-- ============================================================================

-- units
create policy units_select on public.units for select
  using (
    (status = 'published' and (select auth.uid()) is not null)
    or (select public.is_content_editor())
  );
create policy units_insert_editors on public.units for insert
  with check ((select public.is_content_editor()));
create policy units_update_editors on public.units for update
  using ((select public.is_content_editor()))
  with check ((select public.is_content_editor()));
create policy units_delete_editors on public.units for delete
  using ((select public.is_content_editor()));

-- unit_objectives
create policy unit_objectives_select on public.unit_objectives for select
  using (
    exists (select 1 from public.units u where u.id = unit_id and u.status = 'published')
    and (select auth.uid()) is not null
    or (select public.is_content_editor())
  );
create policy unit_objectives_insert_editors on public.unit_objectives for insert
  with check ((select public.is_content_editor()));
create policy unit_objectives_update_editors on public.unit_objectives for update
  using ((select public.is_content_editor()))
  with check ((select public.is_content_editor()));
create policy unit_objectives_delete_editors on public.unit_objectives for delete
  using ((select public.is_content_editor()));

-- unit_versions (imutável)
create policy unit_versions_select on public.unit_versions for select
  using ((select auth.uid()) is not null);
create policy unit_versions_insert_editors on public.unit_versions for insert
  with check ((select public.is_content_editor()));

-- lessons
create policy lessons_select on public.lessons for select
  using (
    (status = 'published' and (select auth.uid()) is not null)
    or (select public.is_content_editor())
  );
create policy lessons_insert_editors on public.lessons for insert
  with check ((select public.is_content_editor()));
create policy lessons_update_editors on public.lessons for update
  using ((select public.is_content_editor()))
  with check ((select public.is_content_editor()));
create policy lessons_delete_editors on public.lessons for delete
  using ((select public.is_content_editor()));

-- lesson_versions
create policy lesson_versions_select on public.lesson_versions for select
  using ((select auth.uid()) is not null);
create policy lesson_versions_insert_editors on public.lesson_versions for insert
  with check ((select public.is_content_editor()));
create policy lesson_versions_update_editors on public.lesson_versions for update
  using ((select public.is_content_editor()))
  with check ((select public.is_content_editor()));

-- lesson_sections / dialog_lines / exercises / pronunciation_targets: visibilidade via JOIN lessons
create policy lesson_sections_select on public.lesson_sections for select
  using (
    exists (select 1 from public.lessons l where l.id = lesson_id and l.status = 'published')
    and (select auth.uid()) is not null
    or (select public.is_content_editor())
  );
create policy lesson_sections_insert_editors on public.lesson_sections for insert
  with check ((select public.is_content_editor()));
create policy lesson_sections_update_editors on public.lesson_sections for update
  using ((select public.is_content_editor()))
  with check ((select public.is_content_editor()));
create policy lesson_sections_delete_editors on public.lesson_sections for delete
  using ((select public.is_content_editor()));

create policy dialog_lines_select on public.dialog_lines for select
  using (
    exists (select 1 from public.lessons l where l.id = lesson_id and l.status = 'published')
    and (select auth.uid()) is not null
    or (select public.is_content_editor())
  );
create policy dialog_lines_insert_editors on public.dialog_lines for insert
  with check ((select public.is_content_editor()));
create policy dialog_lines_update_editors on public.dialog_lines for update
  using ((select public.is_content_editor()))
  with check ((select public.is_content_editor()));
create policy dialog_lines_delete_editors on public.dialog_lines for delete
  using ((select public.is_content_editor()));

create policy exercises_select on public.exercises for select
  using (
    exists (
      select 1 from public.lesson_sections s
      join public.lessons l on l.id = s.lesson_id
      where s.id = lesson_section_id and l.status = 'published'
    )
    and (select auth.uid()) is not null
    or (select public.is_content_editor())
  );
create policy exercises_insert_editors on public.exercises for insert
  with check ((select public.is_content_editor()));
create policy exercises_update_editors on public.exercises for update
  using ((select public.is_content_editor()))
  with check ((select public.is_content_editor()));
create policy exercises_delete_editors on public.exercises for delete
  using ((select public.is_content_editor()));

create policy pronunciation_targets_select on public.pronunciation_targets for select
  using (
    exists (select 1 from public.lessons l where l.id = lesson_id and l.status = 'published')
    and (select auth.uid()) is not null
    or (select public.is_content_editor())
  );
create policy pronunciation_targets_insert_editors on public.pronunciation_targets for insert
  with check ((select public.is_content_editor()));
create policy pronunciation_targets_update_editors on public.pronunciation_targets for update
  using ((select public.is_content_editor()))
  with check ((select public.is_content_editor()));
create policy pronunciation_targets_delete_editors on public.pronunciation_targets for delete
  using ((select public.is_content_editor()));

-- vocabulary_items / phrase_patterns / grammar_points: status próprio
create policy vocabulary_items_select on public.vocabulary_items for select
  using ((status = 'published' and (select auth.uid()) is not null) or (select public.is_content_editor()));
create policy vocabulary_items_insert_editors on public.vocabulary_items for insert
  with check ((select public.is_content_editor()));
create policy vocabulary_items_update_editors on public.vocabulary_items for update
  using ((select public.is_content_editor())) with check ((select public.is_content_editor()));
create policy vocabulary_items_delete_editors on public.vocabulary_items for delete
  using ((select public.is_content_editor()));

create policy phrase_patterns_select on public.phrase_patterns for select
  using ((status = 'published' and (select auth.uid()) is not null) or (select public.is_content_editor()));
create policy phrase_patterns_insert_editors on public.phrase_patterns for insert
  with check ((select public.is_content_editor()));
create policy phrase_patterns_update_editors on public.phrase_patterns for update
  using ((select public.is_content_editor())) with check ((select public.is_content_editor()));
create policy phrase_patterns_delete_editors on public.phrase_patterns for delete
  using ((select public.is_content_editor()));

create policy grammar_points_select on public.grammar_points for select
  using ((status = 'published' and (select auth.uid()) is not null) or (select public.is_content_editor()));
create policy grammar_points_insert_editors on public.grammar_points for insert
  with check ((select public.is_content_editor()));
create policy grammar_points_update_editors on public.grammar_points for update
  using ((select public.is_content_editor())) with check ((select public.is_content_editor()));
create policy grammar_points_delete_editors on public.grammar_points for delete
  using ((select public.is_content_editor()));

-- joins M:N
create policy lesson_vocabulary_select on public.lesson_vocabulary for select
  using (
    ((select auth.uid()) is not null and
     exists (select 1 from public.lessons l where l.id = lesson_id and l.status = 'published'))
    or (select public.is_content_editor())
  );
create policy lesson_vocabulary_insert_editors on public.lesson_vocabulary for insert
  with check ((select public.is_content_editor()));
create policy lesson_vocabulary_update_editors on public.lesson_vocabulary for update
  using ((select public.is_content_editor())) with check ((select public.is_content_editor()));
create policy lesson_vocabulary_delete_editors on public.lesson_vocabulary for delete
  using ((select public.is_content_editor()));

create policy lesson_phrases_select on public.lesson_phrases for select
  using (
    ((select auth.uid()) is not null and
     exists (select 1 from public.lessons l where l.id = lesson_id and l.status = 'published'))
    or (select public.is_content_editor())
  );
create policy lesson_phrases_insert_editors on public.lesson_phrases for insert
  with check ((select public.is_content_editor()));
create policy lesson_phrases_update_editors on public.lesson_phrases for update
  using ((select public.is_content_editor())) with check ((select public.is_content_editor()));
create policy lesson_phrases_delete_editors on public.lesson_phrases for delete
  using ((select public.is_content_editor()));

create policy lesson_grammar_select on public.lesson_grammar for select
  using (
    ((select auth.uid()) is not null and
     exists (select 1 from public.lessons l where l.id = lesson_id and l.status = 'published'))
    or (select public.is_content_editor())
  );
create policy lesson_grammar_insert_editors on public.lesson_grammar for insert
  with check ((select public.is_content_editor()));
create policy lesson_grammar_update_editors on public.lesson_grammar for update
  using ((select public.is_content_editor())) with check ((select public.is_content_editor()));
create policy lesson_grammar_delete_editors on public.lesson_grammar for delete
  using ((select public.is_content_editor()));

-- ============================================================================
-- Student data: SELECT único (own OR admin) + own INSERT/UPDATE/DELETE
-- ============================================================================

create policy learning_path_progress_own on public.learning_path_progress for all
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy unit_progress_select on public.unit_progress for select
  using (user_id = (select auth.uid()) or (select public.current_role()) = 'admin');
create policy unit_progress_insert_own on public.unit_progress for insert
  with check (user_id = (select auth.uid()));
create policy unit_progress_update_own on public.unit_progress for update
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy unit_progress_delete_own on public.unit_progress for delete
  using (user_id = (select auth.uid()));

create policy lesson_progress_select on public.lesson_progress for select
  using (user_id = (select auth.uid()) or (select public.current_role()) = 'admin');
create policy lesson_progress_insert_own on public.lesson_progress for insert
  with check (user_id = (select auth.uid()));
create policy lesson_progress_update_own on public.lesson_progress for update
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy lesson_progress_delete_own on public.lesson_progress for delete
  using (user_id = (select auth.uid()));

create policy exercise_attempts_select on public.exercise_attempts for select
  using (user_id = (select auth.uid()) or (select public.current_role()) = 'admin');
create policy exercise_attempts_insert_own on public.exercise_attempts for insert
  with check (user_id = (select auth.uid()));
create policy exercise_attempts_update_own on public.exercise_attempts for update
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy exercise_attempts_delete_own on public.exercise_attempts for delete
  using (user_id = (select auth.uid()));

create policy speaking_sessions_select on public.speaking_sessions for select
  using (user_id = (select auth.uid()) or (select public.current_role()) = 'admin');
create policy speaking_sessions_insert_own on public.speaking_sessions for insert
  with check (user_id = (select auth.uid()));
create policy speaking_sessions_update_own on public.speaking_sessions for update
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy speaking_sessions_delete_own on public.speaking_sessions for delete
  using (user_id = (select auth.uid()));

create policy speaking_turns_select on public.speaking_turns for select
  using (
    exists (select 1 from public.speaking_sessions s where s.id = session_id and s.user_id = (select auth.uid()))
    or (select public.current_role()) = 'admin'
  );
create policy speaking_turns_insert_own on public.speaking_turns for insert
  with check (exists (select 1 from public.speaking_sessions s where s.id = session_id and s.user_id = (select auth.uid())));
create policy speaking_turns_update_own on public.speaking_turns for update
  using (exists (select 1 from public.speaking_sessions s where s.id = session_id and s.user_id = (select auth.uid())))
  with check (exists (select 1 from public.speaking_sessions s where s.id = session_id and s.user_id = (select auth.uid())));
create policy speaking_turns_delete_own on public.speaking_turns for delete
  using (exists (select 1 from public.speaking_sessions s where s.id = session_id and s.user_id = (select auth.uid())));

create policy pronunciation_attempts_select on public.pronunciation_attempts for select
  using (user_id = (select auth.uid()) or (select public.current_role()) = 'admin');
create policy pronunciation_attempts_insert_own on public.pronunciation_attempts for insert
  with check (user_id = (select auth.uid()));
create policy pronunciation_attempts_update_own on public.pronunciation_attempts for update
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy pronunciation_attempts_delete_own on public.pronunciation_attempts for delete
  using (user_id = (select auth.uid()));

create policy reviews_select on public.reviews for select
  using (user_id = (select auth.uid()) or (select public.current_role()) = 'admin');
create policy reviews_insert_own on public.reviews for insert
  with check (user_id = (select auth.uid()));
create policy reviews_update_own on public.reviews for update
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy reviews_delete_own on public.reviews for delete
  using (user_id = (select auth.uid()));

create policy self_assessments_select on public.self_assessments for select
  using (user_id = (select auth.uid()) or (select public.current_role()) = 'admin');
create policy self_assessments_insert_own on public.self_assessments for insert
  with check (user_id = (select auth.uid()));
create policy self_assessments_update_own on public.self_assessments for update
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy self_assessments_delete_own on public.self_assessments for delete
  using (user_id = (select auth.uid()));

create policy self_assessment_items_select on public.self_assessment_items for select
  using (
    exists (select 1 from public.self_assessments sa where sa.id = self_assessment_id and sa.user_id = (select auth.uid()))
    or (select public.current_role()) = 'admin'
  );
create policy self_assessment_items_insert_own on public.self_assessment_items for insert
  with check (exists (select 1 from public.self_assessments sa where sa.id = self_assessment_id and sa.user_id = (select auth.uid())));
create policy self_assessment_items_update_own on public.self_assessment_items for update
  using (exists (select 1 from public.self_assessments sa where sa.id = self_assessment_id and sa.user_id = (select auth.uid())))
  with check (exists (select 1 from public.self_assessments sa where sa.id = self_assessment_id and sa.user_id = (select auth.uid())));
create policy self_assessment_items_delete_own on public.self_assessment_items for delete
  using (exists (select 1 from public.self_assessments sa where sa.id = self_assessment_id and sa.user_id = (select auth.uid())));

create policy skill_checkpoints_select on public.skill_checkpoints for select
  using (user_id = (select auth.uid()) or (select public.current_role()) = 'admin');
create policy skill_checkpoints_insert_own on public.skill_checkpoints for insert
  with check (user_id = (select auth.uid()));
create policy skill_checkpoints_update_own on public.skill_checkpoints for update
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy skill_checkpoints_delete_own on public.skill_checkpoints for delete
  using (user_id = (select auth.uid()));

create policy streaks_select on public.streaks for select
  using (user_id = (select auth.uid()) or (select public.current_role()) = 'admin');
create policy streaks_insert_own on public.streaks for insert
  with check (user_id = (select auth.uid()));
create policy streaks_update_own on public.streaks for update
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy streaks_delete_own on public.streaks for delete
  using (user_id = (select auth.uid()));

-- points_ledger: INSERT/UPDATE/DELETE exclusivamente via service_role (bypass RLS).
create policy points_ledger_select on public.points_ledger for select
  using (user_id = (select auth.uid()) or (select public.current_role()) = 'admin');

create policy user_reviews_plan_own on public.user_reviews_plan for all
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy ai_usage_select_admin on public.ai_usage for select
  using ((select public.current_role()) = 'admin');

create policy audit_log_select_admin on public.audit_log for select
  using ((select public.current_role()) = 'admin');

create policy tts_pregen_failures_select_editors on public.tts_pregen_failures for select
  using ((select public.is_content_editor()));
create policy tts_pregen_failures_insert_editors on public.tts_pregen_failures for insert
  with check ((select public.is_content_editor()));
create policy tts_pregen_failures_update_editors on public.tts_pregen_failures for update
  using ((select public.is_content_editor())) with check ((select public.is_content_editor()));
create policy tts_pregen_failures_delete_editors on public.tts_pregen_failures for delete
  using ((select public.is_content_editor()));

-- ============================================================================
-- Índices em FKs hot-path (unindexed_foreign_keys INFO)
-- Skip: FKs `created_by`, `published_by` — auditoria low-traffic; aceito INFO.
-- ============================================================================

create index if not exists speaking_sessions_lesson_version_idx on public.speaking_sessions (lesson_version_id);
create index if not exists pronunciation_attempts_lesson_version_idx on public.pronunciation_attempts (lesson_version_id);
create index if not exists pronunciation_attempts_exercise_idx on public.pronunciation_attempts (exercise_id);
create index if not exists pronunciation_attempts_target_idx on public.pronunciation_attempts (pronunciation_target_id);
create index if not exists reviews_origin_lesson_version_idx on public.reviews (origin_lesson_version_id);
create index if not exists unit_objectives_linked_lesson_idx on public.unit_objectives (linked_lesson_id);
create index if not exists learning_path_current_unit_idx on public.learning_path_progress (current_unit_id);
create index if not exists learning_path_current_lesson_idx on public.learning_path_progress (current_lesson_id);
create index if not exists unit_progress_unit_version_idx on public.unit_progress (unit_version_id);
create index if not exists lesson_progress_lesson_version_idx on public.lesson_progress (lesson_version_id);
create index if not exists lesson_progress_unit_version_idx on public.lesson_progress (unit_version_id);
create index if not exists exercise_attempts_exercise_idx on public.exercise_attempts (exercise_id);
create index if not exists self_assessments_unit_idx on public.self_assessments (unit_id);
create index if not exists self_assessments_unit_version_idx on public.self_assessments (unit_version_id);
create index if not exists self_assessment_items_objective_idx on public.self_assessment_items (unit_objective_id);
create index if not exists lesson_progress_lesson_idx on public.lesson_progress (lesson_id);
create index if not exists unit_progress_unit_idx on public.unit_progress (unit_id);
