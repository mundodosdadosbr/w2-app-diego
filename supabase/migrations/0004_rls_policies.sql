-- 0004_rls_policies.sql
-- Row-Level Security em todas as tabelas public.*.
-- Padrões:
--   - Conteúdo published: SELECT por authenticated; INSERT/UPDATE/DELETE por author/reviewer/admin.
--   - Dados do aluno: user_id = auth.uid(); admin/reviewer SELECT com audit (policy separada).
--   - Observabilidade: INSERT via service_role em Edge Functions; SELECT só admin.
-- Refs: docs/adr/003-rls-e-autorizacao.md, docs/knowledge/07-modelo-de-dominio.md.

-- ============================================================================
-- Helper functions usadas por todas as policies
-- ============================================================================

-- Retorna o role do usuário autenticado. SECURITY DEFINER para não entrar em
-- recursão com as policies de profiles que também usam este helper.
create or replace function public.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

comment on function public.current_role is
  'Retorna role do auth.uid() a partir de profiles. SECURITY DEFINER para evitar recursão com policies.';

-- ============================================================================
-- profiles
-- ============================================================================

alter table public.profiles enable row level security;

create policy profiles_select_own on public.profiles
  for select using (id = auth.uid());

create policy profiles_select_admin on public.profiles
  for select using (public.current_role() in ('admin', 'reviewer'));

create policy profiles_update_own on public.profiles
  for update using (id = auth.uid())
  with check (
    id = auth.uid()
    -- aluno NÃO pode mudar o próprio role. Só admin pode (via RPC específica).
    and role = (select role from public.profiles where id = auth.uid())
  );

create policy profiles_update_admin on public.profiles
  for update using (public.current_role() = 'admin');

-- INSERT de profiles é feito exclusivamente pelo trigger on_auth_user_created (security definer).
-- Nenhuma policy permite INSERT direto por usuários.

create policy profiles_delete_admin on public.profiles
  for delete using (public.current_role() = 'admin');

-- ============================================================================
-- Conteúdo pedagógico — padrão de policies
-- ============================================================================

-- Função helper privada: é editor de conteúdo?
create or replace function public.is_content_editor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role() in ('author', 'reviewer', 'admin');
$$;

-- ---------- units ----------

alter table public.units enable row level security;

create policy units_select_published on public.units
  for select using (status = 'published' and auth.uid() is not null);

create policy units_select_editors on public.units
  for select using (public.is_content_editor());

create policy units_modify_editors on public.units
  for all using (public.is_content_editor())
  with check (public.is_content_editor());

-- ---------- unit_objectives ----------

alter table public.unit_objectives enable row level security;

create policy unit_objectives_select_published on public.unit_objectives
  for select using (
    exists (select 1 from public.units u where u.id = unit_id and u.status = 'published')
    and auth.uid() is not null
  );

create policy unit_objectives_select_editors on public.unit_objectives
  for select using (public.is_content_editor());

create policy unit_objectives_modify_editors on public.unit_objectives
  for all using (public.is_content_editor())
  with check (public.is_content_editor());

-- ---------- unit_versions (imutáveis) ----------

alter table public.unit_versions enable row level security;

-- Qualquer authenticated pode ler snapshots (necessário para aluno em progresso).
create policy unit_versions_select_all on public.unit_versions
  for select using (auth.uid() is not null);

-- Apenas admin/reviewer podem inserir (via função publish_* security definer).
create policy unit_versions_insert_editors on public.unit_versions
  for insert with check (public.is_content_editor());

-- ---------- lessons ----------

alter table public.lessons enable row level security;

create policy lessons_select_published on public.lessons
  for select using (status = 'published' and auth.uid() is not null);

create policy lessons_select_editors on public.lessons
  for select using (public.is_content_editor());

create policy lessons_modify_editors on public.lessons
  for all using (public.is_content_editor())
  with check (public.is_content_editor());

-- ---------- lesson_versions ----------

alter table public.lesson_versions enable row level security;

create policy lesson_versions_select_all on public.lesson_versions
  for select using (auth.uid() is not null);

create policy lesson_versions_insert_editors on public.lesson_versions
  for insert with check (public.is_content_editor());

create policy lesson_versions_update_editors on public.lesson_versions
  for update using (public.is_content_editor())
  with check (public.is_content_editor());

-- ---------- lesson_sections, dialog_lines, exercises, pronunciation_targets ----------
-- Usam status da lesson pai para visibilidade.

alter table public.lesson_sections enable row level security;

create policy lesson_sections_select_published on public.lesson_sections
  for select using (
    exists (select 1 from public.lessons l where l.id = lesson_id and l.status = 'published')
    and auth.uid() is not null
  );

create policy lesson_sections_select_editors on public.lesson_sections
  for select using (public.is_content_editor());

create policy lesson_sections_modify_editors on public.lesson_sections
  for all using (public.is_content_editor())
  with check (public.is_content_editor());

alter table public.dialog_lines enable row level security;

create policy dialog_lines_select_published on public.dialog_lines
  for select using (
    exists (select 1 from public.lessons l where l.id = lesson_id and l.status = 'published')
    and auth.uid() is not null
  );

create policy dialog_lines_select_editors on public.dialog_lines
  for select using (public.is_content_editor());

create policy dialog_lines_modify_editors on public.dialog_lines
  for all using (public.is_content_editor())
  with check (public.is_content_editor());

alter table public.exercises enable row level security;

create policy exercises_select_published on public.exercises
  for select using (
    exists (
      select 1 from public.lesson_sections s
      join public.lessons l on l.id = s.lesson_id
      where s.id = lesson_section_id and l.status = 'published'
    )
    and auth.uid() is not null
  );

create policy exercises_select_editors on public.exercises
  for select using (public.is_content_editor());

create policy exercises_modify_editors on public.exercises
  for all using (public.is_content_editor())
  with check (public.is_content_editor());

alter table public.pronunciation_targets enable row level security;

create policy pronunciation_targets_select_published on public.pronunciation_targets
  for select using (
    exists (select 1 from public.lessons l where l.id = lesson_id and l.status = 'published')
    and auth.uid() is not null
  );

create policy pronunciation_targets_select_editors on public.pronunciation_targets
  for select using (public.is_content_editor());

create policy pronunciation_targets_modify_editors on public.pronunciation_targets
  for all using (public.is_content_editor())
  with check (public.is_content_editor());

-- ---------- Itens lexicais reutilizáveis ----------

alter table public.vocabulary_items enable row level security;

create policy vocabulary_items_select_published on public.vocabulary_items
  for select using (status = 'published' and auth.uid() is not null);

create policy vocabulary_items_select_editors on public.vocabulary_items
  for select using (public.is_content_editor());

create policy vocabulary_items_modify_editors on public.vocabulary_items
  for all using (public.is_content_editor())
  with check (public.is_content_editor());

alter table public.phrase_patterns enable row level security;

create policy phrase_patterns_select_published on public.phrase_patterns
  for select using (status = 'published' and auth.uid() is not null);

create policy phrase_patterns_select_editors on public.phrase_patterns
  for select using (public.is_content_editor());

create policy phrase_patterns_modify_editors on public.phrase_patterns
  for all using (public.is_content_editor())
  with check (public.is_content_editor());

alter table public.grammar_points enable row level security;

create policy grammar_points_select_published on public.grammar_points
  for select using (status = 'published' and auth.uid() is not null);

create policy grammar_points_select_editors on public.grammar_points
  for select using (public.is_content_editor());

create policy grammar_points_modify_editors on public.grammar_points
  for all using (public.is_content_editor())
  with check (public.is_content_editor());

-- ---------- Joins M:N ----------

alter table public.lesson_vocabulary enable row level security;

create policy lesson_vocabulary_select on public.lesson_vocabulary
  for select using (
    auth.uid() is not null and (
      exists (select 1 from public.lessons l where l.id = lesson_id and l.status = 'published')
      or public.is_content_editor()
    )
  );

create policy lesson_vocabulary_modify_editors on public.lesson_vocabulary
  for all using (public.is_content_editor())
  with check (public.is_content_editor());

alter table public.lesson_phrases enable row level security;

create policy lesson_phrases_select on public.lesson_phrases
  for select using (
    auth.uid() is not null and (
      exists (select 1 from public.lessons l where l.id = lesson_id and l.status = 'published')
      or public.is_content_editor()
    )
  );

create policy lesson_phrases_modify_editors on public.lesson_phrases
  for all using (public.is_content_editor())
  with check (public.is_content_editor());

alter table public.lesson_grammar enable row level security;

create policy lesson_grammar_select on public.lesson_grammar
  for select using (
    auth.uid() is not null and (
      exists (select 1 from public.lessons l where l.id = lesson_id and l.status = 'published')
      or public.is_content_editor()
    )
  );

create policy lesson_grammar_modify_editors on public.lesson_grammar
  for all using (public.is_content_editor())
  with check (public.is_content_editor());

-- ============================================================================
-- Dados do aluno — padrão user_id = auth.uid()
-- ============================================================================

alter table public.learning_path_progress enable row level security;

create policy learning_path_progress_own on public.learning_path_progress
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table public.unit_progress enable row level security;

create policy unit_progress_own on public.unit_progress
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy unit_progress_admin_select on public.unit_progress
  for select using (public.current_role() = 'admin');

alter table public.lesson_progress enable row level security;

create policy lesson_progress_own on public.lesson_progress
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy lesson_progress_admin_select on public.lesson_progress
  for select using (public.current_role() = 'admin');

alter table public.exercise_attempts enable row level security;

create policy exercise_attempts_own on public.exercise_attempts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy exercise_attempts_admin_select on public.exercise_attempts
  for select using (public.current_role() = 'admin');

alter table public.speaking_sessions enable row level security;

create policy speaking_sessions_own on public.speaking_sessions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy speaking_sessions_admin_select on public.speaking_sessions
  for select using (public.current_role() = 'admin');

alter table public.speaking_turns enable row level security;

create policy speaking_turns_own on public.speaking_turns
  for all using (
    exists (
      select 1 from public.speaking_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.speaking_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

create policy speaking_turns_admin_select on public.speaking_turns
  for select using (public.current_role() = 'admin');

alter table public.pronunciation_attempts enable row level security;

create policy pronunciation_attempts_own on public.pronunciation_attempts
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy pronunciation_attempts_admin_select on public.pronunciation_attempts
  for select using (public.current_role() = 'admin');

alter table public.reviews enable row level security;

create policy reviews_own on public.reviews
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy reviews_admin_select on public.reviews
  for select using (public.current_role() = 'admin');

alter table public.self_assessments enable row level security;

create policy self_assessments_own on public.self_assessments
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy self_assessments_admin_select on public.self_assessments
  for select using (public.current_role() = 'admin');

alter table public.self_assessment_items enable row level security;

create policy self_assessment_items_own on public.self_assessment_items
  for all using (
    exists (
      select 1 from public.self_assessments sa
      where sa.id = self_assessment_id and sa.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.self_assessments sa
      where sa.id = self_assessment_id and sa.user_id = auth.uid()
    )
  );

create policy self_assessment_items_admin_select on public.self_assessment_items
  for select using (public.current_role() = 'admin');

alter table public.skill_checkpoints enable row level security;

create policy skill_checkpoints_own on public.skill_checkpoints
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy skill_checkpoints_admin_select on public.skill_checkpoints
  for select using (public.current_role() = 'admin');

alter table public.streaks enable row level security;

create policy streaks_own on public.streaks
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy streaks_admin_select on public.streaks
  for select using (public.current_role() = 'admin');

alter table public.points_ledger enable row level security;

create policy points_ledger_own_select on public.points_ledger
  for select using (user_id = auth.uid());

-- INSERT só via função security definer; nenhuma policy permite INSERT direto.

create policy points_ledger_admin_select on public.points_ledger
  for select using (public.current_role() = 'admin');

alter table public.user_reviews_plan enable row level security;

create policy user_reviews_plan_own on public.user_reviews_plan
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================================
-- Observabilidade — só admin SELECT; INSERT via service_role
-- ============================================================================

alter table public.ai_usage enable row level security;

create policy ai_usage_admin_select on public.ai_usage
  for select using (public.current_role() = 'admin');

-- INSERT: Edge Functions com service_role (bypass RLS). Nenhuma policy user-level.

alter table public.audit_log enable row level security;

create policy audit_log_admin_select on public.audit_log
  for select using (public.current_role() = 'admin');

-- INSERT via service_role.

alter table public.tts_pregen_failures enable row level security;

create policy tts_pregen_failures_editors on public.tts_pregen_failures
  for all using (public.is_content_editor())
  with check (public.is_content_editor());

-- ============================================================================
-- Comentários guarda-cintura para DBAs
-- ============================================================================

comment on function public.current_role is
  'SECURITY DEFINER. Retorna role do auth.uid(). Essencial em todas as policies de editor.';

comment on function public.is_content_editor is
  'SECURITY DEFINER. true se role in (author, reviewer, admin). Usado em policies de conteúdo.';
