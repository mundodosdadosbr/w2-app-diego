# ADR-011: Estrutura do repositório

- **Status**: Accepted
- **Data**: 2026-04-21
- **Tags**: devops, organizacao

## Contexto

O produto é um web app Next.js + backend Supabase. Precisamos decidir se adotamos monorepo com múltiplos packages (turborepo/pnpm workspaces) ou um único app.

Considerações:
- Time pequeno no início.
- Um único cliente (web). App mobile nativo é pós-MVP.
- Código compartilhado entre cliente e Edge Functions (tipos, validação Zod, prompts).

## Decisão

**Repositório único com um app Next.js e utilitários organizados por pasta**, não monorepo de packages.

```
w2-app-diego/
├── app/                        # Next.js App Router
│   ├── (marketing)/            # landing pública
│   ├── (auth)/                 # login, cadastro, reset
│   ├── (app)/                  # área logada
│   │   ├── dashboard/
│   │   ├── trilha/
│   │   ├── unit/[slug]/
│   │   ├── lesson/[slug]/      # lesson player
│   │   ├── speaking/
│   │   ├── pronunciation/
│   │   ├── review/
│   │   ├── self-assessment/[unitSlug]/
│   │   ├── profile/
│   │   └── settings/
│   ├── admin/                  # autoria (authors/reviewers)
│   ├── api/                    # route handlers quando necessário
│   └── layout.tsx, page.tsx, globals.css
│
├── components/                 # UI reutilizável
│   ├── ui/                     # shadcn/ui
│   ├── lesson/                 # player, section nav, progress bar
│   ├── exercises/              # cada tipo de exercício
│   ├── speaking/               # chat com IA
│   ├── pronunciation/          # recorder, scorer UI
│   └── layout/                 # shells, nav, header
│
├── lib/
│   ├── supabase/               # client, server, middleware
│   ├── llm/                    # LlmClient, personas, prompts
│   ├── tts/                    # TtsClient, cache
│   ├── stt/                    # SttClient
│   ├── srs/                    # algoritmo SM-2 simplificado
│   ├── pronunciation/          # WER, alignment, scorer
│   ├── progress/               # cálculo de progresso e streak
│   ├── content/                # tipos do domínio
│   └── utils/                  # helpers genéricos
│
├── schemas/                    # Zod schemas compartilhados
│
├── types/                      # tipos TypeScript
│   └── database.ts             # gerado por `supabase gen types`
│
├── hooks/                      # React hooks
│
├── stores/                     # Zustand stores (player, prefs)
│
├── supabase/
│   ├── migrations/             # SQL migrations versionadas
│   ├── functions/              # Edge Functions (tts, stt, llm, schedule-review)
│   ├── seed/
│   │   └── content/            # JSON do conteúdo seed
│   │       └── unit-01-greetings/
│   ├── tests/                  # pgTAP / policies tests
│   └── config.toml
│
├── docs/
│   ├── adr/                    # este diretório
│   ├── knowledge/
│   └── README.md
│
├── public/                     # estáticos
│
├── tests/
│   ├── unit/
│   ├── e2e/                    # Playwright
│   └── evals/                  # avaliações de prompts LLM
│
├── .github/workflows/          # CI
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

### Convenções
- **Server Components são o padrão**. Client Components marcados com `"use client"` no topo e colocados em `components/.../*.client.tsx` quando ambíguo.
- **Nomes em inglês** para código e conceitos do domínio (lesson, unit, review); **nomes em português** para rotas e UI visível ao aluno.
- **Imports absolutos** via `@/` (`@/lib/llm/client`).
- **Barrel exports** só quando facilitam — evitar `index.ts` que agregam tudo.
- **Tipos gerados do Supabase** em `types/database.ts` nunca editados à mão; re-gerar via script.

## Alternativas consideradas

- **Monorepo pnpm workspaces (web + mobile + edge)** — valor real só quando há múltiplos apps ou libs compartilhadas entre times. Overengineering para MVP.
- **Turborepo** — benefícios de cache de build aparecem com múltiplos apps. Adicionar quando mobile nativo entrar.
- **Clean Architecture com camadas explícitas (`domain/`, `application/`, `infrastructure/`)** — excesso de cerimônia para o tamanho atual; mantemos separação funcional (ui, lib, schemas, supabase) que já é clara.

## Consequências

### Positivas
- Baixo overhead. Qualquer dev roda com `pnpm install && pnpm dev`.
- Edge Functions ficam junto do frontend → PRs completos em um lugar.
- `docs/` visível no repositório, não espalhado.

### Negativas / Custos aceitos
- Se surgir app mobile nativo, precisaremos migrar para monorepo. Mitigação: manter `lib/` puro (sem dependências de `next/*`) desde já, para facilitar extração.
- Edge Functions em Deno vs resto em Node exige disciplina para não importar libs incompatíveis.

### Neutras / Impactos
- Stack em [ADR-001](001-stack-frontend.md) e [ADR-002](002-backend-supabase.md).
- Testes em [ADR-014](014-estrategia-de-testes.md).
- Deploy em [ADR-013](013-hosting-e-deploy.md).

## Referências
- https://nextjs.org/docs/app/getting-started/project-structure
