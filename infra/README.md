# W2 App — Infra AWS (CDK)

Provisão de recursos AWS para o W2 App.

Ver [ADR-019](../docs/adr/019-aws-auth.md) para o racional.

## Recursos

- **S3 `w2-stt-uploads`** — staging de áudio antes de Transcribe. Lifecycle expira em 7 dias.
- **S3 `w2-recordings`** — gravações do aluno. Lifecycle expira em 90 dias (defesa em profundidade do UC-10).
- **IAM user `w2-edge-function-runtime`** — credenciais usadas pelas Edge Functions Supabase para invocar Bedrock, Transcribe e o S3 deste stack. Policy escopada aos modelos Claude whitelisted.

## Pré-requisitos

```bash
# Ter AWS CLI autenticado com conta dona
aws configure

# Bedrock habilitado na conta, acesso aos modelos Anthropic aprovado em us-east-1
# (Pode levar 1-3 dias úteis para aprovar — fazer ANTES do deploy)

# CDK bootstrap na conta/região (1x por conta)
cd infra
npx cdk bootstrap aws://ACCOUNT/us-east-1
```

## Deploy

```bash
cd infra
npm install         # ou pnpm install

# Diff antes (boa prática)
npm run diff

# Dev (nomes com sufixo -dev; removal destrutivo ao destroy)
npm run deploy:dev

# Prod (nomes sem sufixo; removal retain-by-default)
npm run deploy:prod
```

## Copiar access key para Supabase

O stack NÃO dumpa o secret em Output (best practice). Em vez disso, armazena em
AWS Secrets Manager. Depois do deploy, leia uma única vez:

```bash
# Output `AccessKeySecretArn` aponta para o secret criado.
# Lê o valor (e copia direto pro Supabase, sem passar pelo terminal history):

AWS_SECRET_ARN=<ARN_DO_OUTPUT>

# Ler JSON com as credenciais:
aws secretsmanager get-secret-value \
  --secret-id "$AWS_SECRET_ARN" \
  --query SecretString --output text

# Vai imprimir algo como:
# {"AWS_ACCESS_KEY_ID":"AKIA...","AWS_SECRET_ACCESS_KEY":"xxxx..."}

# Com jq, extrai e seta no Supabase diretamente:
CREDS=$(aws secretsmanager get-secret-value --secret-id "$AWS_SECRET_ARN" --query SecretString --output text)
supabase secrets set \
  AWS_ACCESS_KEY_ID="$(echo "$CREDS" | jq -r .AWS_ACCESS_KEY_ID)" \
  AWS_SECRET_ACCESS_KEY="$(echo "$CREDS" | jq -r .AWS_SECRET_ACCESS_KEY)" \
  AWS_REGION=us-east-1 \
  --project-ref ucbbhymgflujbtcopaeb

unset CREDS
```

**Nunca** commitar o secret. Nunca imprimir em log. Nunca dumpar em CloudFormation Output.

## Rotação de chaves

A cada 90 dias:

```bash
# 1. Gerar nova key (sem destruir a atual)
aws iam create-access-key --user-name w2-edge-function-runtime

# 2. Atualizar secret no Supabase (passo acima)

# 3. Deploy Edge Functions para pegar novo secret

# 4. Desativar (não deletar) key antiga
aws iam update-access-key \
  --user-name w2-edge-function-runtime \
  --access-key-id AKIA_ANTIGO \
  --status Inactive

# 5. Observar 7 dias. Se nada quebrou:
aws iam delete-access-key \
  --user-name w2-edge-function-runtime \
  --access-key-id AKIA_ANTIGO
```

## Destroy (ambiente dev)

```bash
npm run cdk destroy W2StackDev
```

**Em prod nunca fazer destroy** — buckets estão com `RETAIN` por segurança.
