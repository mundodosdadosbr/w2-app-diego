# pgTAP tests

Testes unitários para RLS policies e funções SQL críticas. Rodam via `supabase test db` contra o banco local.

## Estrutura

- `policies/` — um arquivo por área de policies (student data, content, observability).
- `functions/` — um arquivo por função crítica (`apply_review_grade`, `complete_lesson`, `submit_self_assessment`, `refresh_streak`, `publish_lesson`).
- `helpers/` — funções auxiliares (criar usuário sintético, auth.uid() mockado, etc.).

## Executar

```bash
supabase test db
```

Cada arquivo `.sql` em `tests/` é executado em transação isolada, com `ROLLBACK` automático — não polui o banco local.

## Criar usuário sintético

pgTAP não tem helper nativo para Supabase Auth. Usamos o padrão:

```sql
-- Dentro do teste:
create or replace function test.create_auth_user(
  p_email text, p_role public.user_role default 'student'
) returns uuid language plpgsql as $$
declare u uuid;
begin
  u := gen_random_uuid();
  insert into auth.users (id, email, role) values (u, p_email, 'authenticated');
  -- trigger on_auth_user_created cria profile automaticamente
  update public.profiles set role = p_role where id = u;
  return u;
end; $$;
```

`set local role authenticated` + `set local request.jwt.claims = '{"sub":"<uuid>"}'` simula auth.uid().

## Convenção de nomes

- Arquivos: `NN_dominio.sql` (ex.: `01_profiles_rls.sql`, `02_review_functions.sql`).
- `plan(N)` no início com o total de asserts esperados.
- `select finish()` no final.
