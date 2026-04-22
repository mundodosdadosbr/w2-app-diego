# Documentação — Plataforma de Ensino de Inglês

Este diretório contém a **base conceitual e arquitetural** da plataforma. É o ponto de partida antes de qualquer código.

Organização:

- [constitution.md](constitution.md) — **A lei suprema**. 10 princípios invioláveis + governança. Toda decisão (ADR, feature, prompt, código) deve respeitá-los.
- [adr/](adr/) — **Architecture Decision Records**. Decisões técnicas com contexto, opções consideradas e consequências. Imutáveis após aceitas (novas decisões superam antigas via `Supersedes`).
- [knowledge/](knowledge/) — **Conhecimento perene do domínio e do produto**. Metodologia pedagógica, regras de negócio, anatomia de lessons, personas de IA, glossário, etc. Documentos vivos — são atualizados conforme o produto evolui.
- [use-cases/](use-cases/) — **Casos de uso** ligando ator → objetivo → fluxo, amarrados a ADRs, Knowledges e princípios. Base para wireframes, testes e2e e telemetria.
- [mvp-backlog.md](mvp-backlog.md) — **Roadmap priorizado** em 5 milestones (M0 → M4), ~12 semanas, com épicos, stories, dependências, riscos e launch checklist.

## Como usar

- Antes de qualquer decisão → ler [constitution.md](constitution.md) e conferir se respeita os 10 princípios.
- Consultar uma decisão técnica → `adr/`
- Entender "o que é uma lesson", "como funciona o review", "qual o tom do tutor IA" → `knowledge/`
- Mapear um fluxo concreto (ex.: "como o aluno completa uma lesson") → `use-cases/`
- Saber o que construir próximo → [mvp-backlog.md](mvp-backlog.md)
- Índices:
  - [adr/README.md](adr/README.md)
  - [knowledge/README.md](knowledge/README.md)
  - [use-cases/README.md](use-cases/README.md)

## Princípios

Os princípios canônicos completos estão em [constitution.md](constitution.md). Em resumo:

1. **Pedagogia vence engenharia** — quando houver trade-off, escolhemos o que faz o aluno aprender melhor.
2. **Conteúdo 100% original** — apostila Wizard e demais obras são referência metodológica privada, nunca fonte de conteúdo. [ADR-009](adr/009-copyright-e-ip.md), [knowledge/14](knowledge/14-guardrails-copyright.md).
3. **Produção ativa** — toda lesson exige output, nunca só consumo.
4. **Erro gera revisão, não punição** — sem vidas, sem energias, sem shaming.
5. **Privacidade inegociável** — RLS em profundidade, retenção de 90d em gravações, consentimento explícito.
6. **Observável** — cada ação pedagógica é rastreável; IA gentil e explicável.
7. **American English** — único locale de conteúdo no MVP.
