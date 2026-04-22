#!/usr/bin/env bash
# Lê /tmp/w2-aws-creds.json (criado pelo deploy CDK) e seta como
# Edge Function secrets no projeto Supabase ucbbhymgflujbtcopaeb.
#
# Pré-requisitos:
#   - supabase CLI logado (rode `npx supabase login` antes, 1x)
#   - /tmp/w2-aws-creds.json existente (criado pelo extract do Secrets Manager)
#
# Uso:
#   bash scripts/set-aws-supabase-secrets.sh
#
# Ao final, o arquivo local de credenciais é apagado com shred.

set -euo pipefail

CREDS_FILE="/tmp/w2-aws-creds.json"
PROJECT_REF="ucbbhymgflujbtcopaeb"

if [ ! -f "$CREDS_FILE" ]; then
  echo "✗ $CREDS_FILE não existe." >&2
  echo "  Rode primeiro o deploy CDK e o script de extração." >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "✗ jq não instalado. Instale com: sudo apt install jq" >&2
  exit 1
fi

AWS_ACCESS_KEY_ID=$(jq -r .AWS_ACCESS_KEY_ID "$CREDS_FILE")
AWS_SECRET_ACCESS_KEY=$(jq -r .AWS_SECRET_ACCESS_KEY "$CREDS_FILE")

if [ -z "$AWS_ACCESS_KEY_ID" ] || [ "$AWS_ACCESS_KEY_ID" = "null" ]; then
  echo "✗ Conteúdo inválido em $CREDS_FILE" >&2
  exit 1
fi

echo "▶ Setando Supabase secrets para project $PROJECT_REF..."
npx -y supabase secrets set \
  --project-ref "$PROJECT_REF" \
  AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY_ID" \
  AWS_SECRET_ACCESS_KEY="$AWS_SECRET_ACCESS_KEY" \
  AWS_REGION=us-east-1

echo
echo "✓ Secrets setados."
echo "▶ Limpando arquivo local..."
unset AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY
shred -u "$CREDS_FILE" 2>/dev/null || rm -f "$CREDS_FILE"
echo "✓ $CREDS_FILE removido com shred."

echo
echo "Confira no dashboard:"
echo "  https://supabase.com/dashboard/project/$PROJECT_REF/settings/functions"
