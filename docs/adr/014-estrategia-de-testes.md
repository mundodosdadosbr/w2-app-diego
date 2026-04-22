# ADR-014: Estratégia de testes

- **Status**: Accepted
- **Data**: 2026-04-21
- **Tags**: qualidade, devops

## Contexto

Um app pedagógico com IA e áudio tem áreas de risco distintas:
1. **Lógica de domínio** — SRS, scoring, cálculo de progresso, regras de conclusão.
2. **Políticas RLS** — um bug aqui vaza dados entre alunos.
3. **Componentes de UI** — player, exercícios, gravador.
4. **Integrações externas** — LLM, TTS, STT (não determinísticos).
5. **Fluxos de ponta a ponta** — aluno entra, faz lesson, completa, revê.
6. **Prompts de IA** — qualidade pedagógica das respostas (nunca sai do nível, correção gentil, nunca reproduz apostila).

Queremos testes pragmáticos: alta cobertura em lógica pura e segurança, seletiva em UI.

## Decisão

### Pirâmide adaptada

#### Unit (Vitest)
- 100% das funções puras em `lib/` (SRS, WER, progress, parsing).
- Mocks para Supabase client (via `@supabase/supabase-js` mock adapter).
- Rápido: `< 5s` total.

#### Integration — Banco + RLS (pgTAP)
- **Toda policy RLS** tem teste em `supabase/tests/policies/*.sql`:
  - Cria dois usuários sintéticos com `auth.users`.
  - Tenta operações cross-user esperadas para falhar.
  - Tenta operações permitidas esperadas para passar.
- **Funções SQL de regra** (conclusão de lesson, criação de review, streak) testadas em `supabase/tests/functions/*.sql`.
- Rodam no CI contra Supabase local (`supabase start`).

#### Integration — Edge Functions (Vitest + fetch real)
- Cada Edge Function tem teste que sobe o emulador local e faz fetch.
- LLM/TTS/STT usam **fixtures gravadas** (responses deterministas salvas em `tests/fixtures/`).

#### Component (Vitest + Testing Library)
- Exercícios (múltipla escolha, completar lacunas, ordenar palavras, role-play) — um teste por tipo, cobrindo: render, interação, submit, estado de erro.
- Player — teste de navegação entre seções.

#### E2E (Playwright)
- **Fluxos críticos**:
  - Cadastro → onboarding → primeira lesson.
  - Completar uma lesson inteira.
  - Revisão no review center.
  - Speaking session com tutor (IA mockada).
  - Pronunciation attempt (áudio fixture).
- Rodam em preview deploy em cada PR.

#### Prompt evals (suite custom em `tests/evals/`)
Inspirado em práticas de LLM eval:
- Conjunto de casos: prompt do aluno + esperado-ideal (descrito, não literal).
- **LLM-as-judge** (Claude Sonnet 4.6) com rubrica:
  - Correção gramatical preservou intenção?
  - Nível de vocabulário respeitou `level`?
  - Correção foi gentil?
  - Não reproduziu trecho proibido?
- Threshold de passagem por categoria (ex.: 85% das correções "gentis").
- Rodam **nightly** e em PRs que tocam `lib/llm/*` ou `prompts/*`.
- Resultados em dashboard interno.

#### Accessibility
- `@axe-core/react` no Playwright E2E — sem violations críticas.
- Testes manuais por teclado em PRs que mexem em componente novo.

### Convenções
- Arquivos `*.test.ts` ao lado do código quando pertinentes; `*.test.tsx` para componentes.
- E2E em `tests/e2e/`.
- Evals em `tests/evals/`.
- Sem mocks pesados: se precisa mockar 10 coisas para testar algo, o código está acoplado demais.

### CI gates
- PR não merge se:
  - Typecheck falhar.
  - Lint falhar (eslint).
  - Unit + component tests falharem.
  - pgTAP falhar (todas as policies precisam passar).
  - E2E críticos falharem.
- Evals de prompt **não bloqueiam merge** (não-determinístico), mas degradação dispara issue automática.

## Alternativas consideradas

- **Jest em vez de Vitest** — Vitest é mais rápido e alinha com Vite/esbuild usado pelo Next. Nada contra Jest, só menos DX.
- **Cypress em vez de Playwright** — Playwright tem melhor suporte cross-browser e runs paralelos. Preferência atual.
- **Nenhum teste de prompt** — risco alto de degradação silenciosa de qualidade pedagógica.
- **Testes contra Supabase cloud** — lento, caro, polui dados. Supabase local é o caminho.

## Consequências

### Positivas
- pgTAP fecha a porta que mais doi (autorização). Combinado ao ADR-003, vira rede dupla.
- Evals de prompt criam sinal contínuo sobre qualidade da IA, que é o produto.
- Pipeline rápido: unit < 5s, integration < 30s, e2e < 3min.

### Negativas / Custos aceitos
- Evals de prompt custam dinheiro (chamadas LLM). Mitigação: rodar nightly + em PRs que tocam IA, não em todo PR.
- pgTAP tem curva de aprendizado. Temos helpers em `supabase/tests/helpers/`.

### Neutras / Impactos
- RLS em [ADR-003](003-rls-e-autorizacao.md).
- Prompts em [knowledge/10-ai-personas-e-prompts.md](../knowledge/10-ai-personas-e-prompts.md).
- Observabilidade complementa (detecta o que teste não pegou): [ADR-012](012-observabilidade-e-analytics.md).

## Referências
- https://pgtap.org/
- https://vitest.dev/
- https://playwright.dev/
