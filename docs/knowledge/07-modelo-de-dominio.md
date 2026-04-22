---
name: Modelo de Domínio
description: Entidades, relações e schema SQL — conteúdo, progresso, IA, pronúncia, revisão
---

# 07 — Modelo de Domínio

Modelagem relacional em Postgres (Supabase). Três grandes blocos:

1. **Conteúdo pedagógico** — `units`, `lessons`, `lesson_sections`, `exercises`, `vocabulary_items`, `phrase_patterns`, `grammar_points`, + tabelas `*_versions`.
2. **Aluno e progresso** — `profiles`, `learning_path_progress`, `unit_progress`, `lesson_progress`, `exercise_attempts`, `speaking_sessions`, `pronunciation_attempts`, `reviews`, `self_assessments`, `skill_checkpoints`.
3. **Suporte** — `audit_log`, `ai_usage`, `events` (se não for inteiramente externo).

## Diagrama conceitual (texto)

```
profiles 1—N learning_path_progress
profiles 1—N unit_progress —N— units (via unit_version_id)
profiles 1—N lesson_progress —N— lessons (via lesson_version_id)
profiles 1—N exercise_attempts —N— exercises (via exercise_version_id)
profiles 1—N reviews —N— [vocabulary_items | phrase_patterns | grammar_points] (polymorphic)
profiles 1—N speaking_sessions 1—N speaking_turns
profiles 1—N pronunciation_attempts
profiles 1—N self_assessments —N— unit_objectives

units 1—N unit_objectives
units 1—N lessons
lessons 1—N lesson_sections
lesson_sections 1—N exercises
lessons 1—N lesson_versions (snapshots)
lessons M—N vocabulary_items (lesson_vocabulary)
lessons M—N phrase_patterns (lesson_phrases)
lessons M—N grammar_points (lesson_grammar)
```

## Enums

```sql
create type user_role as enum ('student', 'author', 'reviewer', 'admin');
create type cefr_level as enum ('a0', 'a1', 'a2', 'b1', 'b2', 'c1', 'c2');
create type content_status as enum ('draft', 'review', 'published', 'archived');
create type lesson_section_kind as enum (
  'intro', 'verbs', 'new_words', 'handy_phrases', 'grammar',
  'in_context', 'drill', 'speak_now', 'pair_practice',
  'listen_and_act', 'fluency', 'pronunciation', 'recap', 'self_check'
);
create type exercise_type as enum (
  'shadow_repeat', 'multiple_choice', 'fill_blank', 'word_order',
  'match_word_image', 'match_en_pt', 'short_answer', 'build_sentence',
  'role_play', 'shadowing', 'pronunciation', 'review_quiz', 'listen_and_number'
);
create type review_stage as enum ('d1', 'd3', 'd7', 'd14', 'd30', 'mastered');
create type confidence as enum ('i_can', 'not_sure', 'cant_yet');
```

## 1. Conteúdo pedagógico

### `units`
```sql
create table units (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  order_index int not null,
  title_en text not null,
  title_pt_br text not null,
  theme text,
  level cefr_level not null default 'a1',
  status content_status not null default 'draft',
  published_version_id uuid, -- FK to unit_versions
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table unit_objectives (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references units(id) on delete cascade,
  order_index int not null,
  i_can_pt_br text not null,
  linked_lesson_id uuid -- FK (optional) lesson that originated the objective
);

create table unit_versions (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references units(id),
  version int not null,
  snapshot jsonb not null, -- entire unit + lessons as of publication
  published_at timestamptz not null default now(),
  unique (unit_id, version)
);
```

### `lessons`
```sql
create table lessons (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references units(id) on delete cascade,
  slug text not null,
  order_index int not null,
  title_en text not null,
  title_pt_br text not null,
  estimated_minutes int not null default 12,
  status content_status not null default 'draft',
  published_version_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (unit_id, slug)
);

create table lesson_versions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons(id),
  version int not null,
  snapshot jsonb not null, -- includes sections + exercises + linked content
  published_at timestamptz not null default now(),
  unique (lesson_id, version)
);

create table lesson_sections (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons(id) on delete cascade,
  order_index int not null,
  kind lesson_section_kind not null,
  title text,
  payload jsonb not null, -- dialog, vocab refs, grammar text, etc.
  required boolean not null default true
);
```

### Itens lexicais
```sql
create table vocabulary_items (
  id uuid primary key default gen_random_uuid(),
  en text not null,
  pt_br text not null,
  part_of_speech text,
  example_en text,
  example_pt_br text,
  audio_key text, -- storage key
  level cefr_level not null default 'a1',
  tags text[] default '{}',
  status content_status not null default 'draft',
  created_at timestamptz not null default now()
);

create table phrase_patterns (
  id uuid primary key default gen_random_uuid(),
  en text not null,
  pt_br text not null,
  function text, -- 'greeting', 'ordering', 'apologizing', ...
  audio_key text,
  level cefr_level not null default 'a1',
  status content_status not null default 'draft'
);

create table grammar_points (
  id uuid primary key default gen_random_uuid(),
  title_pt_br text not null,
  title_en text,
  explanation_pt_br text not null,
  explanation_en text,
  rule_pattern text, -- abstract: "Subject + am/is/are + adjective"
  examples jsonb not null, -- [{en, pt_br}]
  level cefr_level not null default 'a1',
  status content_status not null default 'draft'
);

-- M:N join tables (qual conteúdo aparece em cada lesson)
create table lesson_vocabulary (
  lesson_id uuid references lessons(id) on delete cascade,
  vocabulary_item_id uuid references vocabulary_items(id) on delete cascade,
  order_index int,
  primary key (lesson_id, vocabulary_item_id)
);

create table lesson_phrases (
  lesson_id uuid references lessons(id) on delete cascade,
  phrase_pattern_id uuid references phrase_patterns(id) on delete cascade,
  order_index int,
  primary key (lesson_id, phrase_pattern_id)
);

create table lesson_grammar (
  lesson_id uuid references lessons(id) on delete cascade,
  grammar_point_id uuid references grammar_points(id) on delete cascade,
  order_index int,
  primary key (lesson_id, grammar_point_id)
);
```

### `exercises`
```sql
create table exercises (
  id uuid primary key default gen_random_uuid(),
  lesson_section_id uuid not null references lesson_sections(id) on delete cascade,
  type exercise_type not null,
  order_index int not null,
  prompt_pt_br text,
  prompt_en text,
  payload jsonb not null, -- options, words, scenario, target_phrase, ...
  expected jsonb not null, -- expected answer(s), tolerances
  scoring jsonb not null default '{"method":"standard"}'::jsonb
);
```

## 2. Aluno e progresso

### `profiles`
```sql
-- Extends auth.users
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role user_role not null default 'student',
  cefr_level cefr_level not null default 'a0',
  locale text not null default 'pt-BR',
  timezone text not null default 'America/Sao_Paulo',
  streak_current int not null default 0,
  streak_longest int not null default 0,
  streak_last_active_date date,
  points_total int not null default 0,
  weekly_goal_minutes int not null default 60,
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### Progresso
```sql
create table learning_path_progress (
  user_id uuid primary key references profiles(id) on delete cascade,
  current_unit_id uuid references units(id),
  current_lesson_id uuid references lessons(id),
  updated_at timestamptz not null default now()
);

create table unit_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  unit_version_id uuid not null references unit_versions(id),
  status text not null default 'in_progress', -- in_progress | completed
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, unit_version_id)
);

create table lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  lesson_version_id uuid not null references lesson_versions(id),
  unit_version_id uuid not null references unit_versions(id),
  status text not null default 'in_progress', -- in_progress | completed | skipped
  current_section lesson_section_kind,
  sections_completed lesson_section_kind[] default '{}',
  avg_grade numeric(3,2),
  total_time_ms bigint not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, lesson_version_id)
);
```

### `exercise_attempts`
```sql
create table exercise_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  exercise_id uuid not null references exercises(id), -- (via lesson_version snapshot; reference kept for lookup)
  lesson_version_id uuid not null references lesson_versions(id),
  attempt_number int not null default 1,
  grade int check (grade between 0 and 5),
  response jsonb not null,
  is_correct boolean,
  time_ms int,
  created_at timestamptz not null default now()
);

create index on exercise_attempts (user_id, created_at desc);
```

### Speaking
```sql
create table speaking_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  mode text not null check (mode in ('short_answer','open_conversation','role_play','fluency','lesson_pair')),
  lesson_version_id uuid references lesson_versions(id),
  scenario jsonb, -- {description, user_role, ai_role, initial_turn}
  level cefr_level not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  feedback_summary jsonb
);

create table speaking_turns (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references speaking_sessions(id) on delete cascade,
  turn_index int not null,
  speaker text not null check (speaker in ('user','ai')),
  text_en text,
  text_original text, -- if user spoke pt-BR or mixed
  audio_key text,
  correction jsonb, -- {suggested_en, explanation_pt_br, severity}
  tokens_in int,
  tokens_out int,
  cache_hit boolean,
  latency_ms int,
  created_at timestamptz not null default now()
);
```

### Pronúncia
```sql
create table pronunciation_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  expected text not null,
  transcribed text,
  score int check (score between 0 and 100),
  wer numeric(5,2),
  problem_words jsonb, -- [{word, position, kind: 'substitution'|'deletion'}]
  audio_key text,
  lesson_version_id uuid references lesson_versions(id),
  exercise_id uuid references exercises(id),
  created_at timestamptz not null default now()
);
```

### Revisão espaçada
```sql
create table reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  item_type text not null check (item_type in ('vocab','phrase','grammar','chunk')),
  item_id uuid not null,
  stage review_stage not null default 'd1',
  interval_days int not null default 1,
  ease_factor numeric(3,2) not null default 2.5,
  due_at timestamptz not null,
  last_grade int,
  last_reviewed_at timestamptz,
  consecutive_passes int not null default 0,
  origin_lesson_version_id uuid references lesson_versions(id),
  created_at timestamptz not null default now(),
  unique (user_id, item_type, item_id)
);

create index on reviews (user_id, due_at);
```

### Self-assessment e checkpoints
```sql
create table self_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  unit_version_id uuid not null references unit_versions(id),
  submitted_at timestamptz not null default now(),
  unique (user_id, unit_version_id)
);

create table self_assessment_items (
  id uuid primary key default gen_random_uuid(),
  self_assessment_id uuid not null references self_assessments(id) on delete cascade,
  unit_objective_id uuid not null references unit_objectives(id),
  confidence confidence not null,
  note text
);

create table skill_checkpoints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  skill text not null, -- 'greetings', 'ordering-food', ...
  level cefr_level not null,
  achieved_at timestamptz not null default now(),
  evidence jsonb, -- what counts (lessons completed, scores)
  unique (user_id, skill)
);
```

## 3. Suporte

### `ai_usage`
```sql
create table ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  purpose text not null, -- 'tutor','speaking','corrector','recommender','tts','stt'
  provider text not null,
  model text not null,
  tokens_in int not null default 0,
  tokens_out int not null default 0,
  cache_hit boolean,
  cost_cents numeric(10,4),
  created_at timestamptz not null default now()
);

create index on ai_usage (user_id, created_at desc);
create index on ai_usage (created_at desc);
```

### `audit_log`
```sql
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id),
  action text not null, -- 'content.publish','admin.read_user_progress',...
  target_table text,
  target_id uuid,
  diff jsonb,
  created_at timestamptz not null default now()
);
```

## Índices adicionais
- `lesson_progress (user_id, unit_version_id)`
- `reviews (user_id, stage, due_at)`
- `exercise_attempts (user_id, lesson_version_id)`

## RLS (resumo)
- Toda tabela com RLS habilitado.
- Conteúdo `published` → SELECT por qualquer `authenticated`.
- Dados do aluno → `user_id = auth.uid()`.
- `admin` / `reviewer` com policies específicas + `audit_log`.

Detalhes em [ADR-003](../adr/003-rls-e-autorizacao.md).

## Geração de tipos TypeScript
`supabase gen types typescript --project-id ucbbhymgflujbtcopaeb > types/database.ts` (ou local quando em dev).

## Referências
- [ADR-002](../adr/002-backend-supabase.md)
- [ADR-003](../adr/003-rls-e-autorizacao.md)
- [ADR-006](../adr/006-spaced-repetition.md)
- [ADR-008](../adr/008-conteudo-e-versionamento.md)
