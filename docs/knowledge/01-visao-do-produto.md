---
name: Visão do Produto
description: PRD resumido da plataforma — proposta de valor, público-alvo, diferenciais, métricas de sucesso
---

# 01 — Visão do Produto

## One-liner
Plataforma digital de ensino de inglês que transforma uma metodologia pedagógica estruturada em uma experiência interativa, progressiva e prática, com foco em **conversação funcional para o dia a dia**.

## Problema
Brasileiros iniciantes (e iniciantes avançando para básico/intermediário) precisam de um caminho claro, guiado e **prático** para falar inglês em situações reais — pedir em restaurantes, tirar dúvidas em consulta médica, comprar, perguntar direção, conversar no trabalho. Apps populares (Duolingo, Busuu) têm boa gamificação mas pouca prática conversacional real; aulas particulares são caras e pouco flexíveis; métodos em vídeo são passivos.

## Proposta de valor
1. **Trilha de aprendizagem clara** — o aluno sempre sabe o que vai conseguir fazer ao final de cada bloco ("I can order food at a restaurant").
2. **Ciclo pedagógico validado**: INPUT → OUTPUT → REVIEW em cada lesson, com microaprendizado.
3. **Prática conversacional com IA** — não um chatbot genérico; um speaking partner que respeita o nível do aluno e corrige com gentileza.
4. **Pronunciation Coach** — feedback imediato por palavra, com prática por chunks.
5. **Revisão espaçada automática** — o que o aluno errou volta; o que dominou espaça.
6. **Conteúdo relevante para o brasileiro** — contextos locais de 2026, não cenários descolados.
7. **Evolução mensurável** — checklist "I can", skills ranking, relatório de progresso.

## Público-alvo (MVP)
- **Primário**: brasileiros adultos (18-45), escolaridade média/alta, nível A0-A2 em inglês, motivados por trabalho/viagem/estudo.
- **Secundário**: ex-alunos de cursos que querem revisar/manter o inglês sem voltar à sala.
- **Fora do escopo do MVP**: crianças, nível C1+, preparação para proficiência (TOEFL, IELTS) — possível expansão.

## Jornada do aluno (resumo)
1. **Onboarding** com teste de nível curto (5 min) → level inicial (A0, A1, A2).
2. **Dashboard** mostra trilha, unidade atual, pendências de revisão, streak.
3. **Estudar hoje**: lesson pronta + revisões do dia, estimados em 15-20 min.
4. **Player de lesson**: INPUT (novas palavras/frases/gramática) → Contexto (In context) → Drill → OUTPUT (speaking) → Pronunciation → Recap → Self-assessment.
5. **Review Center**: fila de itens devidos; exercícios curtos cumulativos.
6. **Speaking Practice**: chat com IA em modo "resposta curta" ou "conversa livre".
7. **Relatório semanal**: o que aprendeu, o que precisa reforçar, próxima meta.

## Diferenciais
- Modo "estudar hoje" com trilha diária pronta.
- Metas semanais personalizáveis.
- Desafios de speaking (ex.: pedir um café, fingir entrevista).
- Ranking pessoal de habilidades comunicativas.
- Modo "só conversação" e "só revisão".
- Tradução de apoio **opcional**, nunca dominante.

## Métricas de sucesso (North Star + apoio)
- **North Star**: **minutos de output ativo por aluno / semana** (produção oral + frases escritas). Mede se o aluno está de fato praticando, não só consumindo.
- **D1 retention**: ≥ 45%.
- **W4 retention** (matou o hábito): ≥ 25%.
- **Lesson completion rate**: ≥ 70% das lessons iniciadas concluídas.
- **Streak de 7 dias** atingido por ≥ 30% dos cadastros.
- **Self-assessment positivo** ("I can") em ≥ 75% dos itens ao final de cada unit.
- **Custo IA por aluno ativo/mês** ≤ US$ 1 (ver [ADR-004](../adr/004-provedor-ia.md)).

## Anti-metas
Evitar otimizar só:
- Tempo no app (vamos medir qualidade do uso, não tempo cru).
- Taxa de acerto alta artificial (se 95% acerta tudo, é fácil demais).
- Volume de "lições concluídas" sem produção oral (passividade disfarçada).

## Stakeholders
- **Aluno** — foco principal.
- **Autor pedagógico** — cria units/lessons.
- **Reviewer** — aprova conteúdo.
- **Admin** — opera, monitora.
- Futuro: **professor/turma** (modo B2B pós-MVP).

## Escopo do MVP (o que entrega)
- 2 unidades completas (seed) + infraestrutura para criar as próximas 8.
- Player de lesson com as 10 seções definidas em [04](04-anatomia-da-lesson.md).
- ~12 tipos de exercício em [05](05-catalogo-de-exercicios.md).
- Speaking Practice com tutor IA (Claude).
- Pronunciation Coach com WER scoring.
- Review Center com SRS ancorado em 1/3/7/14/30 dias.
- Dashboard com progresso, streak, pontos.
- Auth (email/senha + magic link).
- Admin básico para authors/reviewers.

## Fora do escopo do MVP
- App nativo iOS/Android.
- Ranking social / turmas / multiplayer.
- Preparação para provas.
- Pagamentos e assinaturas (decidir modelo só após PMF).
- Certificado gerado.
- i18n da UI para outros idiomas (ver [ADR-015](../adr/015-i18n.md)).

## Referências
- Prompt original: `prompot-sistema.txt`.
- Metodologia inspiradora: apostila Wizard W2 (ver [14-guardrails-copyright.md](14-guardrails-copyright.md) sobre limites).
- CEFR: https://www.coe.int/en/web/common-european-framework-reference-languages
