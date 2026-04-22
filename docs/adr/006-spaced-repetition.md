# ADR-006: Algoritmo de revisão espaçada — SM-2 simplificado

- **Status**: Accepted
- **Data**: 2026-04-21
- **Tags**: pedagogia, backend, algoritmo

## Contexto

A apostila usa revisão cumulativa (Pinpoints ao final de cada bloco de lições). Queremos ir além: **revisão espaçada automática**, personalizada por desempenho, cobrindo vocabulário, frases úteis, estruturas gramaticais e padrões de pronúncia.

O prompt do sistema pede ciclos fixos: **1, 3, 7, 14, 30 dias**.

Precisamos escolher um algoritmo que:
- Respeite a pedagogia (revisão mais cedo quando o aluno errou).
- Seja explicável (aluno entende "por que isso voltou hoje").
- Seja simples de implementar, testar e ajustar.
- Não exija biblioteca pesada no cliente.

## Decisão

Adotamos **SM-2 simplificado com ciclos ancorados 1/3/7/14/30 dias**, com ajuste por desempenho.

### Modelo
Cada item revisável (vocab, frase, padrão gramatical, chunk de pronúncia) tem uma linha em `reviews`:
- `user_id`, `item_type`, `item_id`
- `interval_days` — próximo intervalo (inicial: 1)
- `ease_factor` — multiplicador (inicial: 2.5, limites [1.3, 3.0])
- `due_at` — quando aparece para revisar
- `stage` — enum ancorado: `d1`, `d3`, `d7`, `d14`, `d30`, `mastered`
- `last_grade` — 0-5 (qualidade da última resposta)

### Regra de atualização
Após cada tentativa, `grade` ∈ 0–5 é calculada a partir do exercício (acertou de primeira = 5; acertou com dica = 3; errou = 1-2 dependendo da distância).

- **grade ≥ 4**: avança para próximo stage; `interval_days` pula para o valor ancorado do novo stage; `ease_factor += 0.1` (clamp).
- **grade = 3**: mantém stage; `interval_days` recalculado como `stage_anchor × ease_factor`.
- **grade ≤ 2**: volta um stage (mínimo `d1`); `interval_days = 1`; `ease_factor -= 0.2` (clamp).
- Atinge `d30` com grade ≥ 4 três vezes seguidas → `mastered` (some da fila de revisão, mas ainda pode ser reexposto em Pinpoints).

### Criação de reviews
- Quando o aluno **vê pela primeira vez** um item no INPUT da lesson, cria `review` com `stage = d1`, `due_at = now + 1 day`.
- Quando o aluno **erra** um item em qualquer exercício, cria ou atualiza `review` puxando `due_at` para "hoje" se ainda não existe, ou zerando intervalo se já existe.

### Sessão de revisão
- **Review Center** lista itens com `due_at ≤ now` ordenados por: (1) stage (mais baixo primeiro), (2) erros recentes, (3) `due_at` mais antigo.
- Limite diário adaptativo: padrão 20 itens; aluno pode aumentar nas configurações.

## Alternativas consideradas

- **SM-2 puro (Anki clássico)** — funciona, mas o aluno não tem referência clara de "estou no dia 3". Nossa ancoragem 1/3/7/14/30 cria narrativa de progresso alinhada com o prompt do produto.
- **FSRS (algoritmo moderno do Anki)** — mais preciso, mas exige base grande de dados e dificulta explicar ao aluno. Candidato a pós-MVP quando tivermos dados suficientes.
- **Leitner físico** (5 caixas) — simples, mas rígido; não ajusta por dificuldade real.
- **Só intervalos fixos sem ease factor** — viola "adapta ao desempenho do aluno" pedido no prompt.

## Consequências

### Positivas
- Ciclos 1/3/7/14/30 são os pedidos explicitamente pelo produto e viram "stage" visível ao aluno (gamificação natural).
- Implementação direta em SQL + uma Edge Function `schedule-review` idempotente.
- Explicável: "Errou? Volta pro dia 1. Acertou? Avança para o próximo stage."

### Negativas / Custos aceitos
- Não é o algoritmo estatisticamente ótimo. Aceitamos — simplicidade e explicabilidade ganham no MVP.
- Ajustes de parâmetros exigirão observabilidade (curva de retenção por stage). Ver [ADR-012](012-observabilidade-e-analytics.md).

### Neutras / Impactos
- Tabelas `reviews` e `exercise_attempts` detalhadas em [knowledge/07-modelo-de-dominio.md](../knowledge/07-modelo-de-dominio.md).
- Modelo completo da SRS e exemplos em [knowledge/12-spaced-repetition.md](../knowledge/12-spaced-repetition.md).
- Regras de negócio que criam reviews a partir de erros em [knowledge/08-regras-de-negocio.md](../knowledge/08-regras-de-negocio.md).

## Referências
- SM-2: https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-supermemo-method
- FSRS: https://github.com/open-spaced-repetition
