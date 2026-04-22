"use client";

import { useActionState } from "react";
import { Loader2, Mail } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestMagicLinkAction } from "../actions";

export function LoginForm({ next: _next }: { next?: string }) {
  const [state, formAction, isPending] = useActionState(
    requestMagicLinkAction,
    null,
  );

  if (state?.ok && state.message) {
    return (
      <Alert variant="success">
        <div className="mb-1 flex items-center gap-2 font-medium">
          <Mail className="h-4 w-4" />
          Link enviado
        </div>
        <p>{state.message}</p>
      </Alert>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state && !state.ok && <Alert variant="error">{state.error}</Alert>}

      <div>
        <Label htmlFor="display_name">Como quer ser chamado? (opcional)</Label>
        <Input
          id="display_name"
          name="display_name"
          type="text"
          autoComplete="given-name"
          className="mt-1.5"
          placeholder="Seu primeiro nome"
        />
        <FieldError
          messages={
            state && !state.ok ? state.fieldErrors?.display_name : undefined
          }
        />
        <p className="mt-1 text-[11px] text-muted-foreground">
          Só usamos da primeira vez (se ainda não tem conta).
        </p>
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-1.5"
          placeholder="voce@exemplo.com"
        />
        <FieldError
          messages={state && !state.ok ? state.fieldErrors?.email : undefined}
        />
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Enviar link de acesso
      </Button>

      <p className="text-center text-[11px] text-muted-foreground">
        Sem senha. Link único no seu email, válido por 1 hora.
      </p>
    </form>
  );
}
