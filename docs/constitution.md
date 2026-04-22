# Constitution — W2 App

> A "lei suprema" do projeto. Quando qualquer ADR, decisão de produto, prompt de IA, feature ou código entrar em conflito com um princípio aqui, **o princípio vence**. Se o conflito for inescapável, o princípio é revisto **antes** de prosseguir — nunca contornado em silêncio.

## Preâmbulo

Construímos uma plataforma para que **brasileiros aprendam a falar inglês no dia a dia**. Não para acumular pontos, não para completar tarefas, não para "engajar" por engajar. A cada decisão, perguntamos: **isso faz o aluno falar melhor?** Se a resposta é não, não fazemos.

Esta constitution é curta de propósito. Cada princípio é absoluto, escrito em linguagem de regra (`must`, `never`, `always`). A interpretação em casos cinzentos é responsabilidade do time, mas a regra em si não é negociada ad-hoc.

---

## Os 10 princípios

### P1 — A pedagogia vence a engenharia

**Regra:** quando houver tensão entre "mais fácil de construir" e "melhor para o aluno aprender", escolhemos a segunda. Sempre.

**Como aplicamos:**
- ADRs justificam trade-offs com evidência pedagógica, não apenas técnica.
- Em review de PR, "facilidade de implementação" não é argumento suficiente para degradar uma experiência de aprendizagem.

**Precedentes:** [ADR-005](adr/005-tts-stt.md) (mantivemos ElevenLabs sobre Polly por prosódia), [ADR-016](adr/016-stt-amazon-transcribe.md) (Transcribe sobre Whisper por conservadorismo), [knowledge/02](knowledge/02-metodologia-pedagogica.md).

---

### P2 — Conteúdo 100% original

**Regra:** **nunca** reproduzir, extrair, baixar, raspar ou derivar de perto conteúdo de apostilas publicadas, portais de cursos ou materiais de terceiros — incluindo Wizard/Pearson (Wiz.me, Wiz.pen), Cambridge, Oxford, English File, Interchange. Metodologia é inspiração; conteúdo é nosso.

**Como aplicamos:**
- Cláusula explícita em todos os prompts de IA ([knowledge/10](knowledge/10-ai-personas-e-prompts.md)).
- Checklist de copyright obrigatório em cada PR de conteúdo ([knowledge/14](knowledge/14-guardrails-copyright.md)).
- Review humana de qualquer output de IA antes de `published`.
- Nomes internos divergem das marcas da apostila (Pinpoint → Recap, etc.).

**Precedentes:** [ADR-009](adr/009-copyright-e-ip.md), [knowledge/14](knowledge/14-guardrails-copyright.md).

---

### P3 — Produção ativa sobre consumo passivo

**Regra:** toda lesson exige produção do aluno (fala, escrita, escolha). Não existe lesson de só ler/ouvir. ≥ 40% do tempo da lesson é OUTPUT.

**Como aplicamos:**
- Seções OUTPUT são obrigatórias em `lesson_sections` ([knowledge/04](knowledge/04-anatomia-da-lesson.md)).
- Critério de conclusão exige `avg_grade ≥ 3.0` em exercícios de OUTPUT ([knowledge/08](knowledge/08-regras-de-negocio.md)).
- North Star do produto é **minutos de output ativo por aluno/semana** ([knowledge/01](knowledge/01-visao-do-produto.md)), não "minutos no app".

---

### P4 — Erro gera revisão, nunca punição

**Regra:** errar um exercício **jamais** custa ao aluno — não há vidas, energias, bloqueios ou shaming. Erro simplesmente puxa o item para a fila de revisão.

**Como aplicamos:**
- `grade ≤ 2` cria/zera review em vez de bloquear avanço ([ADR-006](adr/006-spaced-repetition.md), [knowledge/08](knowledge/08-regras-de-negocio.md)).
- Máximo 3 tentativas mostra a resposta correta + explicação; nunca "game over".
- Linguagem de UI é encorajadora ("Let's try again" > "Wrong").

---

### P5 — Privacidade do aluno é inegociável

**Regra:** RLS é a defesa primária, não a última. Gravações do aluno expiram em 90 dias por padrão. Admin lê dados do aluno apenas com log em `audit_log`. Consentimento explícito para qualquer tratamento além do pedagógico básico.

**Como aplicamos:**
- RLS habilitada em **toda** tabela, com teste pgTAP obrigatório ([ADR-003](adr/003-rls-e-autorizacao.md), [ADR-014](adr/014-estrategia-de-testes.md)).
- Job `purge_expired_recordings` diário ([ADR-013](adr/013-hosting-e-deploy.md)).
- Exclusão de conta remove PII em ≤ 7 dias ([knowledge/08](knowledge/08-regras-de-negocio.md)).
- Chaves de provedor (AWS, ElevenLabs, Anthropic) **nunca** no frontend — só em Edge Functions ([ADR-019](adr/019-aws-auth.md)).

---

### P6 — O aluno entende tudo o que acontece

**Regra:** toda decisão do sistema que afete o aluno é **explicável**. "Este item voltou porque você errou há 2 dias". "Sua lesson foi concluída porque atingiu 3.2 de média." Nada de caixa-preta.

**Como aplicamos:**
- UI mostra razão de cada item em revisão, cada recomendação, cada marco atingido.
- Prompts da IA instruem explicação em pt-BR quando o aluno pergunta ([knowledge/10](knowledge/10-ai-personas-e-prompts.md)).
- `points_ledger` expõe origem de cada ponto.

---

### P7 — Evolução mensurável em habilidades, não só pontos

**Regra:** pontos são cosméticos. O que importa são **skill checkpoints** — competências comunicativas reais destravadas ("I can order food", "I can schedule an appointment"). Um aluno que acumulou pontos sem destravar skills não evoluiu.

**Como aplicamos:**
- `skill_checkpoints` é eixo primário de progresso ([knowledge/07](knowledge/07-modelo-de-dominio.md), [knowledge/09](knowledge/09-gamificacao-e-progresso.md)).
- Self-assessment alimenta checkpoints.
- Ranking pessoal de habilidades (radar) é destaque no perfil, pontos é subtítulo.

---

### P8 — IA gentil e nunca enganosa

**Regra:** tutor IA reconhece a intenção correta do aluno antes de corrigir; nunca constrange; nunca afirma que o aluno "errou" quando na verdade foi o STT que falhou; nunca inventa feedback que não tem certeza.

**Como aplicamos:**
- System prompts de todas as personas explicitam tom gentil ([knowledge/10](knowledge/10-ai-personas-e-prompts.md)).
- Pronunciation scoring com baixa confidence gera "não conseguimos ouvir bem, grava de novo?" em vez de "errado" ([ADR-007](adr/007-pronunciation-scoring.md), [knowledge/11](knowledge/11-pronunciation-coach.md)).
- Evals automatizados com rubrica "correção gentil" bloqueiam deploys de prompt com degradação ≥ 5% ([ADR-014](adr/014-estrategia-de-testes.md)).

---

### P9 — IA nunca ultrapassa o nível do aluno

**Regra:** a IA nunca usa vocabulário ou estruturas que o aluno ainda não viu — nem mesmo se a resposta ficaria "mais natural". A naturalidade idiomática é sacrificada para **o aluno produzir dentro do que ele conhece**.

**Como aplicamos:**
- System prompts recebem `ALLOWED_LIST` explícita por nível + lesson ([knowledge/10](knowledge/10-ai-personas-e-prompts.md)).
- Evals verificam aderência ao nível; violações bloqueiam merge.
- Se uma resposta pedagógica exige algo além do nível, a IA avisa: "isso é um pouco avançado — por agora, vamos com X".

---

### P10 — Um foco, um locale: American English

**Regra:** no MVP, **todo** conteúdo de estudo é **en-US**. Vozes, spelling, vocabulário, STT, prompts de correção — tudo calibrado para American English. Não tentamos ensinar en-GB, en-AU ou neutro. Foco sobre cobertura.

**Como aplicamos:**
- Transcribe fixado em `en-US` ([ADR-016](adr/016-stt-amazon-transcribe.md)).
- TTS só com vozes en-US ([ADR-015](adr/015-i18n.md)).
- Spelling americano em todo seed (color, center, organize…).
- Personas IA preferem vocabulário americano em divergências ([knowledge/10](knowledge/10-ai-personas-e-prompts.md)).

---

## Governança

### Como esta constitution muda

Alterar um princípio **exige**:
1. Proposta escrita em PR com:
   - Qual princípio está sendo alterado/removido/adicionado.
   - Justificativa pedagógica (não só técnica).
   - Quais ADRs e knowledges precisam ser reescritos como consequência.
2. Revisão e aprovação explícita do dono do produto (Diego, no MVP).
3. Versão antiga preservada em `docs/constitution-history/` com data e motivo.

Mudanças não podem ser feitas de surpresa em um PR que "também faz outras coisas".

### Prioridade em conflitos

Se dois princípios conflitarem em um caso concreto (raro), a ordem de precedência é:
`P5 (privacidade) > P2 (copyright) > P1 (pedagogia) > demais`.
Segurança e legalidade nunca são sacrificadas por pedagogia.

### Status dos princípios

| # | Princípio | Última revisão |
|---|---|---|
| P1 | Pedagogia vence engenharia | 2026-04-21 |
| P2 | Conteúdo 100% original | 2026-04-21 |
| P3 | Produção ativa sobre consumo passivo | 2026-04-21 |
| P4 | Erro gera revisão, nunca punição | 2026-04-21 |
| P5 | Privacidade do aluno é inegociável | 2026-04-21 |
| P6 | O aluno entende tudo | 2026-04-21 |
| P7 | Evolução mensurável em habilidades | 2026-04-21 |
| P8 | IA gentil e nunca enganosa | 2026-04-21 |
| P9 | IA nunca ultrapassa o nível | 2026-04-21 |
| P10 | Foco em American English | 2026-04-21 |

---

## Como ler este documento

- Antes de propor um ADR novo: confirme que ele respeita todos os 10 princípios.
- Antes de revisar um PR de conteúdo: P2, P3, P9, P10.
- Antes de revisar um PR de UX: P1, P4, P6, P7.
- Antes de revisar um PR de IA (prompt, eval, model swap): P8, P9.
- Antes de revisar um PR de backend: P5, P6.

Quando algo aqui virar obsoleto pela evolução do produto, **revise antes de ignorar**.
