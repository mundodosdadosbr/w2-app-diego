# ADR-008: Estrutura e versionamento do conteúdo pedagógico

- **Status**: Accepted
- **Data**: 2026-04-21
- **Tags**: conteudo, backend, pedagogia, authoring

## Contexto

O conteúdo pedagógico (units, lessons, seções, vocabulário, frases, gramática, exercícios, diálogos) é o **ativo principal** da plataforma. Precisamos de um sistema que:

1. Permita autoria por humanos (autores pedagógicos) com revisão antes de publicar.
2. Seja versionado — voltar atrás em mudanças, comparar, auditar.
3. Não quebre o progresso dos alunos quando conteúdo publicado é atualizado.
4. Aceite que parte do conteúdo pode ser gerado por IA (drills, exemplos extras) com revisão humana obrigatória.
5. Suporte TTS pré-gerado e cacheado (ver [ADR-005](005-tts-stt.md)).

## Decisão

### Onde o conteúdo vive
**Banco Postgres do Supabase** é a fonte da verdade em produção. Conteúdo **não** vive em arquivos markdown no repo em produção — alunos consomem via API/Postgres com RLS.

Porém, o **seed inicial** (semente para ambiente novo, migração reprodutível) vive em arquivos versionados em `supabase/seed/content/` como **JSON** (uma pasta por unit, um arquivo por lesson + metadados). Isso permite:
- Pull requests revisáveis em conteúdo inicial.
- Reset de ambientes de dev com um comando.
- Histórico em git.

Depois do seed, autoria acontece via **interface web interna** (`/admin`) que escreve direto no Postgres. Ferramenta de export re-serializa para JSON quando quisermos atualizar o seed.

### Modelo de versionamento
- Toda tabela de conteúdo (`units`, `lessons`, `lesson_sections`, `exercises`, `vocabulary_items`, `phrase_patterns`, `grammar_points`) tem:
  - `status`: `draft` | `review` | `published` | `archived`.
  - `version`: inteiro, incrementado em cada `published`.
  - `published_version_id`: FK para snapshot imutável em tabela `*_versions` quando publicado.
- Ao publicar: cria linha em `*_versions` copiando estado atual; passa a ser a versão ativa; alunos em lessons em andamento continuam na versão que começaram.
- Progresso do aluno (`lesson_progress`, `exercise_attempts`) referencia `*_version_id`, não `*_id` diretamente. Isso garante que mudar o conteúdo não invalida tentativas passadas.

### Fluxo editorial
1. **Author** cria/edita em `draft`.
2. Move para `review`.
3. **Reviewer** aprova → status `published`, cria version snapshot, dispara job de TTS.
4. Edits posteriores viram nova `draft` até publicação (sem afetar versão ativa).
5. `archived` é soft-delete — conteúdo sai da trilha nova mas permanece para quem já estava.

### TTS pré-gerado
Trigger pós-`published` enfileira job de TTS para todas as strings `speakable = true` (frases, diálogos, vocab). Arquivos em Storage com chave determinística. Ver [ADR-005](005-tts-stt.md).

### Conteúdo gerado por IA
- Autores podem **sugerir** drills, exemplos extras ou role-plays gerados por IA a partir de prompt-template.
- Saída vai para `draft` com flag `ai_generated = true`.
- **Obrigatório** passar por `review` humana antes de `published`.
- Nunca reproduzir apostila — ver [ADR-009](009-copyright-e-ip.md).

## Alternativas consideradas

- **Conteúdo em arquivos Markdown/MDX no repo** — ótimo para DX, mas pior para authoring por pedagogos não-técnicos, e exige deploy para toda mudança. Rejeitado em produção; mantido só para seed.
- **Headless CMS (Sanity, Contentful, Strapi)** — adiciona serviço extra; duplica auth e autorização; sobreposição com RLS do Supabase. Rejeitado.
- **Sem versionamento (sobrescrever)** — viola "não invalidar progresso". Rejeitado.
- **Versionamento completo event-sourced** — excesso de complexidade para o MVP.

## Consequências

### Positivas
- Conteúdo seed em git permite review por PR na fase inicial.
- Versionamento leve garante que edits em lesson não quebram tentativas passadas.
- Fluxo `draft → review → published` alinhado ao ADR-003 (papéis `author`/`reviewer`).
- TTS cacheado determinístico reduz custo.

### Negativas / Custos aceitos
- Duplicação `units` ↔ `unit_versions` aumenta superfície de tabelas. Simplificação: `lesson_sections` e `exercises` sempre fazem snapshot por `lesson_version` (não criam tabelas próprias de version).
- Autoria web interna vira TODO real de UI (`/admin`). No MVP pode começar tosco (formulários básicos) e evoluir.

### Neutras / Impactos
- Modelo de dados em [knowledge/07-modelo-de-dominio.md](../knowledge/07-modelo-de-dominio.md).
- Guardrails de copyright em [ADR-009](009-copyright-e-ip.md).
- Seed inicial com 2 unidades completas: item do backlog MVP.

## Referências
- Nenhuma específica.
