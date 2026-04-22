import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { GoalForm } from "./goal-form";

export default async function GoalPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string; score?: string; total?: string }>;
}) {
  const { level, score, total } = await searchParams;
  const levelUpper = (level ?? "a1").toUpperCase();

  return (
    <div className="space-y-4">
      {/* Resultado do teste */}
      <div className="rounded-2xl border border-border bg-card/80 p-6 backdrop-blur-sm">
        <Badge variant="primary">Resultado do teste</Badge>
        <div className="mt-3 flex items-baseline gap-3">
          <div className="text-4xl font-semibold tabular-nums tracking-tight">
            {levelUpper}
          </div>
          {score && total && (
            <div className="font-mono text-xs text-muted-foreground">
              {score} / {total} corretas
            </div>
          )}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {level === "a0" &&
            "Ótimo começo. Vamos partir da Unit 01 e construir do zero."}
          {level === "a1" &&
            "Você já tem base. Vai começar na Unit 01 ou 02 (sua escolha)."}
          {level === "a2" &&
            "Você vai acelerar. Podemos começar diretamente na Unit 03."}
        </p>
      </div>

      {/* Meta semanal */}
      <div className="rounded-2xl border border-border bg-card/80 p-6 backdrop-blur-sm">
        <div className="mb-3 flex items-center gap-2">
          <Badge variant="outline">Passo 3 / 3</Badge>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Qual sua meta semanal?
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quantos minutos você quer estudar por semana? Pode mudar depois.
        </p>
        <div className="mt-6">
          <GoalForm />
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Prefere preparar depois?{" "}
          <Link
            href="/onboarding/goal?skip=1"
            className="text-primary underline-offset-4 hover:underline"
          >
            Pular por agora
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
