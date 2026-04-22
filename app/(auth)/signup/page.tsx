import { redirect } from "next/navigation";

/**
 * Signup foi consolidado em /login com magic link —
 * primeiro acesso cria a conta automaticamente. Esta rota existe só para
 * preservar links antigos apontando para /signup.
 */
export default function SignupPage() {
  redirect("/login");
}
