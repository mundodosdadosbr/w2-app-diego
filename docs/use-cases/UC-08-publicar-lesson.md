# UC-08 — Publicar uma lesson (draft → review → published)

- **Atores**: Autor (cria), Reviewer (aprova)
- **Objetivo**: Levar uma lesson do rascunho ao estado publicado, disponibilizada aos alunos, sem quebrar progresso existente
- **Prioridade MVP**: P0
- **Última revisão**: 2026-04-21

## Trigger
- Autor cria nova lesson ou abre lesson existente em `/admin/lessons/[id]/edit`, **ou**
- Reviewer recebe notificação de lesson em `status='review'` via `/admin/queue`.

## Preconditions
- Autor com `profiles.role = 'author'` (ou `admin`).
- Reviewer com `profiles.role = 'reviewer'` (ou `admin`).
- Unit pai existe.
- Se republicação: versão atual tem progresso de alunos apontando para `lesson_version` específica (imutável, não afetada por edits futuros).

## Main flow

### Parte A — Autor cria/edita em draft

1. Autor abre `/admin/lessons/new` ou existente.
2. UI apresenta **formulário estruturado** (refletindo [knowledge/04](../knowledge/04-anatomia-da-lesson.md)):
   - Metadata: slug, unit_id, order_index, title_en, title_pt_br, estimated_minutes.
   - Por seção canônica (Verbs, New Words, Handy phrases, Grammar, In context, Drill, Speak now, Pair practice, Listen & act, Fluency, Pronunciation, Recap, Self-check): editor específico.
   - Cada seção permite associar `vocabulary_items`, `phrase_patterns`, `grammar_points` existentes ou criar novos em linha.
   - Cada exercício é criado com tipo ([knowledge/05](../knowledge/05-catalogo-de-exercicios.md)) + payload + expected + scoring.
3. Autor escreve em **American English** (spelling americano, vocabulário americano, [knowledge/10](../knowledge/10-ai-personas-e-prompts.md)).
4. **(Opcional) Assistência de IA**: botão "Sugerir drills" → Edge Function chama Bedrock Claude Opus (persona `author_assistant` — a definir) com prompt-template. Retorna sugestões com `ai_generated=true`. Autor aceita/edita.
5. **Checklist de copyright** ([knowledge/14](../knowledge/14-guardrails-copyright.md)) obrigatório antes de submeter:
   - [ ] Nenhum texto da apostila.
   - [ ] Personagens originais.
   - [ ] Vocab em ordem própria.
   - [ ] Explicações do zero.
   - [ ] Diálogos brasileiros 2026.
6. Sistema executa **checagem automática de similaridade** vs `Apostila En.md` e corpus de obras conhecidas (n-gram ≥ 7 palavras idênticas → flag). Se flag, autor precisa revisar antes de submit.
7. Autor salva como `draft` (autosave a cada 30s também).
8. Autor clica **"Submit for review"** → `lessons.status='review'`; entrada em `audit_log` (`action='content.submitted_for_review'`).
9. Notificação para reviewers via painel `/admin/queue` (email opt-in, fase 2).

### Parte B — Reviewer aprova

10. Reviewer abre `/admin/queue` → vê lessons em `review` ordenadas por data.
11. Abre lesson; UI renderiza em **modo preview** — exatamente como o aluno veria.
12. Reviewer navega todas as seções + executa alguns exercícios como aluno sintético.
13. Checklist de review:
    - [ ] Progressão lesson anterior → atual coerente.
    - [ ] Vocab/estruturas dentro do nível declarado.
    - [ ] OUTPUT ≥ 40% do tempo estimado.
    - [ ] Self-check reflete objetivos.
    - [ ] Copyright OK (dupla verificação).
    - [ ] Sem pegadinhas de tradução/sentido.
    - [ ] Pronunciation targets com variedade fonológica.
14. Reviewer decide:
    - **Aprovar** → continua para C.
    - **Rejeitar** → `lessons.status='draft'` + comentário em `audit_log`; autor recebe para ajustar (UC-F7, não no MVP — no MVP é feedback manual).

### Parte C — Publicação

15. Ao aprovar:
    - Função SQL `publish_lesson(lesson_id)`:
      - Incrementa `lessons.version`.
      - Cria `lesson_versions` com snapshot JSON da lesson (seções + exercises + refs a vocab/phrase/grammar snapshots).
      - Atualiza `lessons.status='published'` + `published_version_id=new`.
      - Registra em `audit_log` (`action='content.published'`, diff).
16. Trigger enfileira job TTS (UC-09) para todos os textos `speakable=true` que ainda não têm áudio cacheado.
17. Trigger cria/atualiza **custom vocabulary** no Amazon Transcribe para a lesson (lista de palavras da New Words + Handy phrases) — melhora STT na seção Pronunciation.
18. Lesson publicada vira visível para alunos imediatamente.
19. Alunos que já estão em uma versão anterior **não são afetados** — `lesson_progress.lesson_version_id` é imutável até concluírem. Próxima lesson iniciada usa versão mais recente.

## Alternative flows

- **AF-1 — Autor abandona draft**: autosave mantém; lesson fica em `status='draft'` indefinidamente (tem `updated_at` para triagem).
- **AF-2 — Flag de similaridade**: autor precisa editar trechos flagados ou fornecer justificativa (raro — ex.: expressão idiomática universal). `audit_log` registra override.
- **AF-3 — Reviewer encontra problema em lesson já `published`**: cria novo `draft` com correção; reaprovação cria nova `version`. Alunos em progresso continuam na versão antiga.
- **AF-4 — Republicação sem afetar alunos em voo**: já coberto por `lesson_versions` imutáveis. Essencial para P4 da Constitution (não castigar aluno por edit tardio).
- **AF-5 — Falha no pipeline TTS**: lesson fica publicada mas áudios pendentes. UI mostra toast silencioso ao aluno se tocar áudio ainda não gerado (TTS runtime fallback via ElevenLabs direto, custo por chamada).
- **AF-6 — Lesson arquivada**: `status='archived'`; some da trilha nova, mas `lesson_versions` permanecem válidas para quem já estava.
- **AF-7 — IA gerou drills (`ai_generated=true`)**: reviewer obrigado a verificar item-a-item.
- **AF-8 — Autor sem permissão tenta acessar `/admin`**: middleware Next + RLS bloqueiam. Redirect para `/dashboard`.

## Postconditions

- `lessons.status='published'`, `version` incrementada.
- `lesson_versions` com snapshot imutável publicado.
- `audit_log` com trilha completa.
- Job TTS agendado.
- Custom vocabulary Transcribe atualizada.
- Alunos veem lesson imediatamente; progresso em curso preservado.

## Telemetry

- `author_lesson_drafted { lesson_id, author_id }`
- `author_lesson_submitted_for_review { lesson_id }`
- `reviewer_lesson_approved { lesson_id, reviewer_id, review_duration_ms }`
- `reviewer_lesson_rejected { lesson_id, reviewer_id, reason? }`
- `lesson_published { lesson_id, version, snapshot_size_bytes }`
- `similarity_check_flagged { lesson_id, ngram_matches }`

## References

- **Constitution**: P2 (conteúdo original — checklist obrigatório + similaridade), P4 (progresso do aluno não quebra), P10 (en-US obrigatório).
- **ADRs**: [003](../adr/003-rls-e-autorizacao.md) (roles author/reviewer), [008](../adr/008-conteudo-e-versionamento.md), [009](../adr/009-copyright-e-ip.md), [016](../adr/016-stt-amazon-transcribe.md) (custom vocabulary).
- **Knowledge**: [04](../knowledge/04-anatomia-da-lesson.md), [05](../knowledge/05-catalogo-de-exercicios.md), [14](../knowledge/14-guardrails-copyright.md).

## Telas envolvidas
- `/admin/lessons/new`, `/admin/lessons/[id]/edit`.
- `/admin/queue` (fila de review).
- `/admin/lessons/[id]/preview` (modo aluno).
