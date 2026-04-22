# ADR-019: Autenticação AWS a partir de Supabase Edge Functions

- **Status**: Accepted
- **Data**: 2026-04-21
- **Tags**: seguranca, aws, devops

## Contexto

[ADR-016](016-stt-amazon-transcribe.md), [ADR-017](017-llm-amazon-bedrock.md) e uso de S3 para staging de áudio exigem que Edge Functions do Supabase (runtime Deno) autentiquem contra AWS. Edge Functions não rodam em ambiente AWS, então **não há metadata endpoint / instance profile** disponível.

Opções reais:
- **(a)** IAM user dedicado com access key + secret, armazenados em Supabase Edge Function secrets.
- **(b)** Cognito Identity Pool com token JWT do Supabase → AWS STS → credenciais temporárias.
- **(c)** AWS IAM Roles Anywhere (certificado X.509) — operacionalmente pesado, fora do MVP.

## Decisão

**MVP: opção (a)** — IAM user + access key em secrets da Edge Function.
**Pós-PMF: migrar para opção (b)** — Cognito+STS, quando formalizar postura de segurança.

### Detalhes do MVP

#### IAM user
- Nome: `w2-edge-function-runtime`
- Política custom `w2-edge-function-runtime-policy` com princípio de **menor privilégio**:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "BedrockInvokeSpecificModels",
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream",
        "bedrock:Converse",
        "bedrock:ConverseStream"
      ],
      "Resource": [
        "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-sonnet-4-6-*",
        "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-haiku-4-5-*",
        "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-opus-*",
        "arn:aws:bedrock:us-east-1:ACCOUNT_ID:inference-profile/*"
      ]
    },
    {
      "Sid": "TranscribeJobs",
      "Effect": "Allow",
      "Action": [
        "transcribe:StartTranscriptionJob",
        "transcribe:GetTranscriptionJob",
        "transcribe:DeleteTranscriptionJob",
        "transcribe:CreateVocabulary",
        "transcribe:UpdateVocabulary",
        "transcribe:GetVocabulary"
      ],
      "Resource": "*"
    },
    {
      "Sid": "S3StagingAndRecordings",
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject", "s3:ListBucket"],
      "Resource": [
        "arn:aws:s3:::w2-stt-uploads",
        "arn:aws:s3:::w2-stt-uploads/*",
        "arn:aws:s3:::w2-recordings",
        "arn:aws:s3:::w2-recordings/*"
      ]
    }
  ]
}
```

Sem wildcards em Bedrock para modelos fora da whitelist — evita uso acidental/indesejado de modelos caros.

#### Secrets no Supabase
Via `supabase secrets set`:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION=us-east-1`
- `AWS_S3_UPLOADS_BUCKET=w2-stt-uploads`
- `AWS_S3_RECORDINGS_BUCKET=w2-recordings`

Edge Function lê via `Deno.env.get(...)`.

#### Rotação
- Chaves rotacionadas **a cada 90 dias** (calendário: 1º dia do trimestre).
- Processo: gerar nova key → adicionar como secret adicional → deploy Edge Function lendo a nova → marcar antiga como inativa → deletar após 7 dias de observação.
- Lembrete em calendário (item operacional; criar em `docs/operations/secrets-rotation.md` quando virar runbook formal).

#### S3 buckets
- `w2-stt-uploads` — uploads temporários do aluno (webm/opus). Lifecycle: delete após 7 dias.
- `w2-recordings` — áudio do aluno persistido. Lifecycle: delete após 90 dias (ver [knowledge/08](../knowledge/08-regras-de-negocio.md)). Criptografia SSE-S3 ativa.
- Ambos com **block public access** ativo; upload do cliente via presigned URL gerada pela Edge Function.

### Segurança adicional
- **CloudTrail** ativo na conta AWS com retenção 90 dias.
- **AWS Budgets alert** em US$ 50/mês no MVP (descrever no [ADR-012](012-observabilidade-e-analytics.md)).
- **GuardDuty** recomendado para conta de produção; não-bloqueante no MVP.
- Chave AWS **nunca** em variáveis de ambiente do Next.js — só em secrets de Edge Function do Supabase.

### Migração para Cognito (fase 2)
Quando formalizarmos postura:
- Cognito Identity Pool configurado para aceitar JWTs emitidos pelo Supabase Auth (OpenID Connect).
- Edge Function troca JWT do aluno por credenciais AWS temporárias via `AssumeRoleWithWebIdentity`.
- Cada aluno passa a operar AWS com role própria — audit trail por aluno.
- Benefícios: rotação automática, sem access key estática, princípio de menor privilégio por aluno.

## Alternativas consideradas

- **Cognito no dia 1** — arquitetura mais correta, mas complexidade ~3× para setup (JWT bridge Supabase↔Cognito, role chaining, policy per user). Não cabe no MVP.
- **Proxy service na AWS** (Lambda como broker entre Supabase e Bedrock/Transcribe) — adiciona hop, latência, componente extra. Rejeitado.
- **Hardcode short-lived credentials gerados localmente** — impossível, não há automação segura sem Cognito/STS.
- **Colocar chave em env do Next.js** — vaza no bundle. Absolutamente não.

## Consequências

### Positivas
- Simples, funciona, auditável.
- Políticas restritas garantem que mesmo um vazamento de chave limita dano.
- Caminho claro de evolução para Cognito pós-PMF.

### Negativas / Custos aceitos
- Chave estática é vetor de risco se vazar (mitigado por rotação + escopo restrito).
- Rotação manual exige disciplina. Criar reminder no calendário da equipe.

### Neutras / Impactos
- Aciona buckets S3 novos a criar via IaC inicial.
- Interação com [ADR-013](013-hosting-e-deploy.md) (deploy/CI precisa injetar secrets AWS em ambiente de Edge Functions).

## Referências
- https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html
- https://supabase.com/docs/guides/functions/secrets
- Lifecycle S3: https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html
