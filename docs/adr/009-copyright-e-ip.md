# ADR-009: Proteção de IP — conteúdo 100% original

- **Status**: Accepted
- **Data**: 2026-04-21
- **Tags**: legal, conteudo, pedagogia, guardrails

## Contexto

O prompt do produto é explícito:

> Criar um sistema completo de aprendizado de inglês inspirado na **ESTRUTURA PEDAGÓGICA** desta apostila (...), mas **SEM copiar texto, imagens, exercícios, diagramação ou conteúdo protegido**. Reaproveite apenas o **MÉTODO** de ensino e a lógica instrucional.

A apostila usada como referência é propriedade da Pearson Education do Brasil S.A. (Wizard W2 Student's Book, ISBN 978-65-80529-00-1). O arquivo `Apostila En.md` no repositório é **referência privada para extração de metodologia**; não é fonte de conteúdo a publicar.

Risco: reprodução inadvertida de diálogos, listas de vocabulário na mesma ordem, exercícios idênticos, ilustrações ou layout — qualquer um configura infração e inviabiliza o produto.

## Decisão

Adotamos a seguinte postura, **vinculante a humanos e IA**:

### O que PODE ser reaproveitado
- **Método**: sequência INPUT → CONTEXTUALIZAÇÃO → FIXAÇÃO → OUTPUT → PRONÚNCIA → REVIEW → SELF-ASSESSMENT.
- **Arquitetura de lesson**: blocos Verbs / New Words / Useful Phrases / Grammar / Real Life / Check it out / Speak Right Now / Talk to Your Friend / Listen and Practice / Listen, Number, and Role-play / Fluency / Improve Your Pronunciation / Pinpoint / Self-assessment.
- **Princípios**: microaprendizado, repetição com variação, progressão simples → complexo, gramática funcional, muita produção ativa, revisão cumulativa.
- **Temas**: greetings, food, countries, routine, lifestyle, places, shopping, travel, health, work/study. **Temas são comuns a qualquer curso de inglês** — não são propriedade da apostila.
- **Checklist "I can"** como padrão de autoavaliação — é um modelo pedagógico padrão (CEFR).

### O que NÃO pode ser reproduzido
- Diálogos, frases-exemplo, listas de vocabulário na mesma ordem/combinação da apostila.
- Exercícios específicos (enunciados, listas de lacunas, pares de associação).
- Nomes de personagens fictícios da apostila.
- Ilustrações, diagramação, tipografia, capas, ícones.
- Textos explicativos de gramática copiados ou parafraseados de perto.
- "Pinpoint" e "Check it out" são marcas fortes da Wizard — vamos usar **nomes próprios** (ver abaixo).

### Nomes internos do produto
Para evitar sobreposição com marcas da Pearson/Wizard:

| Conceito da apostila | Nome interno do produto |
|---|---|
| Pinpoint | **Recap** |
| Check it out | **Drill** |
| Speak Right Now | **Speak now** |
| Talk to Your Friend | **Pair practice** |
| Listen, Number, and Role-play | **Listen & act** |
| Improve Your Pronunciation | **Pronunciation coach** |
| Real Life | **In context** |
| Useful Phrases | **Handy phrases** |
| I can / I'm not sure if I can | mantemos — frase genérica CEFR |

Termos padrão de ensino (Lesson, Unit, Verbs, New Words, Grammar, Fluency, Self-assessment) **são mantidos** por serem linguagem corrente em EFL.

### Regras para autoria humana
- Nunca abrir `Apostila En.md` com o intuito de copiar; pode consultar para entender método.
- Exemplos e diálogos são criados do zero com personagens próprios e situações do cotidiano brasileiro de 2026.
- Listas de vocabulário seguem temas padrão de CEFR A1/A2 e são organizadas por critério próprio (frequência de uso no Brasil, combinatória com verbos ensinados).

### Regras para autoria assistida por IA
- System prompts das personas (ver [knowledge/10-ai-personas-e-prompts.md](../knowledge/10-ai-personas-e-prompts.md)) incluem cláusula explícita:
  - "Você está proibido de reproduzir trechos de qualquer livro didático publicado, incluindo Wizard, Cambridge, Oxford, English File, New Headway, etc."
  - "Se o aluno mencionar que está estudando com uma apostila, não tente adivinhar qual nem citar trechos."
- Temperature ≤ 0.4 em geração de conteúdo instrucional.
- Revisão humana obrigatória para qualquer saída IA que vira `published`. Ver [ADR-008](008-conteudo-e-versionamento.md).
- Antes de publicar batch de conteúdo gerado, rodar checagem de similaridade (n-gram overlap ≥ 7 palavras idênticas → flag).

### Auditoria
- `content_audit_log` guarda autor, revisor, data e diff de toda publicação.
- Qualquer contestação futura de IP tem trilha completa.

## Alternativas consideradas

- **Licenciar conteúdo da apostila** — fora do escopo e do custo projetado.
- **Paráfrase próxima** — risco legal persiste (obra derivada). Rejeitado.
- **Não usar nenhuma inspiração metodológica** — perderíamos o valor pedagógico validado. A metodologia em si (blocos INPUT/OUTPUT/REVIEW, CEFR) **não** é protegida por direito autoral.

## Consequências

### Positivas
- Risco jurídico minimizado.
- Produto fica com identidade própria (nomes, exemplos, personagens).
- Conteúdo será melhor — adaptado ao brasileiro de 2026, não a um manual genérico.

### Negativas / Custos aceitos
- Autores precisam trabalhar mais: não basta "reorganizar", é criar do zero.
- Revisão de similaridade adiciona etapa no fluxo editorial.
- Limita reaproveitamento de exemplos prontos.

### Neutras / Impactos
- Fluxo editorial em [ADR-008](008-conteudo-e-versionamento.md).
- Prompts de IA em [knowledge/10-ai-personas-e-prompts.md](../knowledge/10-ai-personas-e-prompts.md).
- Glossário interno em [knowledge/15-glossario.md](../knowledge/15-glossario.md).

## Referências
- Wizard W2 Student's Book, ISBN 978-65-80529-00-1 (referência metodológica privada, não fonte de conteúdo).
- CEFR: https://www.coe.int/en/web/common-european-framework-reference-languages
