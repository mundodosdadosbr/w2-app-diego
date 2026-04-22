# Use Cases

Descrições dos fluxos principais do produto. Cada use case (UC) conecta um **ator** a um **objetivo de aprendizagem/produto** através de um fluxo verificável, e amarra esse fluxo aos ADRs e Knowledges relevantes.

## Para que servem

- **Alinhamento** — todo mundo (produto, eng, pedagogia) enxerga o mesmo fluxo.
- **Cobertura de testes** — cada UC vira ao menos um teste e2e (Playwright).
- **Rastreamento de telemetria** — eventos pedagógicos obrigatórios vêm dos UCs.
- **Design de tela** — wireframes e componentes derivam dos UCs, não do inverso.

## Formato

Cada UC segue:

- **Ator** — quem executa (aluno, autor, reviewer, admin, sistema).
- **Objetivo** — o que o ator quer realizar, do ponto de vista dele.
- **Trigger** — o que inicia o fluxo.
- **Preconditions** — estado que precisa ser verdadeiro antes.
- **Main flow** — passos numerados do caminho feliz.
- **Alternative flows** — variações/erros/edge cases relevantes.
- **Postconditions** — estado garantido ao final.
- **Telemetry** — eventos obrigatórios.
- **References** — ADRs, Knowledges, princípios da Constitution.

## Índice

### Aluno — jornada central
| UC | Título | Ator | Prioridade MVP |
|---|---|---|---|
| [UC-01](UC-01-primeira-entrada.md) | Primeira entrada — cadastro, onboarding, teste de nível | Aluno | P0 |
| [UC-02](UC-02-completar-lesson.md) | Completar uma lesson | Aluno | P0 |
| [UC-03](UC-03-pronunciation-attempt.md) | Praticar pronúncia de uma frase | Aluno | P0 |
| [UC-04](UC-04-speaking-session.md) | Sessão de speaking com tutor IA | Aluno | P0 |
| [UC-05](UC-05-revisao.md) | Sessão de revisão (Review Center) | Aluno | P0 |

### Aluno — avaliação e acompanhamento
| UC | Título | Ator | Prioridade MVP |
|---|---|---|---|
| [UC-06](UC-06-self-assessment.md) | Submeter self-assessment de unit | Aluno | P0 |
| [UC-07](UC-07-acompanhar-progresso.md) | Acompanhar progresso e skills | Aluno | P0 |

### Autoria de conteúdo
| UC | Título | Ator | Prioridade MVP |
|---|---|---|---|
| [UC-08](UC-08-publicar-lesson.md) | Publicar uma lesson (draft → review → published) | Autor + Reviewer | P0 |

### Sistema
| UC | Título | Ator | Prioridade MVP |
|---|---|---|---|
| [UC-09](UC-09-pregerar-tts.md) | Pré-gerar TTS pós-publicação | Sistema | P0 |
| [UC-10](UC-10-purgar-gravacoes.md) | Purgar gravações expiradas (90 dias) | Sistema | P0 |

## Fora do MVP (para referência futura)

UCs identificados mas não escritos porque não entram no MVP:
- **UC-F1** Desafio semanal de speaking
- **UC-F2** Exportar dados pessoais (LGPD data export)
- **UC-F3** Excluir conta (LGPD account deletion) — **obrigatório legalmente**, mas implementação simplificada no MVP via ticket manual
- **UC-F4** Alterar meta semanal
- **UC-F5** Convidar outro aluno / turma
- **UC-F6** Admin lê progresso de aluno (com audit)
- **UC-F7** Reviewer rejeita lesson e devolve ao autor

## Convenções

- IDs sequenciais 01-99. Nunca reutilizar.
- UC removido de escopo **mantém** o arquivo com status `Removed` + motivo.
- Mudanças em UC existente são tracked por data na própria seção "Última revisão".
- Cobertura: cada P0 UC precisa ter teste e2e (Playwright) que cobre o main flow.

## Referências
- [Constitution](../constitution.md)
- [Knowledge base](../knowledge/README.md)
- [ADR index](../adr/README.md)
