---
name: Glossário
description: Termos do domínio — pedagógicos, técnicos, de produto
---

# 15 — Glossário

Definições curtas dos termos usados no produto, documentação e código. Referência rápida para autores, engenheiros e PMs.

## Pedagógicos

**CEFR** — Common European Framework of Reference for Languages. Escala A1 → C2. Usamos A0 (pré-A1), A1, A2, B1, B2, C1, C2 em `profiles.cefr_level`.

**Chunk** — bloco de 2-5 palavras que funciona como unidade fonético-semântica ("would you like", "nice to meet you"). Usado em Pronunciation coach e em handy phrases.

**Drill** — exercício curto de fixação, fase FIXAÇÃO. Nome interno do que a apostila chama "Check it out". Ver [05](05-catalogo-de-exercicios.md).

**Fluency** — seção/modo de produção aberta, geralmente com pergunta que o aluno responde livremente.

**Grammar point** — unidade gramatical isolada (ex.: "simple present afirmativo I/you"). Ensinada com 2-3 exemplos + regra curta.

**Handy phrase** — expressão funcional pronta, equivalente ao "Useful phrase" da apostila. Ex.: "Can I have...?".

**In context** — seção de contextualização com mini-diálogo. Equivalente ao "Real Life" da apostila.

**INPUT** — fase do ciclo pedagógico em que o aluno recebe conteúdo novo.

**I can / I'm not sure / I can't yet** — escala de 3 pontos de autoavaliação (CEFR padrão).

**Lesson** — unidade pedagógica atômica, ~10-15 min, com 13 seções canônicas. Ver [04](04-anatomia-da-lesson.md).

**Listen & act** — atividade de compreensão + role-play sobre diálogo. Equivalente a "Listen, Number, and Role-play".

**Microaprendizado** — princípio pedagógico de dividir conteúdo em blocos pequenos (5-10 itens por lesson, < 2 min por seção).

**Objective** — meta comunicativa de uma unit, expressa como "I can <verb>..." (ex.: "I can order food at a café").

**OUTPUT** — fase do ciclo pedagógico em que o aluno produz. É a mais importante do produto.

**Pair practice** — conversa simulada em dupla, geralmente com tutor IA (antes Pearson era "Talk to your friend").

**Recap** — síntese cumulativa no final de uma lesson ou unit. Nome interno do "Pinpoint".

**REVIEW** — fase do ciclo pedagógico, fixação e retenção. Dividida em Recap dentro da lesson + SRS ao longo do tempo.

**Self-assessment** — checklist pós-unit onde o aluno indica I can / not sure / can't yet por objetivo.

**Shadowing** — técnica de pronúncia em que aluno repete junto com o áudio, com atraso mínimo.

**Skill checkpoint** — marco de competência comunicativa destravada (ex.: "order food in English"). Ver `skill_checkpoints`.

**SM-2 simplificado** — algoritmo de SRS adotado. Ver [ADR-006](../adr/006-spaced-repetition.md).

**Speak now** — seção de produção oral guiada. Aluno recebe prompt em pt-BR e produz frase em EN.

**SRS (Spaced Repetition System)** — sistema de revisão espaçada que agenda reitens conforme desempenho. Ver [12](12-spaced-repetition.md).

**Stage (de revisão)** — nível ancorado na SRS: d1, d3, d7, d14, d30, mastered.

**There and around** — fechamento de unit com síntese prática + preview da próxima.

**Trilha** — caminho linear de unidades. Aluno progride por ela (ou abre com "modo aberto").

**Unit** — bloco temático de 4-6 lessons + Recap + Self-assessment. Ver [03](03-anatomia-da-unit.md).

## Técnicos

**ADR** — Architecture Decision Record. Decisão técnica estruturante em `docs/adr/`.

**Cache hit rate** — proporção de chamadas LLM que aproveitam prompt caching (alvo ≥ 85%).

**Cefr_level** — enum Postgres representando nível CEFR do aluno.

**Edge Function** — função Deno em Supabase, usada para integrações com IA/TTS/STT.

**Grade** — pontuação 0-5 atribuída a uma tentativa de exercício. Alimenta a SRS.

**LLM** — Large Language Model. Usamos Claude (Anthropic) como primário.

**Lesson version** — snapshot imutável publicado de uma lesson. Progresso de aluno referencia a versão, não a lesson mutável.

**Persona (IA)** — papel que o LLM assume (tutor, speaking partner, corrector, recommender, pronunciation_feedback).

**RLS (Row-Level Security)** — mecanismo do Postgres que restringe linhas por políticas SQL. Nossa camada primária de autorização.

**Server Component** — componente React renderizado no servidor (Next.js App Router), zero JS no cliente.

**Service role** — chave de Supabase que bypassa RLS. Só em Edge Functions.

**STT** — Speech-to-Text. Usamos Whisper (OpenAI).

**TTS** — Text-to-Speech. Primário ElevenLabs, fallback OpenAI.

**WER** — Word Error Rate, métrica de alinhamento palavra a palavra entre esperado e transcrito. Base do pronunciation scoring.

## Produto

**Aluno** — usuário com role `student`. Foco primário.

**Author** — usuário com role `author`, cria conteúdo pedagógico.

**Dashboard** — tela inicial da área logada, mostra "estudar hoje" + resumo.

**Estudar hoje** — modo que gera trilha diária sugerida de 15-20 min (revisões + lesson atual + bônus).

**Level test** — teste curto no onboarding, calibra CEFR inicial.

**Meta semanal** — minutos de estudo alvo por semana, definidos pelo aluno.

**Modo aberto** — opt-in que libera todas as unidades `published`, sem sequência.

**Modo conversação** — sessão de speaking sem amarração a lesson.

**Modo revisão** — sessão que só consome fila do Review Center.

**Review Center** — tela dedicada à fila de SRS.

**Reviewer** — usuário com role `reviewer`, aprova conteúdo antes de `published`.

**Speaking Practice** — módulo de conversa com tutor IA. Quatro modos: short_answer, open_conversation, role_play, fluency.

**Streak** — número de dias consecutivos com atividade qualificante. Ver [09](09-gamificacao-e-progresso.md).

**Streak freeze** — token que evita reset em 1 dia parado.

**Teste de nível** — ver Level test.

## Papéis e roles

**student** — aluno comum (default).
**author** — cria/edita conteúdo.
**reviewer** — aprova conteúdo para publicação.
**admin** — operação, suporte, auditoria.

Ver [ADR-003](../adr/003-rls-e-autorizacao.md).

## Referências
- Todos os documentos em `docs/knowledge/`.
- [ADR index](../adr/README.md).
