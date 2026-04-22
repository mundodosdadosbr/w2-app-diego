-- 0007_consolidate_profiles_update.sql
-- Consolida profiles_update_own + profiles_update_admin em policy única.
-- Fecha o último WARN de multiple_permissive_policies (role x UPDATE em profiles).
-- Ref: Supabase linter 0006_multiple_permissive_policies.

drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_update_admin on public.profiles;

create policy profiles_update on public.profiles for update
  using (
    id = (select auth.uid())
    or (select public.current_role()) = 'admin'
  )
  with check (
    -- Aluno só pode atualizar próprio e NÃO pode mudar role
    (id = (select auth.uid())
       and role = (select p.role from public.profiles p where p.id = (select auth.uid())))
    or
    -- Admin pode qualquer coisa
    (select public.current_role()) = 'admin'
  );

comment on policy profiles_update on public.profiles is
  'Aluno atualiza próprio (sem mudar role); admin atualiza qualquer coisa.';
