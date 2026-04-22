# ADR-001: Stack do frontend — Next.js 15 + TypeScript + Tailwind + shadcn/ui

- **Status**: Accepted
- **Data**: 2026-04-21
- **Tags**: frontend, stack

## Contexto

A plataforma precisa entregar uma experiência pedagógica rica (player de lesson com seções navegáveis, exercícios interativos, speaking com IA, gravação de áudio, dashboard com progresso), mobile-first e com forte sensação de avanço visível. A UX é determinante para retenção — o aluno precisa sentir que está progredindo.

Requisitos específicos:
- Mobile-first com suporte a dark mode opcional.
- SEO razoável nas páginas públicas (landing, unidades, conteúdo gratuito).
- Renderização rápida do player de lesson.
- Boa integração com Supabase (Auth, Postgres, Storage, Realtime).
- Capacidade de server-render personalizada por aluno (progresso, trilha).
- Componentes acessíveis por padrão (teclado, leitor de tela) — público brasileiro pode incluir alunos com deficiência.

## Decisão

Adotamos **Next.js 15 (App Router) + TypeScript (strict) + Tailwind CSS + shadcn/ui + Radix primitives + Lucide icons**.

- **Next.js App Router** — Server Components por padrão, Client Components onde há interatividade (player, gravador, exercícios). Server Actions para mutações simples.
- **TypeScript em modo strict** — tipagem forte em todo o código, incluindo tipos gerados do Postgres via `supabase gen types typescript`.
- **Tailwind CSS** — utility-first, alinha o time em um único vocabulário visual, reduz CSS morto, integra nativamente com shadcn.
- **shadcn/ui** — componentes copiados para o repo (não dependência npm de componentes), customizáveis, acessíveis via Radix.
- **Radix Primitives** — base acessível para dropdowns, diálogos, tooltips, tabs — essencial para o player de lesson.
- **Lucide** — iconografia consistente.
- **React Hook Form + Zod** — formulários tipados (onboarding, auth, perfil, self-assessment).

## Alternativas consideradas

- **Remix / React Router v7** — ótima ergonomia, mas menor maturidade do ecossistema comparado ao Next.js, especialmente em Vercel + Supabase.
- **Vite + React SPA puro** — simpler stack, mas perdemos SSR/SSG das páginas públicas e caching server-side do conteúdo. SEO e TTFB piores.
- **Expo / React Native primeiro** — a estratégia de produto pede **web mobile-first** antes de app nativo. Podemos converter partes para RN futuramente reaproveitando TypeScript e Supabase client; web-first ganha velocidade agora.
- **Chakra / MUI no lugar de Tailwind+shadcn** — bibliotecas maduras, mas acoplam tema e viram barreira para customização visual da marca. Tailwind dá mais controle ao custo de um pouco mais de disciplina.

## Consequências

### Positivas
- Server Components reduzem JS enviado ao cliente no player → pages mais leves no mobile.
- shadcn/ui dá componentes acessíveis sem adicionar dependência que precise ser atualizada.
- Tipos compartilhados entre frontend e schema do Supabase via geração automática.
- Ecossistema Next+Vercel é o caminho de menor atrito para deploy. Ver [ADR-013](013-hosting-e-deploy.md).

### Negativas / Custos aceitos
- App Router tem curva de aprendizado (Server vs Client, cache, streaming). Time precisa se alinhar nas convenções.
- Tailwind exige disciplina de design system para não virar CSS espalhado.

### Neutras / Impactos
- Estado e data fetching detalhados em [ADR-010](010-estado-frontend.md).
- Estrutura do repositório em [ADR-011](011-estrutura-do-repositorio.md).
- Testes em [ADR-014](014-estrategia-de-testes.md).

## Referências
- https://nextjs.org/docs/app
- https://ui.shadcn.com/
- https://tailwindcss.com/
