"use client";

/** Resumen corto del ejercicio, una sola línea bajo el header. */
export default function ExerciseStatement({ summary }: { summary: string }) {
  return (
    <p className="truncate border-b border-line px-4 py-2 text-[12px] text-ink-2">
      {summary}
    </p>
  );
}
