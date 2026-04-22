# ADR-010: Estratégia de estado no frontend

- **Status**: Accepted
- **Data**: 2026-04-21
- **Tags**: frontend, data-fetching

## Contexto

O frontend precisa gerenciar:

- **Dados do servidor**: conteúdo de lessons, progresso do aluno, fila de revisão, sessão de speaking.
- **Estado de UI**: tab ativa no player, modo (input/output/review), toggle de tradução visível, gravação em progresso.
- **Estado efêmero de exercício**: seleção em curso, timers, contador de tentativas antes do submit.
- **Autenticação**: sessão do Supabase.

Queremos evitar Redux-like para estado que é trivialmente server-owned, e evitar buscar tudo com `useEffect` + `fetch`.

## Decisão

### Estado do servidor
- **Leituras públicas e de conteúdo**: **React Server Components** com `supabase-js` no server (cookies SSR). Renderizadas no Next.js como Server Component. Zero JS enviado para leitura.
- **Leituras interativas** (dashboard com progresso vivo, lista de revisões, chat com tutor): **TanStack Query (React Query) v5** no Client Component. Staletime padrão 30s, `refetchOnWindowFocus` nas páginas "ao vivo" (dashboard, review center).
- **Mutações** (submit de exercício, conclusão de lesson, salvar self-assessment): **Server Actions do Next** que chamam RPC Supabase OU Edge Function. Em formulários simples, Server Actions com `useActionState`.
- **Realtime** (quando necessário: ranking semanal, turmas): **Supabase Realtime** assinado em Client Component, sincronizado com cache do TanStack Query via `queryClient.setQueryData`.

### Estado de UI local
- **React state (`useState`, `useReducer`)** é a primeira opção.
- **Zustand** quando o estado é compartilhado entre componentes distantes **no mesmo cliente** e não faz sentido subir para o servidor (ex.: modo de leitura do player, preferências de áudio na sessão).
- **Nunca** Redux / Redux Toolkit no MVP.

### Formulários
- **React Hook Form** para todo formulário com > 2 campos.
- **Zod** para schema compartilhado entre cliente (validação rápida) e servidor (validação autoritativa no Server Action).

### Autenticação
- `@supabase/ssr` para lidar com cookies httpOnly.
- `middleware.ts` do Next refresca sessão e protege rotas `/app/*`.
- Cliente usa `supabase.auth.onAuthStateChange` só para reagir em UI (não para gating de rotas — quem protege rota é middleware + RLS).

### Player da lesson (estado crítico)
O player tem muitos subcomponentes. Estratégia:
- Estado global da lesson (seção atual, progresso dentro da lesson, tentativas na sessão) em **Zustand store local da página**.
- Persistência: a cada transição de seção, `POST` Server Action que atualiza `lesson_progress`. Store mantém só a última transição otimistic.
- Exercícios encapsulam o próprio estado; emitem evento `onComplete(result)` que o player escuta e persiste.

## Alternativas consideradas

- **Redux Toolkit + RTK Query** — mais cerimônia, duplica o que TanStack Query já faz bem com menos código.
- **SWR** — comparável ao TanStack Query, mas TanStack tem melhor suporte a mutações, infinite queries, e ecossistema de devtools.
- **Tudo via Server Actions** — atraente pelo minimalismo, mas Server Actions não brilham em leituras recorrentes / polling. Usamos para mutações, não para leituras dinâmicas.
- **Jotai / Valtio** — boas, mas Zustand tem API mais simples e comunidade maior.

## Consequências

### Positivas
- Dados públicos com zero JS enviado (Server Components) → player mobile mais leve.
- Cache unificado do TanStack Query reduz refetch redundante no dashboard.
- Zustand cobre o caso de estado local do player sem acoplar a server state.
- Validação Zod compartilhada evita drift entre cliente/servidor.

### Negativas / Custos aceitos
- Dois paradigmas (Server Components + Client com TanStack Query). Requer convenção clara — documentada no onboarding do repositório.
- `@supabase/ssr` + App Router tem pegadinhas em edge runtime; precisamos fixar versões e manter um helper único `createServerClient`.

### Neutras / Impactos
- Estrutura de pastas em [ADR-011](011-estrutura-do-repositorio.md).
- Testes de componentes em [ADR-014](014-estrategia-de-testes.md).

## Referências
- https://tanstack.com/query/latest
- https://supabase.com/docs/guides/auth/server-side/nextjs
- https://zustand.docs.pmnd.rs/
