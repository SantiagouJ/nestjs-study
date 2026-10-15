"use client";

import Link from "next/link";
import { CheckIcon, ClockIcon } from "./icons";
import type { Exercise } from "@/lib/types";
import { useProgress } from "@/lib/progress";
import DifficultyBadge from "./DifficultyBadge";

/**
 * Fila de ejercicio en la página de inicio, con estado
 * de progreso leído de localStorage.
 */
export default function ExerciseRow({
  exercise,
  index,
}: {
  exercise: Exercise;
  index: number;
}) {
  const { isDone } = useProgress();
  const solved = isDone(exercise.id);

  return (
    <Link
      href={`/exercise/${exercise.id}`}
      className="group flex items-center gap-3 border-b border-line-soft px-4 py-3 transition-colors hover:bg-hover"
    >
      <span
        className={[
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors",
          solved
            ? "border-pass/40 bg-pass/10 text-pass"
            : "border-line text-transparent group-hover:border-ink-3",
        ].join(" ")}
      >
        {solved && <CheckIcon size={10} strokeWidth={2.5} />}
      </span>

      <span className="w-6 shrink-0 text-[11px] font-medium text-ink-3">
        {String(index + 1).padStart(2, "0")}
      </span>

      <span
        className={[
          "min-w-0 flex-1 truncate text-[13px] transition-colors",
          solved ? "text-ink-2" : "text-ink group-hover:text-ink",
        ].join(" ")}
      >
        {exercise.title}
      </span>

      <span className="hidden shrink-0 items-center gap-1.5 text-[11px] text-ink-3 sm:flex">
        <ClockIcon size={11} />
        {exercise.minutes} min
      </span>

      <DifficultyBadge difficulty={exercise.difficulty} />
    </Link>
  );
}
