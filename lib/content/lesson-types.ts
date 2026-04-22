/**
 * Tipos derivados do snapshot de lesson_versions. Serve de contrato
 * entre a query do player e os componentes de exercício.
 * A forma exata do JSON payload depende do tipo do exercício — ver knowledge/05.
 */
import type { Database } from "@/types/database";

type LessonRow = Database["public"]["Tables"]["lessons"]["Row"];
type LessonSectionKind = Database["public"]["Enums"]["lesson_section_kind"];
type ExerciseType = Database["public"]["Enums"]["exercise_type"];

export type SnapshotLesson = Omit<LessonRow, "created_at" | "updated_at">;

export type SnapshotSection = {
  id: string;
  lesson_id: string;
  order_index: number;
  kind: LessonSectionKind;
  title: string | null;
  payload: Record<string, unknown>;
  required: boolean;
};

export type SnapshotExercise = {
  id: string;
  lesson_section_id: string;
  type: ExerciseType;
  order_index: number;
  prompt_pt_br: string | null;
  prompt_en: string | null;
  payload: Record<string, unknown>;
  expected: Record<string, unknown>;
  scoring: Record<string, unknown>;
};

export type SnapshotVocab = {
  id: string;
  en: string;
  pt_br: string;
  part_of_speech: string | null;
  example_en: string | null;
  example_pt_br: string | null;
  audio_key: string | null;
};

export type SnapshotPhrase = {
  id: string;
  en: string;
  pt_br: string;
  function_tag: string | null;
  audio_key: string | null;
};

export type LessonSnapshot = {
  lesson: SnapshotLesson;
  sections: SnapshotSection[];
  exercises: SnapshotExercise[];
  vocabulary: SnapshotVocab[];
  phrases: SnapshotPhrase[];
  grammar: unknown[];
  dialogs: unknown[];
  pronunciation_targets: unknown[];
};

export function parseSnapshot(raw: unknown): LessonSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  return raw as LessonSnapshot;
}
