import { Suspense } from "react";
import ExerciseWorkspace from "@/components/ExerciseWorkspace";
import { allExercises, getExercise, getTopic, track } from "@/data/track";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return allExercises.map((exercise) => ({ id: exercise.id }));
}

/**
 * Workspace de un ejercicio.
 *
 * La lectura de `params` ocurre dentro de <Suspense> para que el
 * App Shell (sidebar vacío + fallback) sea parte del prefetch y
 * la navegación entre ejercicios sea instantánea (Cache Components).
 */
export default function ExercisePage(
  props: PageProps<"/exercise/[id]">,
) {
  return (
    <Suspense fallback={<ExerciseLoading />}>
      <ExerciseContent params={props.params} />
    </Suspense>
  );
}

async function ExerciseContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const exercise = getExercise(id);

  if (!exercise) {
    notFound();
  }

  const topic = getTopic(exercise.topicId);

  if (!topic) {
    notFound();
  }

  return (
    <ExerciseWorkspace
      key={exercise.id}
      exercise={exercise}
      topic={topic}
      topics={track.topics}
    />
  );
}

function ExerciseLoading() {
  return (
    <div className="flex h-screen flex-col bg-app">
      <div className="h-12 shrink-0 border-b border-line" />
      <div className="flex min-h-0 flex-1">
        <div className="hidden w-64 shrink-0 border-r border-line bg-panel md:block" />
        <div className="flex flex-1 flex-col">
          <div className="h-8 w-48 rounded bg-elevated" />
          <div className="mt-6 flex flex-1 items-center justify-center">
            <p className="text-[13px] text-ink-3">
              Cargando ejercicio…
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
