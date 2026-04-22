---
name: Gamificação e Progresso
description: Streak, pontos, níveis, ranking de habilidades — princípios e regras visuais
---

# 09 — Gamificação e Progresso

Gamificação aqui é **serva da pedagogia** — recompensa produção, não consumo passivo. Evitamos a armadilha clássica de "cliques = pontos".

## Princípios

1. **Pontue o que importa** — produção oral, acertos com esforço, streak, revisão. Não pontue só "completar tarefas".
2. **Celebre evolução observável** — habilidade destravada pesa mais que pontos cumulativos.
3. **Zero punição** — nunca remover pontos, nunca "game over". Apenas streaks podem zerar.
4. **Sem FOMO tóxico** — nenhuma mecânica que exija logar "senão perde X" exceto streak (com freeze).
5. **Transparência** — aluno vê exatamente de onde cada ponto/marco veio.

## Elementos

### Streak
- Cadeia de dias consecutivos com atividade qualificante.
- Atividade qualificante: concluir lesson OU sessão de ≥ 5 reviews OU speaking session de ≥ 3 turnos.
- **Streak Freeze**: ganha 1 por semana quando streak ≥ 7; max 2 acumulados; consome automaticamente para cobrir dia parado.
- Milestones: 3, 7, 14, 30, 60, 100, 365 dias — com notificação + pontos.
- Visual: chama no header com número + ícone.

### Pontos
Tabela explícita em [08 — regras](08-regras-de-negocio.md). Resumo:
- Acerto em exercício: 0-10 pts (por grade).
- Lesson completa: +50.
- Unit completa: +200.
- Speaking ≥ 3 turnos: +20.
- Pronunciation score ≥ 80: +15.
- Revisão por item correto: +5.
- Milestones de streak: +100 / +500.

Pontos não expiram, não destravam conteúdo, servem de referência cumulativa.

### Níveis de gamificação
5 níveis visuais (Starter → Pro). Transparência: tabela em `/profile` mostra "faltam X pts para Y". Sem consequências práticas além de badge.

### Habilidades dominadas (skill checkpoints)
**Principal eixo de evolução mensurável**. Cada checkpoint representa capacidade comunicativa real:
- "Order food in English"
- "Ask for directions"
- "Introduce yourself"
- "Schedule an appointment"

Criado quando condições em [08](08-regras-de-negocio.md) são atingidas. Visual: grid de skills com ✓, progresso parcial, ou trancado.

### Conquistas (badges)
- **Primeira lesson** concluída.
- **7-day streak**.
- **30-day streak**.
- **Polyglot moment** — usou 3 unidades em uma semana.
- **Pronunciation star** — 10 pronunciations com score ≥ 85.
- **Conversation starter** — 10 speaking sessions completas.
- **Review champion** — 100 items revisados.
- **Full first unit** — todos os "I can" marcados ✓ em uma unit.

Badges não dão pontos — são tokens simbólicos. Aparecem no perfil.

### Metas semanais
- Aluno define meta semanal em minutos (padrão 60, sugestões 30 / 60 / 120 / 180).
- Progresso visual no dashboard (anel circular).
- Ao bater a meta: celebração + +50 pts + push notification (opt-in).
- Não bater não dá punição. Sistema pode sugerir reduzir se aluno está consistentemente abaixo.

### Desafios de speaking
- 1 por semana, opcional: "Pedir café em um diálogo de 4 turnos".
- Completar = +30 pts + badge semanal.
- Opt-in; aluno pode desativar.

### Ranking pessoal de habilidades
Gráfico radar com dimensões: **Vocabulary, Grammar, Listening, Speaking, Pronunciation, Conversation**.
- Atualizado diariamente com base em médias móveis dos últimos 14 dias.
- Dá sensação de "onde estou forte / onde preciso reforçar".
- Click numa dimensão → lista de lessons/reviews que reforçam aquela área.

## Princípios visuais (UX da gamificação)

- **Barra de progresso** no topo do player de lesson (passa por 13 marcos = seções).
- **Anéis** no dashboard: streak, meta semanal, revisões do dia.
- **Micro-celebrações** — animações de 0.5-1s ao acertar exercício, concluir lesson, bater meta.
- **Confetti** só em marcos grandes (unit completa, streak 7+, checkpoint de skill).
- **Sons** opt-in. Padrão off para evitar constrangimento em ambientes públicos.
- **Dark mode** opcional (ver [13](13-ux-principios.md)).

## O que evitar

- **Vidas/energias** tipo Duolingo — punem tentativa. Contra nossa pedagogia ("errar gera review, não game over").
- **Ranking público / leaderboard social** no MVP — gera ansiedade. Ranking pessoal só.
- **Compra de streak** — pago desvirtua. Freeze é grátis.
- **Badges inflacionadas** (uma por exercício) — perde significado.

## Analytics a monitorar

- **Taxa de desbloqueio de skill checkpoint** por semana.
- **Distribuição de streak** (quantos no 1, 3, 7, 14, 30+).
- **Meta semanal ajuste** — aluno aumentou ou diminuiu?
- **Engajamento pós-celebração** — aluno continua jogando ou fecha app?

Ver [ADR-012](../adr/012-observabilidade-e-analytics.md).

## Referências
- [01 — Visão](01-visao-do-produto.md)
- [08 — Regras de negócio](08-regras-de-negocio.md)
- [13 — UX princípios](13-ux-principios.md)
