import ExerciseRow from "@/components/ExerciseRow";
import { exerciseCount, track } from "@/data/track";

const totalMinutes = track.topics.reduce(
  (sum, topic) =>
    sum + topic.exercises.reduce((acc, ex) => acc + ex.minutes, 0),
  0,
);

/**
 * Página de inicio: visión general del track
 * con temas y ejercicios (estilo Notion / Affine).
 */
export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <header className="border-b border-line">
        <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-3">
            Track · Backend
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-[40px]">
            {track.title}
          </h1>
          <p className="mt-2 text-[15px] text-ink-2">{track.tagline}</p>
          <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-ink-2">
            {track.description}
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] text-ink-3">
            <span>{track.topics.length} temas</span>
            <span>{exerciseCount} ejercicios</span>
            <span>~{totalMinutes} min de práctica</span>
            <span className="rounded-full border border-line px-2 py-0.5">
              Fácil → Medio
            </span>
          </div>
        </div>
      </header>

      {/* Temas y ejercicios */}
      <main className="mx-auto max-w-4xl px-6 py-10">
        {track.topics.map((topic) => (
          <section key={topic.id} className="mb-12">
            <div className="px-4 pb-3">
              <p className="text-[11px] font-medium text-ink-3">
                Tema {String(topic.order).padStart(2, "0")}
              </p>
              <h2 className="mt-0.5 text-[17px] font-semibold tracking-tight">
                {topic.title}
              </h2>
              <p className="mt-1 text-[13px] text-ink-2">{topic.tagline}</p>
              <p className="mt-2 max-w-2xl text-[12px] leading-relaxed text-ink-3">
                {topic.description}
              </p>
            </div>

            <div className="overflow-hidden rounded-lg border border-line">
              {topic.exercises.map((exercise, index) => (
                <ExerciseRow
                  key={exercise.id}
                  exercise={exercise}
                  index={index}
                />
              ))}
            </div>
          </section>
        ))}
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto max-w-4xl px-6 py-8 text-[11px] leading-relaxed text-ink-3">
          NestJS Study — plataforma de estudio inspirada en Scrimba, Notion y
          Affine. Ejercicios basados en el camino de repositorios de tu
          curso.
        </div>
      </footer>
    </div>
  );
}
