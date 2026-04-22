-- 0002_content_schema.sql
-- Schema de conteúdo pedagógico: units, lessons, seções, vocabulário, frases,
-- gramática, diálogos, exercícios + versioning imutável.
-- Refs: docs/knowledge/07-modelo-de-dominio.md, docs/adr/008-conteudo-e-versionamento.md,
--       docs/knowledge/04-anatomia-da-lesson.md, docs/knowledge/05-catalogo-de-exercicios.md.

-- ============================================================================
-- units
-- ============================================================================

create table public.units (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  order_index int not null,
  title_en text not null,
  title_pt_br text not null,
  theme text,
  level public.cefr_level not null default 'a1',
  estimated_minutes int,
  status public.content_status not null default 'draft',
  published_version_id uuid,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.units is 'Unidades temáticas do currículo (10 no MVP). Ver knowledge/03, knowledge/06.';
comment on column public.units.published_version_id is 'FK para unit_versions com a snapshot publicada atual (NULL em draft).';

create trigger units_set_updated_at
  before update on public.units
  for each row execute function extensions.moddatetime(updated_at);

create index units_status_order_idx on public.units (status, order_index);
create index units_slug_idx on public.units (slug);

-- ============================================================================
-- unit_objectives ("I can")
-- ============================================================================

create table public.unit_objectives (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units(id) on delete cascade,
  order_index int not null,
  i_can_pt_br text not null,
  i_can_en text,
  skill_tag text,
  linked_lesson_id uuid,
  created_at timestamptz not null default now(),
  unique (unit_id, order_index)
);

comment on table public.unit_objectives is 'Objetivos "I can" da unit em pt-BR, base do self-assessment.';
comment on column public.unit_objectives.skill_tag is 'Ex.: greetings, ordering-food — alimenta skill_checkpoints.';

create index unit_objectives_unit_idx on public.unit_objectives (unit_id);

-- ============================================================================
-- unit_versions (snapshot imutável pós-publish)
-- ============================================================================

create table public.unit_versions (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units(id) on delete restrict,
  version int not null,
  snapshot jsonb not null,
  published_at timestamptz not null default now(),
  published_by uuid references auth.users(id) on delete set null,
  unique (unit_id, version)
);

comment on table public.unit_versions is 'Snapshot imutável da unit ao publicar. Progresso do aluno referencia version_id, não unit_id mutável.';

create index unit_versions_unit_idx on public.unit_versions (unit_id);

alter table public.units
  add constraint units_published_version_fk
  foreign key (published_version_id) references public.unit_versions(id) on delete set null;

-- ============================================================================
-- lessons
-- ============================================================================

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references public.units(id) on delete cascade,
  slug text not null,
  order_index int not null,
  title_en text not null,
  title_pt_br text not null,
  level public.cefr_level not null,
  estimated_minutes int not null default 12 check (estimated_minutes between 1 and 60),
  status public.content_status not null default 'draft',
  published_version_id uuid,
  ai_generated boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (unit_id, slug),
  unique (unit_id, order_index)
);

comment on table public.lessons is 'Lesson atômica (~10-15 min). 13 seções canônicas. Ver knowledge/04.';
comment on column public.lessons.ai_generated is 'True se conteúdo foi gerado por IA (exige review humana antes de published). Ver ADR-009.';

create trigger lessons_set_updated_at
  before update on public.lessons
  for each row execute function extensions.moddatetime(updated_at);

create index lessons_unit_order_idx on public.lessons (unit_id, order_index);
create index lessons_status_idx on public.lessons (status);

-- ============================================================================
-- lesson_versions (snapshot imutável pós-publish)
-- ============================================================================

create table public.lesson_versions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete restrict,
  version int not null,
  snapshot jsonb not null,
  tts_ready boolean not null default false,
  published_at timestamptz not null default now(),
  published_by uuid references auth.users(id) on delete set null,
  unique (lesson_id, version)
);

comment on table public.lesson_versions is 'Snapshot imutável da lesson ao publicar. Inclui seções + exercises + vocab/phrase/grammar referenciados.';
comment on column public.lesson_versions.tts_ready is 'True quando pipeline UC-09 cacheou todos os áudios speakable.';

create index lesson_versions_lesson_idx on public.lesson_versions (lesson_id);

alter table public.lessons
  add constraint lessons_published_version_fk
  foreign key (published_version_id) references public.lesson_versions(id) on delete set null;

alter table public.unit_objectives
  add constraint unit_objectives_linked_lesson_fk
  foreign key (linked_lesson_id) references public.lessons(id) on delete set null;

-- ============================================================================
-- lesson_sections (autoring)
-- ============================================================================

create table public.lesson_sections (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  order_index int not null,
  kind public.lesson_section_kind not null,
  title text,
  payload jsonb not null default '{}'::jsonb,
  required boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lesson_id, order_index)
);

comment on table public.lesson_sections is 'Seções da lesson na ordem canônica. Payload específico por kind.';

create trigger lesson_sections_set_updated_at
  before update on public.lesson_sections
  for each row execute function extensions.moddatetime(updated_at);

create index lesson_sections_lesson_idx on public.lesson_sections (lesson_id, order_index);

-- ============================================================================
-- Itens lexicais reutilizáveis (autoring)
-- ============================================================================

create table public.vocabulary_items (
  id uuid primary key default gen_random_uuid(),
  en text not null,
  pt_br text not null,
  part_of_speech text,
  example_en text,
  example_pt_br text,
  audio_key text,
  image_key text,
  level public.cefr_level not null default 'a1',
  tags text[] not null default '{}',
  status public.content_status not null default 'draft',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.vocabulary_items is 'Itens lexicais reutilizáveis entre lessons. Ver knowledge/07, ADR-015 (en=en-US).';
comment on column public.vocabulary_items.audio_key is 'Chave em Storage apontando para TTS pré-gerado. Ver UC-09.';

create trigger vocabulary_items_set_updated_at
  before update on public.vocabulary_items
  for each row execute function extensions.moddatetime(updated_at);

create index vocabulary_items_level_idx on public.vocabulary_items (level);

create table public.phrase_patterns (
  id uuid primary key default gen_random_uuid(),
  en text not null,
  pt_br text not null,
  function_tag text,
  audio_key text,
  level public.cefr_level not null default 'a1',
  tags text[] not null default '{}',
  status public.content_status not null default 'draft',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.phrase_patterns is 'Chunks funcionais ("handy phrases"). function_tag: greeting, ordering, asking_price.';

create trigger phrase_patterns_set_updated_at
  before update on public.phrase_patterns
  for each row execute function extensions.moddatetime(updated_at);

create table public.grammar_points (
  id uuid primary key default gen_random_uuid(),
  title_pt_br text not null,
  title_en text,
  explanation_pt_br text not null,
  explanation_en text,
  rule_pattern text,
  examples jsonb not null default '[]'::jsonb,
  level public.cefr_level not null default 'a1',
  tags text[] not null default '{}',
  status public.content_status not null default 'draft',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.grammar_points is 'Pontos gramaticais. explanation_en opcional para transição B1+.';
comment on column public.grammar_points.examples is 'JSON: [{"en": "...", "pt_br": "..."}].';

create trigger grammar_points_set_updated_at
  before update on public.grammar_points
  for each row execute function extensions.moddatetime(updated_at);

-- ============================================================================
-- Joins M:N (autoring)
-- ============================================================================

create table public.lesson_vocabulary (
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  vocabulary_item_id uuid not null references public.vocabulary_items(id) on delete restrict,
  order_index int not null default 0,
  primary key (lesson_id, vocabulary_item_id)
);

create table public.lesson_phrases (
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  phrase_pattern_id uuid not null references public.phrase_patterns(id) on delete restrict,
  order_index int not null default 0,
  primary key (lesson_id, phrase_pattern_id)
);

create table public.lesson_grammar (
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  grammar_point_id uuid not null references public.grammar_points(id) on delete restrict,
  order_index int not null default 0,
  primary key (lesson_id, grammar_point_id)
);

-- ============================================================================
-- dialog_lines (In context)
-- ============================================================================

create table public.dialog_lines (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  dialog_key text not null,
  speaker text not null,
  en text not null,
  pt_br text,
  audio_key text,
  order_index int not null,
  created_at timestamptz not null default now(),
  unique (lesson_id, dialog_key, order_index)
);

comment on table public.dialog_lines is 'Linhas de diálogo agrupadas por dialog_key. Usadas em In context e Listen & act.';

create index dialog_lines_lesson_idx on public.dialog_lines (lesson_id, dialog_key, order_index);

-- ============================================================================
-- exercises (autoring)
-- ============================================================================

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  lesson_section_id uuid not null references public.lesson_sections(id) on delete cascade,
  type public.exercise_type not null,
  order_index int not null,
  prompt_pt_br text,
  prompt_en text,
  payload jsonb not null default '{}'::jsonb,
  expected jsonb not null default '{}'::jsonb,
  scoring jsonb not null default '{"method":"standard"}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lesson_section_id, order_index)
);

comment on table public.exercises is 'Exercícios dentro de uma seção. payload/expected específicos por type. Ver knowledge/05.';

create trigger exercises_set_updated_at
  before update on public.exercises
  for each row execute function extensions.moddatetime(updated_at);

create index exercises_section_idx on public.exercises (lesson_section_id, order_index);

-- ============================================================================
-- pronunciation_targets (frases destacadas para o Pronunciation coach)
-- ============================================================================

create table public.pronunciation_targets (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  text_en text not null,
  audio_key_normal text,
  audio_key_slow text,
  focus_phonemes text[] not null default '{}',
  order_index int not null,
  created_at timestamptz not null default now(),
  unique (lesson_id, order_index)
);

comment on table public.pronunciation_targets is 'Frases selecionadas da lesson para prática de pronúncia. Ver knowledge/11.';
comment on column public.pronunciation_targets.focus_phonemes is 'Fonemas-alvo en-US: ["/θ/", "/r/", "/æ/", "flap"]. Metadata pedagógica.';
