import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLessonForPlayer } from "@/lib/content/lesson-queries";
import { LessonPlayer } from "@/components/lesson/lesson-player";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const lesson = await getLessonForPlayer(supabase, slug);
  if (!lesson) notFound();

  return (
    <LessonPlayer
      snapshot={lesson.snapshot}
      lessonId={lesson.lesson_id}
      lessonVersionId={lesson.lesson_version_id}
      unitVersionId={lesson.unit_version_id}
      unitSlug={lesson.unit_slug}
      titleEn={lesson.title_en}
      titlePtBr={lesson.title_pt_br}
    />
  );
}
