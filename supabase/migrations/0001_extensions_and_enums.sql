-- 0001_extensions_and_enums.sql
-- Habilita extensões necessárias e cria enums do domínio.
-- Refs: docs/knowledge/07-modelo-de-dominio.md, docs/adr/013-hosting-e-deploy.md (pg_cron), docs/adr/014-estrategia-de-testes.md (pgtap).

-- ============================================================================
-- Extensions
-- ============================================================================

create extension if not exists "pg_cron" with schema extensions;
comment on extension "pg_cron" is 'Jobs agendados: refresh_streaks, purge_expired_recordings, recompute_due_reviews.';

create extension if not exists "pgtap" with schema extensions;
comment on extension "pgtap" is 'Testes unitários para RLS policies e funções SQL.';

create extension if not exists "moddatetime" with schema extensions;
comment on extension "moddatetime" is 'Trigger helper para manutenção de updated_at.';

-- pgcrypto, uuid-ossp, pg_graphql, pg_stat_statements, supabase_vault já vêm habilitados
-- no projeto Supabase `ucbbhymgflujbtcopaeb`.

-- ============================================================================
-- Enums
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('student', 'author', 'reviewer', 'admin');
    comment on type public.user_role is 'Papel do usuário. Ver ADR-003.';
  end if;

  if not exists (select 1 from pg_type where typname = 'cefr_level') then
    create type public.cefr_level as enum ('a0', 'a1', 'a2', 'b1', 'b2', 'c1', 'c2');
    comment on type public.cefr_level is 'Nível CEFR. A0 = pré-A1 (iniciante absoluto).';
  end if;

  if not exists (select 1 from pg_type where typname = 'content_status') then
    create type public.content_status as enum ('draft', 'review', 'published', 'archived');
    comment on type public.content_status is 'Status editorial de conteúdo. Ver ADR-008.';
  end if;

  if not exists (select 1 from pg_type where typname = 'lesson_section_kind') then
    create type public.lesson_section_kind as enum (
      'intro', 'verbs', 'new_words', 'handy_phrases', 'grammar',
      'in_context', 'drill', 'speak_now', 'pair_practice',
      'listen_and_act', 'fluency', 'pronunciation', 'recap', 'self_check'
    );
    comment on type public.lesson_section_kind is '13 seções canônicas da lesson. Ver knowledge/04.';
  end if;

  if not exists (select 1 from pg_type where typname = 'exercise_type') then
    create type public.exercise_type as enum (
      'shadow_repeat', 'multiple_choice', 'fill_blank', 'word_order',
      'match_word_image', 'match_en_pt', 'short_answer', 'build_sentence',
      'role_play', 'shadowing', 'pronunciation', 'review_quiz', 'listen_and_number'
    );
    comment on type public.exercise_type is 'Tipos de exercício. Ver knowledge/05.';
  end if;

  if not exists (select 1 from pg_type where typname = 'review_stage') then
    create type public.review_stage as enum ('d1', 'd3', 'd7', 'd14', 'd30', 'mastered');
    comment on type public.review_stage is 'Stages ancorados da SRS. Ver ADR-006, knowledge/12.';
  end if;

  if not exists (select 1 from pg_type where typname = 'confidence_level') then
    create type public.confidence_level as enum ('i_can', 'not_sure', 'cant_yet');
    comment on type public.confidence_level is 'Autoavaliação por objetivo. Ver knowledge/03, UC-06.';
  end if;

  if not exists (select 1 from pg_type where typname = 'progress_status') then
    create type public.progress_status as enum ('in_progress', 'completed', 'abandoned');
    comment on type public.progress_status is 'Status de lesson_progress e unit_progress.';
  end if;

  if not exists (select 1 from pg_type where typname = 'speaking_mode') then
    create type public.speaking_mode as enum ('short_answer', 'open_conversation', 'role_play', 'fluency', 'lesson_pair');
    comment on type public.speaking_mode is 'Modo da sessão de speaking. Ver knowledge/10, UC-04.';
  end if;

  if not exists (select 1 from pg_type where typname = 'review_item_type') then
    create type public.review_item_type as enum ('vocab', 'phrase', 'grammar', 'chunk');
    comment on type public.review_item_type is 'Tipos polimórficos de item revisável. Ver knowledge/12.';
  end if;
end $$;

-- Nota: helper function `public.current_role()` vive em 0004_rls_policies.sql
-- (precisa de public.profiles existir antes por causa de validação de language sql).
