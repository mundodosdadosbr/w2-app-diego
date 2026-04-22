-- 0003_user_schema.sql
-- Schema do aluno: profiles, progresso, tentativas, speaking, pronúncia,
-- revisões, self-assessment, skills, gamificação, observabilidade.
-- Refs: docs/knowledge/07-modelo-de-dominio.md, docs/knowledge/08-regras-de-negocio.md,
--       docs/knowledge/09-gamificacao-e-progresso.md, docs/adr/006-spaced-repetition.md.

-- ============================================================================
-- profiles (extends auth.users 1:1)
-- ============================================================================

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role public.user_role not null default 'student',
  cefr_level public.cefr_level not null default 'a0',
  locale text not null default 'pt-BR',
  timezone text not null default 'America/Sao_Paulo',
  weekly_goal_minutes int not null default 60 check (weekly_goal_minutes between 0 and 600),
  points_total int not null default 0,
  keep_recordings_indefinitely boolean not null default false,
  microphone_denied boolean not null default false,
  analytics_opted_in boolean not null default true,
  email_marketing_opted_in boolean not null default false,
  terms_accepted_at timestamptz,
  privacy_accepted_at timestamptz,
  onboarded_at timestamptz,
  deletion_requested_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Perfil 1:1 com auth.users. Trigger on_auth_user_created criado em 0005.';
comment on column public.profiles.keep_recordings_indefinitely is 'Opt-in do aluno para não purgar áudios em 90 dias. Ver UC-10, knowledge/08.';
comment on column public.profiles.deletion_requested_at is 'Se preenchido, conta agendada para exclusão. Efetivação em 7 dias.';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function extensions.moddatetime(updated_at);

-- ============================================================================
-- learning_path_progress (singleton por aluno)
-- ============================================================================

create table public.learning_path_progress (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  current_unit_id uuid references public.units(id) on delete set null,
  current_lesson_id uuid references public.lessons(id) on delete set null,
  open_mode boolean not null default false,
  updated_at timestamptz not null default now()
);

comment on table public.learning_path_progress is 'Posição atual do aluno na trilha. open_mode=true libera units fora de ordem. Ver knowledge/08.';

create trigger learning_path_set_updated_at
  before update on public.learning_path_progress
  for each row execute function extensions.moddatetime(updated_at);

-- ============================================================================
-- unit_progress e lesson_progress
-- ============================================================================

create table public.unit_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  unit_id uuid not null references public.units(id) on delete restrict,
  unit_version_id uuid not null references public.unit_versions(id) on delete restrict,
  status public.progress_status not null default 'in_progress',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, unit_version_id)
);

comment on table public.unit_progress is 'Progresso do aluno por unit_version. version_id imutável garante não quebrar ao republicar.';

create index unit_progress_user_idx on public.unit_progress (user_id);

create table public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete restrict,
  lesson_version_id uuid not null references public.lesson_versions(id) on delete restrict,
  unit_version_id uuid not null references public.unit_versions(id) on delete restrict,
  status public.progress_status not null default 'in_progress',
  current_section public.lesson_section_kind,
  sections_completed public.lesson_section_kind[] not null default '{}',
  avg_grade numeric(3,2),
  total_time_ms bigint not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, lesson_version_id)
);

comment on table public.lesson_progress is 'Progresso por lesson_version. avg_grade agregado dos exercícios de OUTPUT. Ver UC-02, knowledge/08.';

create index lesson_progress_user_idx on public.lesson_progress (user_id);
create index lesson_progress_completed_idx on public.lesson_progress (user_id, completed_at desc);

-- ============================================================================
-- exercise_attempts
-- ============================================================================

create table public.exercise_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  lesson_version_id uuid not null references public.lesson_versions(id) on delete restrict,
  attempt_number int not null default 1 check (attempt_number >= 1),
  grade smallint not null check (grade between 0 and 5),
  response jsonb not null default '{}'::jsonb,
  is_correct boolean,
  time_ms int,
  created_at timestamptz not null default now()
);

comment on table public.exercise_attempts is 'Toda tentativa de exercício. grade 0-5 alimenta SRS. Ver UC-02, ADR-006.';

create index exercise_attempts_user_created_idx on public.exercise_attempts (user_id, created_at desc);
create index exercise_attempts_user_exercise_idx on public.exercise_attempts (user_id, exercise_id);
create index exercise_attempts_lesson_version_idx on public.exercise_attempts (lesson_version_id);

-- ============================================================================
-- speaking_sessions e speaking_turns
-- ============================================================================

create table public.speaking_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  mode public.speaking_mode not null,
  lesson_version_id uuid references public.lesson_versions(id) on delete set null,
  scenario jsonb,
  level public.cefr_level not null,
  turn_count int not null default 0,
  avg_user_words numeric(5,2),
  feedback_summary jsonb,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

comment on table public.speaking_sessions is 'Sessão de conversa com tutor IA. Ver UC-04, knowledge/10.';
comment on column public.speaking_sessions.scenario is 'JSON: {description, user_role, ai_role, initial_turn}. Usado em role_play.';

create index speaking_sessions_user_idx on public.speaking_sessions (user_id, started_at desc);

create table public.speaking_turns (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.speaking_sessions(id) on delete cascade,
  turn_index int not null,
  speaker text not null check (speaker in ('user', 'ai')),
  text_en text,
  text_original text,
  audio_key text,
  correction jsonb,
  tokens_in int,
  tokens_out int,
  cache_hit boolean,
  latency_ms int,
  created_at timestamptz not null default now(),
  unique (session_id, turn_index)
);

comment on table public.speaking_turns is 'Turno individual de speaking. correction: {suggested_en, explanation_pt_br, severity}.';

create index speaking_turns_session_idx on public.speaking_turns (session_id, turn_index);

-- ============================================================================
-- pronunciation_attempts
-- ============================================================================

create table public.pronunciation_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  expected text not null,
  transcribed text,
  words jsonb,
  score smallint check (score between 0 and 100),
  wer numeric(5,2),
  avg_confidence numeric(4,3),
  problem_words jsonb,
  audio_key text,
  low_audio_quality boolean not null default false,
  lesson_version_id uuid references public.lesson_versions(id) on delete set null,
  exercise_id uuid references public.exercises(id) on delete set null,
  pronunciation_target_id uuid references public.pronunciation_targets(id) on delete set null,
  retry_number int not null default 1,
  created_at timestamptz not null default now()
);

comment on table public.pronunciation_attempts is 'Tentativa de pronúncia com scoring. Ver UC-03, ADR-007, ADR-016.';
comment on column public.pronunciation_attempts.words is 'JSON array [{token, start, end, confidence}] do Amazon Transcribe.';
comment on column public.pronunciation_attempts.problem_words is 'JSON array [{word, position, kind: substitution|deletion|low_confidence}].';
comment on column public.pronunciation_attempts.audio_key is 'Chave em s3://w2-recordings (AWS) — purgada em 90d salvo opt-in. Ver UC-10.';

create index pronunciation_attempts_user_idx on public.pronunciation_attempts (user_id, created_at desc);

-- ============================================================================
-- reviews (SRS)
-- ============================================================================

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_type public.review_item_type not null,
  item_id uuid not null,
  stage public.review_stage not null default 'd1',
  interval_days int not null default 1 check (interval_days >= 0),
  ease_factor numeric(3,2) not null default 2.50 check (ease_factor between 1.30 and 3.00),
  due_at timestamptz not null,
  last_grade smallint check (last_grade between 0 and 5),
  last_reviewed_at timestamptz,
  consecutive_passes int not null default 0,
  origin_lesson_version_id uuid references public.lesson_versions(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, item_type, item_id)
);

comment on table public.reviews is 'Fila de revisão espaçada (SM-2 simplificado). Ver ADR-006, knowledge/12.';

create index reviews_due_idx on public.reviews (user_id, due_at) where stage <> 'mastered';
create index reviews_user_stage_idx on public.reviews (user_id, stage);

-- ============================================================================
-- self_assessments e items
-- ============================================================================

create table public.self_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  unit_id uuid not null references public.units(id) on delete restrict,
  unit_version_id uuid not null references public.unit_versions(id) on delete restrict,
  submitted_at timestamptz not null default now(),
  unique (user_id, unit_version_id)
);

comment on table public.self_assessments is 'Autoavaliação por unit. Ver UC-06, knowledge/03.';

create table public.self_assessment_items (
  id uuid primary key default gen_random_uuid(),
  self_assessment_id uuid not null references public.self_assessments(id) on delete cascade,
  unit_objective_id uuid not null references public.unit_objectives(id) on delete restrict,
  confidence public.confidence_level not null,
  note text,
  unique (self_assessment_id, unit_objective_id)
);

-- ============================================================================
-- skill_checkpoints
-- ============================================================================

create table public.skill_checkpoints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  skill text not null,
  level public.cefr_level not null,
  evidence jsonb,
  achieved_at timestamptz not null default now(),
  unique (user_id, skill)
);

comment on table public.skill_checkpoints is 'Competências comunicativas destravadas. Eixo primário de progresso. Ver knowledge/09.';

create index skill_checkpoints_user_idx on public.skill_checkpoints (user_id);

-- ============================================================================
-- streaks e points_ledger
-- ============================================================================

create table public.streaks (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  current_count int not null default 0 check (current_count >= 0),
  longest_count int not null default 0 check (longest_count >= 0),
  last_active_date date,
  freeze_tokens int not null default 0 check (freeze_tokens between 0 and 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.streaks is 'Streak do aluno. freeze_tokens: 1 ganho a cada 14 dias de streak. Ver knowledge/09.';

create trigger streaks_set_updated_at
  before update on public.streaks
  for each row execute function extensions.moddatetime(updated_at);

create table public.points_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount int not null,
  reason text not null,
  ref_type text,
  ref_id uuid,
  created_at timestamptz not null default now()
);

comment on table public.points_ledger is 'Log auditável de pontos. amount pode ser negativo em correções, nunca como punição. Ver knowledge/08.';

create index points_ledger_user_idx on public.points_ledger (user_id, created_at desc);

-- ============================================================================
-- user_reviews_plan (cache do recommender)
-- ============================================================================

create table public.user_reviews_plan (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  plan jsonb not null,
  message_pt_br text,
  generated_at timestamptz not null default now(),
  expires_at timestamptz not null
);

comment on table public.user_reviews_plan is 'Cache curto (TTL 7d) do plano gerado pela persona recommender. Ver UC-06, knowledge/10.';

-- ============================================================================
-- ai_usage (observabilidade de custos)
-- ============================================================================

create table public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  purpose text not null,
  provider text not null,
  model text not null,
  tokens_in int not null default 0,
  tokens_out int not null default 0,
  cache_hit boolean,
  cost_cents numeric(10,4),
  latency_ms int,
  metadata jsonb,
  created_at timestamptz not null default now()
);

comment on table public.ai_usage is 'Uso de APIs de IA (Bedrock, Transcribe, ElevenLabs). Base para dashboard de custo. Ver ADR-012.';

create index ai_usage_user_created_idx on public.ai_usage (user_id, created_at desc);
create index ai_usage_created_idx on public.ai_usage (created_at desc);
create index ai_usage_provider_idx on public.ai_usage (provider, created_at desc);

-- ============================================================================
-- audit_log
-- ============================================================================

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_table text,
  target_id uuid,
  diff jsonb,
  metadata jsonb,
  created_at timestamptz not null default now()
);

comment on table public.audit_log is 'Trilha de auditoria: publicação, leitura admin de dados de aluno, mudança de role, purges. Ver ADR-003, ADR-012.';

create index audit_log_actor_idx on public.audit_log (actor_id, created_at desc);
create index audit_log_action_idx on public.audit_log (action, created_at desc);

-- ============================================================================
-- tts_pregen_failures (UC-09 AF-5)
-- ============================================================================

create table public.tts_pregen_failures (
  id uuid primary key default gen_random_uuid(),
  lesson_version_id uuid not null references public.lesson_versions(id) on delete cascade,
  text_hash text not null,
  text_sample text not null,
  voice text,
  attempt_number int not null default 1,
  last_error text,
  last_attempt_at timestamptz not null default now(),
  resolved_at timestamptz
);

comment on table public.tts_pregen_failures is 'Items de TTS que falharam após 5 tentativas. Triagem manual. Ver UC-09.';

create index tts_pregen_failures_unresolved_idx on public.tts_pregen_failures (lesson_version_id) where resolved_at is null;
