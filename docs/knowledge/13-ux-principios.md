---
name: UX Princípios
description: Mobile-first, feedback instantâneo, indicador INPUT/OUTPUT/REVIEW, dark mode, acessibilidade
---

# 13 — UX Princípios

UX aqui serve a dois fins: **reduzir atrito** para o aluno estudar e **tornar a evolução visível**. Tudo deriva disso.

## Princípios norteadores

### 1. Mobile-first, sempre
- Design começa no 375×667 (iPhone SE); desktop é expansão.
- **Tap targets** mínimos 44×44 dp.
- Evitar hover-only — tudo precisa funcionar no toque.
- Scroll vertical sempre; evitar carrosséis de conteúdo essencial.
- Teclado virtual não cobre o input ativo (scroll automático ao focar).

### 2. Feedback instantâneo
- Toda ação com latência > 300ms → skeleton/shimmer.
- Toda submissão de exercício → feedback visual em < 200ms (correção visível, "certo"/"quase" etc.).
- Erros da rede: toast que permite "tentar de novo" — nunca erro silencioso.
- Pronúncia / speaking com IA → streaming de resposta (aluno vê texto aparecer).

### 3. Sensação de avanço visível
- Progress bar no topo do player da lesson, com marcos clicáveis.
- Anéis no dashboard (streak, meta semanal, revisões).
- Micro-animação (< 1s) ao concluir uma seção / exercício.
- "Você está a 3 exercícios de concluir a lesson" — sempre visível.

### 4. Indicador INPUT / OUTPUT / REVIEW
- Em qualquer tela da lesson, pill no topo indica fase atual:
  - 📘 **INPUT** — fundo azul claro + texto "Aprendendo".
  - 💬 **OUTPUT** — fundo laranja claro + "Praticando".
  - 🔁 **REVIEW** — fundo verde claro + "Revisando".
- Garante que o aluno sempre saiba o que está sendo pedido dele neste momento.

### 5. Tradução como apoio, não muleta
- Tradução pt-BR visível por padrão em vocab novo (INPUT).
- **Escondida** em OUTPUT e exercícios — aluno pode revelar com toque.
- Em Drill, botão "ver dica" gasta "benefício da dúvida" (grade máxima cai para 3).

### 6. Sem frustração acumulada
- Erro em exercício ≠ penalidade. Mostra correto, oferece "try again" opcional, cria review.
- Max 3 tentativas consecutivas na mesma pergunta — após 2 erros, UI mostra a resposta correta + explicação.
- **Nunca** impedir aluno de avançar (exceto critério mínimo de conclusão de lesson).

### 7. Clareza visual
- Hierarquia clara: 1 CTA primário por tela.
- Texto português sem jargão.
- **Nunca** acrônimos não explicados.
- Ilustrações/emojis com moderação; nada que distraia da tarefa.

### 8. Transparência de estado
- "Seus pontos: X. Seu streak: Y dias. Próxima revisão: Z."
- Aluno sabe sempre por que algo aconteceu (ex.: "Este item voltou porque você errou há 2 dias").

### 9. Acessibilidade
- WCAG 2.1 AA no mínimo.
- Contraste texto / fundo ≥ 4.5:1.
- Navegação por teclado completa (Tab, Enter, Esc).
- Leitores de tela com `aria-*` em todos os componentes interativos (Radix ajuda).
- **Sem dependência de cor apenas** — ícones/ textos complementam (ex.: ✓ verde vira ✓ apenas em caso daltônico, texto "correto" sempre visível).
- Pronunciation coach tem opt-out (aluno surdo, ambiente silencioso).

### 10. Dark mode
- Opcional, via toggle no `/settings` ou respeitando `prefers-color-scheme`.
- Paleta própria — não inversão automática.
- Todos os componentes testados em ambos os modos.

## Layout base

### Mobile (≤ 640px)
```
┌───────────────────────┐
│ Header compacto       │ streak, pontos, menu hambúrguer
├───────────────────────┤
│                       │
│  Conteúdo principal   │
│                       │
│                       │
├───────────────────────┤
│ Bottom tab bar        │ Home | Trilha | Review | Speak | Perfil
└───────────────────────┘
```

### Desktop (≥ 1024px)
```
┌──────┬────────────────────────────────┐
│ Side │ Header (streak/pontos)         │
│ Nav  ├────────────────────────────────┤
│      │                                │
│      │       Conteúdo principal       │
│      │                                │
└──────┴────────────────────────────────┘
```

Side nav com: Dashboard, Trilha, Unidade atual, Review, Speaking, Pronunciation, Perfil, Settings.

## Telas-chave

Todas detalhadas em [wireframes] (backlog MVP).

- **Login / Cadastro**
- **Onboarding** — teste de nível 5-8 perguntas + preferências.
- **Dashboard** — "estudar hoje" + resumo de progresso + atalhos.
- **Trilha de aprendizagem** — mapa visual de unidades (passado, atual, futuro).
- **Unit cover** — objetivos "I can" + lessons + Recap + Self-assessment.
- **Lesson player** — 13 seções navegáveis com indicador de fase.
- **Speaking Practice** — chat com Alex (modos: short/free/role-play/fluency).
- **Pronunciation Coach** — treino livre por frase.
- **Review Center** — fila + sessão.
- **Self-assessment** — checklist por objetivo.
- **Perfil** — skills, badges, streak history.
- **Settings** — locale, dark mode, retention, notifications, privacy.

## Componentes canônicos

Ver `components/ui/` (shadcn) e `components/lesson/`, `components/exercises/`, etc.

- `<PhaseBadge phase="input|output|review" />`
- `<ProgressRing value={70} label="Meta semanal" />`
- `<StreakFlame count={14} />`
- `<LessonProgressBar current={5} total={13} />`
- `<ExerciseCard type="multiple_choice" ... />`
- `<AudioPlayer src={...} speed={1|0.75} />`
- `<Recorder onStop={...} maxSeconds={30} />`

## Copy voice (tom de voz)

- **Direto** — "Vamos praticar" > "Tal vez que possamos praticar".
- **Próximo** — "Você consegue!" > "O aluno deve conseguir".
- **Específico** — "Ouça esta frase e repita" > "Realize a prática auditiva".
- **Curto** — frases de 1-2 linhas. Explicação gramatical ≤ 100 palavras.
- **Sem inglês gratuito na UI** — a UI é pt-BR; conteúdo de estudo é EN.

## Notificações

- **Push** (opt-in): streak em risco (1 hora antes do fim do dia no TZ), lembrete de revisão devida ≥ 10.
- **Email** (opt-in): relatório semanal de progresso.
- Nunca spam. Padrão conservador.

## Animações

- Respeitam `prefers-reduced-motion`.
- Transições entre seções: ≤ 300ms.
- Celebrações (confetti): só em marcos grandes.
- Loading states sempre coerentes com o tipo de ação.

## Error states

- **Vazio** (ex.: nenhuma revisão hoje): mensagem positiva + CTA ("Você está em dia! Que tal uma lesson?").
- **Falha de rede**: retry automático 1×, depois botão manual.
- **Erro IA** (timeout, conteúdo impróprio detectado): mensagem honesta + fallback sem IA quando possível.
- **Nada funcionando**: página `/down` com status e email de suporte.

## Referências
- [01 — Visão](01-visao-do-produto.md)
- [02 — Metodologia](02-metodologia-pedagogica.md)
- [09 — Gamificação](09-gamificacao-e-progresso.md)
- https://www.w3.org/WAI/WCAG21/quickref/
