# UC-01 — Primeira entrada: cadastro, onboarding, teste de nível

- **Ator**: Aluno novo (não cadastrado)
- **Objetivo**: Entrar na plataforma, ter nível inicial calibrado e começar a primeira lesson
- **Prioridade MVP**: P0
- **Última revisão**: 2026-04-21

## Trigger
Aluno acessa a landing page e clica em "Começar de graça".

## Preconditions
- Nenhuma — este é o ponto de entrada do produto.
- Browser suporta Web Audio API (para poder fazer speaking/pronúncia depois).

## Main flow

1. Aluno clica em **"Começar de graça"** na landing.
2. Vê tela **cadastro**: email + senha (ou magic link).
3. Aceita explicitamente: termos de uso, privacidade, tratamento de gravações para fins pedagógicos.
4. Submete → Supabase Auth cria `auth.users`; trigger cria `profiles` com `role='student', cefr_level='a0', locale='pt-BR', timezone='America/Sao_Paulo'`.
5. Sistema envia email de verificação (ou login imediato com magic link).
6. Redirect para `/onboarding/welcome` — boas-vindas, explicação curta do método (3 cards de 1 slide).
7. Tela de **teste de nível** (5-8 perguntas): múltipla escolha + 1 ou 2 reproduções curtas de áudio (en-US) com pergunta. Tempo alvo: 3-5 min.
8. Sistema calcula CEFR inicial (`a0`, `a1` ou `a2`) a partir do score.
9. Tela de **recomendação de trilha**: "Recomendamos começar pela Unit 01" ou "Você demonstrou A1 — pode pular a Unit 01 e começar pela 02". Aluno confirma ou escolhe outra.
10. Tela de **meta semanal**: slider 30 / 60 / 120 / 180 min/semana, padrão 60.
11. Tela de **permissão de microfone** — solicita acesso (pode recusar; desabilita Pronunciation coach).
12. Redirect para `/dashboard`; marca `profiles.onboarded_at = now()`.
13. Dashboard mostra "Estudar hoje" com a primeira lesson destacada.

## Alternative flows

- **AF-1 — Email já cadastrado**: passo 4 retorna erro; UI oferece "entrar na sua conta" com link para `/login`.
- **AF-2 — Recusa permissão de microfone**: segue onboarding; sistema registra `settings.microphone_denied=true`; no player de lesson, seção Pronunciation aparece com CTA "habilitar microfone" em vez de gravador.
- **AF-3 — Sai no meio do teste de nível**: estado salvo em `localStorage` + retomada parcial por 24h. Se não retornar, padrão = `a0`.
- **AF-4 — Recusa termos**: não cria conta; volta para landing.
- **AF-5 — Falha de rede em submit**: retry local 1×; se falhar, toast "sem conexão" + retry manual.

## Postconditions

- Linha em `auth.users` + `profiles` criada.
- `profiles.cefr_level` calibrado.
- `profiles.onboarded_at` preenchido.
- `learning_path_progress` criado com `current_unit_id` e `current_lesson_id` apontando para a recomendação.
- `streaks` criado com `current_count=0`.
- Aluno em `/dashboard`, pronto para iniciar primeira lesson (UC-02).

## Telemetry

Eventos obrigatórios:
- `onboarding_started`
- `onboarding_step_viewed { step: 'welcome'|'level_test'|'path'|'goal'|'mic' }`
- `level_test_completed { level, score, duration_ms }`
- `onboarding_completed { level, recommended_unit_id, weekly_goal_minutes }`

Ver [ADR-012](../adr/012-observabilidade-e-analytics.md).

## References

- **Constitution**: P5 (privacidade — consentimento explícito), P6 (aluno entende — recomendação mostra motivo), P10 (en-US desde o teste).
- **ADRs**: [002](../adr/002-backend-supabase.md) (Auth), [003](../adr/003-rls-e-autorizacao.md), [015](../adr/015-i18n.md).
- **Knowledge**: [01](../knowledge/01-visao-do-produto.md), [06](../knowledge/06-curriculo-inicial.md), [08](../knowledge/08-regras-de-negocio.md) (teste de nível pode pular até 2 units).

## Telas envolvidas
- `/signup`, `/login`, `/onboarding/welcome`, `/onboarding/level-test`, `/onboarding/path`, `/onboarding/goal`, `/onboarding/microphone`, `/dashboard`.
