---
name: Spaced Repetition
description: SRS com ciclos 1/3/7/14/30 dias, priorização, criação automática, UX de revisão
---

# 12 — Spaced Repetition

Núcleo operacional da retenção a longo prazo. Implementação em [ADR-006](../adr/006-spaced-repetition.md). Este documento descreve o comportamento externo — como o aluno percebe e como outras partes do sistema interagem.

## Ciclos ancorados

A SRS usa **5 stages** que o aluno enxerga:

| Stage | Intervalo alvo | Cor visual |
|---|---|---|
| `d1` | 1 dia | vermelho claro |
| `d3` | 3 dias | laranja |
| `d7` | 7 dias | amarelo |
| `d14` | 14 dias | verde claro |
| `d30` | 30 dias | azul |
| `mastered` | não volta mais | cinza |

Cada item tem `stage` + `ease_factor` (padrão 2.5) que modula o intervalo real (`interval_days = stage_anchor × ease_factor`, clamped ao próximo stage âncora em caso de passagem).

## Tipos de itens revisáveis

`reviews.item_type`:
- `vocab` — palavra solta do vocabulário.
- `phrase` — handy phrase.
- `grammar` — ponto gramatical.
- `chunk` — chunk de pronúncia problemático.

Qualquer item novo visto pelo aluno vira revisável (exceto conteúdo marcado `skip_srs = true`, raro).

## Criação automática

Detalhado em [08](08-regras-de-negocio.md). Resumo:

| Gatilho | Resultado |
|---|---|
| INPUT de item novo | `review` criado com `stage=d1, due_at=now+1d` |
| Erro em exercício (grade ≤ 2) | `review` puxado/criado para `due_at=now`, stage=d1, ease_factor -= 0.2 |
| Self-assessment "I can't yet" | Reviews da lesson-origem com `due_at=now` |
| Self-assessment "I'm not sure" | Reviews com `due_at=now+3d` |
| Speaking grade ≤ 2 | Review de grammar/phrase envolvido, `due_at=now` |

## Atualização após revisão

Quando aluno responde a um item devido, o sistema calcula `grade` 0-5 e atualiza:

- **grade ≥ 4** (fácil ou acertou direto):
  - Avança para próximo stage.
  - `interval_days` = stage anchor do novo stage.
  - `ease_factor += 0.1` (clamp 3.0).
  - Se `consecutive_passes ≥ 3` em `d30`, promove a `mastered`.
- **grade = 3** (acertou com esforço / dica):
  - Mantém stage.
  - `interval_days = stage_anchor × ease_factor`.
- **grade ≤ 2** (errou):
  - Volta um stage (d14 → d7, d30 → d14, d1 fica em d1).
  - `interval_days = 1`.
  - `ease_factor -= 0.2` (clamp 1.3).
- **grade = 0** (vazio/irrelevante): não conta; review permanece.

`consecutive_passes` incrementa em grade ≥ 4, zera em grade ≤ 2.

## Review Center (UX)

### Dashboard da fila
- Header: "Revisões para hoje: N".
- Breakdown por stage com cor (d1: 5, d3: 8, d7: 3…).
- Botão grande "Start review".

### Sessão de revisão
- Itens apresentados um por vez.
- Formato adaptado ao tipo:
  - `vocab`: múltipla escolha (EN → pt-BR ou vice-versa) + áudio + opção de pronunciar.
  - `phrase`: completar lacuna com chunk certo + ouvir + dizer.
  - `grammar`: mini-drill (ordenar/transformar) + 2 exemplos.
  - `chunk`: Pronunciation attempt.
- Feedback instantâneo após cada item.
- Sessão ideal: 10-20 itens (3-5 min). Aluno pode parar a qualquer momento (progresso salvo).

### Pós-sessão
- Resumo: acertos, itens avançados de stage, tempo total.
- Celebração proporcional.
- Próxima revisão sugerida.

## Priorização

A fila é ordenada por:
1. `stage` ascendente (d1 primeiro — mais frágil).
2. `last_grade` ascendente (itens com histórico de erro primeiro).
3. `due_at` ascendente (mais atrasados primeiro).

Limite diário padrão: **20 itens**. Configurável até 50.

## Estratégia por nível

- **A0/A1**: prioriza vocab + phrase. Grammar entra com moderação (mini-drills simples).
- **A2+**: aumenta proporção de grammar e chunks.
- **B1+** (pós-MVP): incluir `collocation` e `register` como tipos novos.

## Integração com outras partes

- **Lesson**: Recap da lesson reutiliza 1-2 items devidos do histórico (repetição cumulativa implícita).
- **Speaking Practice**: tutor IA recebe lista de items frágeis no contexto e tenta incluir em conversa.
- **Estudar hoje**: planner inclui revisões devidas como primeiro bloco do dia.
- **Recomendador de revisão** (AI persona): pode ajustar stages em massa após self-assessment. Ver [10](10-ai-personas-e-prompts.md).

## Métricas de sucesso da SRS

- **Taxa de retenção aos 30 dias**: aluno acerta ≥ 70% de itens que viu há 30 dias na primeira tentativa.
- **Conversão d1 → d3**: ≥ 80% dos itens d1 passam na 2ª exposição.
- **Tamanho médio da fila**: ≤ 40 itens devidos em média (se crescer indefinidamente, revisões estão caindo atrasadas).
- **Taxa de "mastered"**: aumentar com o tempo; meta 20% dos itens mastered após 90 dias de uso ativo.

Se a curva de retenção é baixa, ajustar parâmetros (ease factor inicial, pesos dos grades).

## O que evitar

- **Apresentar 100 itens num dia** — frustra e reduz qualidade de resposta. Limite 50.
- **Review sem áudio** — perde prática sonora. TTS sempre disponível em vocab/phrase.
- **Mesmo item 2× no mesmo dia** — considerar "mesmo item" via último `reviewed_at`; skip se < 6h.
- **Forçar review para concluir lesson** — review é **sempre** opcional como atividade separada. Não-bloqueante.

## Referências
- [ADR-006](../adr/006-spaced-repetition.md)
- [07 — Modelo de domínio](07-modelo-de-dominio.md)
- [08 — Regras de negócio](08-regras-de-negocio.md)
- [10 — AI personas](10-ai-personas-e-prompts.md)
