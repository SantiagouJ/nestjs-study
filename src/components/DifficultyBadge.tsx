import type { Difficulty } from "@/lib/types";

const styles: Record<Difficulty, string> = {
  easy: "bg-elevated text-ink-2",
  medium: "bg-elevated text-ink",
};

const labels: Record<Difficulty, string> = {
  easy: "Fácil",
  medium: "Medio",
};

export default function DifficultyBadge({
  difficulty,
}: {
  difficulty: Difficulty;
}) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-md border border-line px-2 py-0.5 text-[11px] font-medium",
        styles[difficulty],
      ].join(" ")}
    >
      <span
        className={[
          "h-1 w-1 rounded-full",
          difficulty === "easy" ? "bg-ink-3" : "bg-ink-2",
        ].join(" ")}
      />
      {labels[difficulty]}
    </span>
  );
}
