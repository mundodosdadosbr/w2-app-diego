import { Badge } from "@/components/ui/badge";
import { LEVEL_TEST_QUESTIONS } from "@/lib/onboarding/level-test-questions";
import { LevelTestForm } from "./level-test-form";

export default function LevelTestPage() {
  return (
    <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm">
      <div className="space-y-1 border-b border-border/60 p-6">
        <div className="mb-3 flex items-center gap-2">
          <Badge variant="primary">Passo 2 / 3</Badge>
          <span className="font-mono text-[11px] text-muted-foreground">
            {LEVEL_TEST_QUESTIONS.length} perguntas · ~2 min
          </span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Teste de nível
        </h1>
        <p className="text-sm text-muted-foreground">
          Responda o que souber — não tem reprovação. Pule os que não
          conhecer.
        </p>
      </div>
      <div className="p-6">
        <LevelTestForm questions={LEVEL_TEST_QUESTIONS} />
      </div>
    </div>
  );
}
