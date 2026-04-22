---
name: Guardrails de Copyright
description: O que não copiar da apostila, o que pode ser reaproveitado, nomes internos
---

# 14 — Guardrails de Copyright

Este é um documento **operacional** — lista concreta do que é proibido e permitido. Amplia [ADR-009](../adr/009-copyright-e-ip.md) com exemplos e checklists.

## A regra de ouro

> **Inspiramos em método. Criamos do zero.**

A apostila Wizard W2 (Pearson) é **referência metodológica privada** — existe no repositório em `Apostila En.md` para que autores/engenheiros entendam a lógica pedagógica. **Nada dela** aparece no produto final.

## O QUE NÃO FAZER

### 1. Nunca copiar texto da apostila
- Diálogos.
- Frases-exemplo.
- Explicações gramaticais.
- Enunciados de exercícios.
- Listas de vocabulário na mesma ordem ou combinação.
- Títulos de capítulo.

### 2. Nunca copiar personagens
- Nomes de personagens fictícios da apostila (Angela, Adam, etc. caso existam).
- Situações específicas que aparecem nos diálogos da apostila.

### 3. Nunca copiar marcas / nomes distintivos
- **"Pinpoint"** (termo distintivo da Wizard) → usar **"Recap"**.
- **"Check it out"** → usar **"Drill"** internamente.
- **"WIZARD"**, **"Pearson"**, **"W2"** na posição de marca → **nunca** aparecer no produto.
  - Repositório pode se chamar `w2-app-diego` internamente (é o nome que o Diego deu ao projeto), mas a plataforma final precisa de nome próprio.
- **"Wiz.me"**, **"Wiz.pen"** → não reproduzir.

### 4. Nunca copiar diagramação / visual
- Ícones da apostila.
- Cores temáticas da marca Wizard.
- Tipografia distintiva.
- Layout das páginas.

### 5. Nunca reproduzir ilustrações
- Personagens desenhados.
- Cenários.
- Fotos originais.

## O QUE PODE SER REAPROVEITADO

### 1. Metodologia
- **Sequência**: INPUT → CONTEXTUALIZAÇÃO → FIXAÇÃO → OUTPUT → PRONÚNCIA → REVIEW → SELF-ASSESSMENT.
- **Divisão em blocos**: Verbs / New Words / Useful Phrases / Grammar / Real Life / Check it out / Speak Right Now / Talk to Your Friend / Listen and Practice / Listen, Number, Role-play / Fluency / Improve Your Pronunciation / Pinpoint / Self-assessment.
- **Ciclo de revisão cumulativa**.
- **Checklist "I can" / "I'm not sure if I can" / "I can't yet"** (padrão CEFR, não propriedade da Wizard).

Ver nomes internos que adotamos em [09](../adr/009-copyright-e-ip.md).

### 2. Temas comuns do CEFR
- Cumprimentos, comida, países, rotina, lugares, compras, saúde, viagem, trabalho, estudo.
- Esses temas **são comuns a qualquer curso** — não são propriedade da apostila.

### 3. Vocabulário genérico
- Palavras do inglês em si (obviamente).
- Ordem/organização por frequência de uso é escolha nossa.

### 4. Estruturas gramaticais
- Simple present, verb to be, imperative, modal can, etc. **são propriedade do idioma**, não da apostila.
- Sequência didática (introduzir afirmativa antes de negativa) é padrão pedagógico universal, não patente da Wizard.

### 5. Termos correntes em EFL
- Lesson, Unit, Grammar, Drill, Fluency, Self-assessment, Role-play, Shadowing — **linguagem corrente** do ensino de idiomas.

## Nomes internos x nomes do produto

| Conceito na apostila | Nome interno do produto | Aparece ao aluno? |
|---|---|---|
| Pinpoint | **Recap** | sim |
| Check it out | **Drill** | interno; aluno vê "Fixação" |
| Speak Right Now | **Speak now** | sim |
| Talk to Your Friend | **Pair practice** | sim (em pt-BR: "Prática em dupla") |
| Listen, Number, and Role-play | **Listen & act** | sim |
| Improve Your Pronunciation | **Pronunciation coach** | sim |
| Real Life | **In context** | sim (em pt-BR: "Na prática") |
| Useful Phrases | **Handy phrases** | sim (em pt-BR: "Frases úteis" — frase descritiva genérica, tranquilo) |
| I can / I'm not sure if I can | **I can / I'm not sure / I can't yet** | sim (CEFR padrão) |

Termos retidos por serem genéricos e correntes em EFL:
- Lesson, Unit, Verbs, New Words, Grammar, Fluency, Self-assessment.

## Checklist de autoria (cada PR de conteúdo)

Antes de mesclar PR com conteúdo novo:

- [ ] Nenhum texto foi copiado/colado de `Apostila En.md`.
- [ ] Personagens têm nomes originais (não Angela/Adam/etc. da apostila).
- [ ] Vocabulário em ordem e combinação próprias (não réplica da apostila).
- [ ] Explicações gramaticais escritas do zero — não paráfrase próxima.
- [ ] Diálogos usam situações brasileiras de 2026, não cenários da apostila.
- [ ] Exercícios criados originalmente, não réplica de enunciados da apostila.
- [ ] Nenhuma marca Wizard/Pearson no texto.
- [ ] Imagens/ilustrações próprias ou de banco royalty-free com licença anexa.

## Checklist de autoria por IA (conteúdo gerado)

Adicional aos itens acima:

- [ ] `ai_generated = true` na tabela.
- [ ] Passou por review humana antes de `published`.
- [ ] Prompt usado salvo em `content_audit_log` com versão.
- [ ] Similaridade com apostila checada (n-gram ≥ 7 palavras idênticas → flag).
- [ ] Similaridade com obras conhecidas checada (English File, Cambridge, Interchange).

## Resposta a alegação de IP

Se em algum momento surgir contestação de IP:
1. Congelar publicação de conteúdo relacionado.
2. Puxar `content_audit_log` do item contestado — autor, revisor, prompts (se IA), diffs.
3. Comparar com a obra alegadamente infringida.
4. Consultar jurídico antes de qualquer retratação pública.

## Em caso de dúvida

Se autor ou IA **acha** que algo se parece demais com a apostila: **refazer do zero**. Custa menos tempo que uma disputa legal.

Nome fantasia/marca do produto: **a definir** (tarefa de marca pré-lançamento). Até lá, evitar nome público.

## Referências
- [ADR-009](../adr/009-copyright-e-ip.md)
- [ADR-008](../adr/008-conteudo-e-versionamento.md)
- Apostila Wizard W2 Student's Book, ISBN 978-65-80529-00-1 — **referência metodológica privada**.
- Lei 9.610/98 (direitos autorais, Brasil).
