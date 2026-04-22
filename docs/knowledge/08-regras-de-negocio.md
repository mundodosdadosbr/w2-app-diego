---
name: Regras de Negócio
description: Critérios de conclusão, desbloqueio, recomendação de revisão, retenção de dados
---

# 08 — Regras de Negócio

Regras que governam o comportamento da plataforma. São **invariantes** — implementadas idealmente no banco (functions, triggers, constraints) quando possível.

## Conclusão

### Lesson concluída
Uma lesson é marcada como `completed` quando **todas** as condições abaixo são verdadeiras:
1. Todas as **seções obrigatórias** foram visitadas (checkmark em `sections_completed`). Ver [04](04-anatomia-da-lesson.md) para obrigatoriedade.
2. O OUTPUT tem **pelo menos 60% de acertos médios** nos exercícios com grade (`avg_grade ≥ 3.0` numa escala 0-5).
3. A seção **Recap** foi completada.

Se (2) não é atingido, a lesson fica `in_progress` e o sistema recomenda o refazer específico dos exercícios falhos.

### Unit concluída
`status = 'completed'` quando:
1. Todas as lessons obrigatórias da unit estão `completed`.
2. O **Self-assessment da unit** foi submetido.

Self-assessment com muitos "I can't yet" não impede a conclusão, mas **desbloqueia recomendações agressivas de reforço**.

### Skill checkpoint
Um `skill_checkpoints` é criado quando o aluno:
- Concluiu todas as unidades que cobrem aquele skill **E**
- Marcou "I can" ≥ 75% dos objetivos relacionados ao skill em self-assessment **E**
- Teve ≥ 2 speaking sessions bem-sucedidas (grade média ≥ 3.5) envolvendo o skill.

## Desbloqueio

### Modelo padrão (trilha guiada)
- Aluno começa na Unit 01, Lesson 01.
- Próxima lesson destrava quando anterior está `completed`.
- Próxima unit destrava quando anterior está `completed`.
- **Revisões estão sempre disponíveis** (não exigem destravar nada).

### Modo aberto
Aluno pode ativar nas configurações "explorar livremente":
- Todas as units `published` ficam acessíveis.
- Lessons dentro de uma unit ainda precisam ser consumidas em ordem (porque dependem uma da outra).
- Ao ativar, alerta: "Sem a trilha, você pode encontrar conteúdo mais difícil que o esperado".

### Teste de nível (onboarding)
Aluno com bom desempenho pode pular até **2 unidades** no início. Regra:
- Teste de nível (5-8 perguntas) calibra entre A0, A1, A2.
- A0 → começa Unit 01.
- A1 → pode pular Unit 01 (mantendo 02 como início).
- A2 → pode pular até Unit 02 ou 03 dependendo do score.
- O aluno sempre escolhe — a recomendação é sugestão, não imposição.

## Recomendação de revisão

### Criação automática de reviews
Uma linha em `reviews` é criada/atualizada nas seguintes situações:

| Gatilho | Ação |
|---|---|
| Primeira exposição de item novo em INPUT | Cria `review (stage=d1, due_at=now+1d)` |
| Erro em qualquer exercício envolvendo o item | Se review não existe, cria com `stage=d1, due_at=now`. Se existe, puxa `due_at` para "hoje" e reseta `ease_factor -= 0.2` (clamp 1.3). |
| Self-assessment "I can't yet" em objetivo | Cria reviews dos vocab/phrases/grammar da lesson-origem, `due_at=now` |
| Self-assessment "I'm not sure" | Cria reviews com `due_at = now + 3 days` |
| Speaking session com grade ≤ 2 em tópico | Cria review para gramática/phrase envolvidos, `due_at=now` |

### Priorização da fila
Review Center ordena itens `due_at ≤ now` por:
1. `stage` crescente (d1 primeiro).
2. Itens com `last_grade ≤ 2` primeiro.
3. `due_at` mais antigo.

Limite diário padrão: 20 itens. Aluno pode aumentar em configurações até 50.

### Pós-review
Após tentativa, atualizar `reviews` via SM-2 simplificado. Ver [ADR-006](../adr/006-spaced-repetition.md) e [12](12-spaced-repetition.md).

## Streak e pontos

### Streak
- Streak é o número de **dias consecutivos** com **pelo menos 1 atividade qualificante**.
- Atividade qualificante: concluir uma lesson, concluir uma sessão de revisão (≥ 5 itens), ou uma speaking session (≥ 3 turnos).
- "Dia" segue o timezone do aluno (`profiles.timezone`).
- Job `refresh_streaks()` às 00:05 local verifica e atualiza `streak_current` (zera se ontem não teve atividade).
- **Streak freeze**: aluno com streak ≥ 7 ganha 1 "freeze" por semana — permite pular 1 dia sem perder o streak. Max 2 acumulados.

### Pontos
- Exercício acertado: 10 pts (grade 5); 5 pts (grade 3-4); 0 pts (grade < 3).
- Lesson concluída: +50 pts.
- Unit concluída: +200 pts.
- Speaking session completa (≥ 3 turnos): +20 pts.
- Pronunciation score ≥ 80: +15 pts.
- Revisão feita: +5 pts por item correto.
- Streak milestones: +100 pts em 7 dias, +500 em 30.
- Pontos não expiram; alimentam ranking pessoal de habilidades.

### Níveis de gamificação
Níveis internos (não confundir com CEFR):
- **Starter** (0-500 pts)
- **Learner** (501-2000)
- **Explorer** (2001-5000)
- **Speaker** (5001-10000)
- **Pro** (10001+)

São visuais, não destravam conteúdo.

## Retenção e privacidade

### Gravações do aluno
- Áudios de pronúncia e speaking: **90 dias** em Storage, depois deletados por job `purge_expired_recordings()`.
- Aluno pode optar em configurações por **"manter meu histórico"** → retenção indefinida (com aviso explícito).
- Ao excluir conta, todas as gravações são removidas imediatamente.

### Transcrições
- Texto (resultado de STT) fica em `speaking_turns` e `pronunciation_attempts` indefinidamente (é texto, de baixa sensibilidade, útil para análise de progresso).

### Exclusão de conta
- Soft delete do `profiles` → anonimiza `display_name`, `email` (via Supabase Auth), remove gravações.
- Dados agregados de uso ficam para análise (sem PII).
- Prazo: efetivação em até 7 dias. Janela de cancelamento de 48h.

### LGPD
- Consentimento explícito para analytics ([ADR-012](../adr/012-observabilidade-e-analytics.md)).
- Exportação de dados: endpoint `/api/account/export` gera zip JSON.

## Adaptação ao desempenho

### Ajuste de dificuldade em curso
- Se aluno acerta 90%+ em drills de uma lesson, próxima drill pode oferecer variantes mais difíceis (marcadas no payload).
- Se aluno tem < 40% em uma lesson, sistema oferece **revisão antecipada** antes de prosseguir.

### Modo "estudar hoje"
Planner gera trilha diária sugerida, alvo de 15-20 min:
1. Revisões devidas (até 10 min).
2. Continuação da lesson atual (ou próxima lesson).
3. Bônus de speaking (2-3 min) se resta tempo na meta.

Nunca força — é **sugestão**.

## Limites e throttling

- Speaking session: max 20 turnos por sessão (evita loop infinito de tokens IA).
- Pronunciation attempts: max 5 tentativas consecutivas na mesma frase (para evitar frustração/ciclo).
- LLM requests por aluno/minuto: 10 (throttle no cliente + server).
- Cadastros de um mesmo IP: 3 por hora (anti-abuse).

## Referências
- [ADR-003](../adr/003-rls-e-autorizacao.md)
- [ADR-006](../adr/006-spaced-repetition.md)
- [ADR-012](../adr/012-observabilidade-e-analytics.md)
- [09 — Gamificação](09-gamificacao-e-progresso.md)
- [12 — Spaced repetition](12-spaced-repetition.md)
