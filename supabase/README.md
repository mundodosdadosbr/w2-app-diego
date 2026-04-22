# Supabase

Infra do backend. Ver [docs/adr/002-backend-supabase.md](../docs/adr/002-backend-supabase.md), [003-rls](../docs/adr/003-rls-e-autorizacao.md), [008-conteudo-e-versionamento](../docs/adr/008-conteudo-e-versionamento.md), [013-hosting](../docs/adr/013-hosting-e-deploy.md).

Projeto cloud: `ucbbhymgflujbtcopaeb` → https://ucbbhymgflujbtcopaeb.supabase.co

## Estrutura

```
supabase/
├── migrations/           # SQL migrations versionadas, aplicadas via CLI
│   ├── 0001_extensions_and_enums.sql
│   ├── 0002_content_schema.sql
│   ├── 0003_user_schema.sql
│   ├── 0004_rls_policies.sql
│   └── 0005_functions_and_triggers.sql
├── tests/
│   ├── policies/         # pgTAP para RLS (1 por tabela sensível)
│   └── functions/        # pgTAP para funções críticas
├── seed/
│   └── content/          # JSONs do conteúdo seed (unidades/lessons)
└── functions/            # Edge Functions (Deno) — serão criadas em M1-M3
```

## Fluxo local

### Primeira vez
```bash
# instalar Supabase CLI
brew install supabase/tap/supabase

# linkar ao projeto remoto (não obriga — opcional)
supabase link --project-ref ucbbhymgflujbtcopaeb

# subir stack local (Postgres + Auth + Storage + Studio)
supabase start
```

### Aplicar migrations localmente
```bash
supabase db reset          # recria DB local do zero e aplica migrations
# ou
supabase migration up      # aplica migrations pendentes
```

### Rodar testes
```bash
supabase test db           # roda pgTAP em tests/
```

### Gerar tipos TypeScript
```bash
supabase gen types typescript --local > ../types/database.ts
```

### Deploy para produção
```bash
# revisar antes — inspeção do diff
supabase db diff --linked

# aplicar no remoto (com cuidado — ver ADR-013)
supabase db push
```

## Convenções das migrations

- **Nomenclatura**: `NNNN_descricao-curta.sql`, sequencial 4 dígitos, sem data.
- **Idempotência**: onde possível, usar `IF NOT EXISTS` — mas migrations **imutáveis após aplicadas em prod**.
- **RLS**: toda tabela com dados de aluno ou conteúdo sensível tem `ENABLE ROW LEVEL SECURITY` + policies.
- **Comentários**: cada tabela/função crítica tem `COMMENT ON ...` em português.
- **Fix forward**: erros em migration já aplicada → criar nova migration que corrige. Nunca editar migration passada.

## Tabelas com RLS obrigatória

Toda tabela em `public.*`. Ver [ADR-003](../docs/adr/003-rls-e-autorizacao.md).

- **Conteúdo publicado** (`units`, `lessons`, `lesson_sections`, `vocabulary_items`, `phrase_patterns`, `grammar_points`, `dialog_lines`, `exercises`, snapshots): SELECT por `authenticated` quando `status='published'`; INSERT/UPDATE/DELETE por `author`/`reviewer`/`admin`.
- **Dados do aluno** (`*_progress`, `*_attempts`, `reviews`, `self_assessments*`, `skill_checkpoints`, `streaks`, `points_ledger`, `speaking_*`, `pronunciation_attempts`): `user_id = auth.uid()`.
- **Observabilidade** (`ai_usage`, `audit_log`): só admin SELECT; INSERT via `security definer` funcs/Edge Functions.

## Seeds

- `supabase/seed/content/unit-XX-name/` contém JSONs das unidades (ver [ADR-008](../docs/adr/008-conteudo-e-versionamento.md)).
- Aplicar via script TS dedicado (criado em M1 — story 7.4).
