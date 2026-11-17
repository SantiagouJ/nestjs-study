import ExerciseRow from "@/components/ExerciseRow";
import { tracks } from "@/data/catalog";

/**
 * Página de inicio: un catálogo por track
 * (NestJS y, cuando está cargado, Next.js con backend).
 */
export default function HomePage() {
  const exerciseCount = tracks.reduce(
    (sum, item) =>
      sum + item.topics.reduce((acc, topic) => acc + topic.exercises.length, 0),
    0,
  );

  return (
    <div className="min-h-screen">
      <header className="border-b border-line">
        <div className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-3">
            Plataforma de práctica
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-[40px]">
            NestJS y Next.js
          </h1>
          <p className="mt-2 text-[15px] text-ink-2">
            Backend con TypeORM y frontend conectado a esa API.
          </p>
          <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-ink-2">
            El track de NestJS construye la API. El de Next.js arma la
            interfaz que la consume: componentes, sesión, filtros y los
            ejercicios de cierre del preparcial.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] text-ink-3">
            <span>{tracks.length} tracks</span>
            <span>{exerciseCount} ejercicios</span>
            <span className="rounded-full border border-line px-2 py-0.5">
              Fácil → Medio
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        {tracks.map((track) => (
          <div key={track.id} id={track.id} className="mb-16">
            <div className="mb-8 border-b border-line pb-6">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-3">
                Track
              </p>
              <h2 className="mt-2 text-[28px] font-semibold tracking-tight">
                {track.title}
              </h2>
              <p className="mt-1 text-[14px] text-ink-2">{track.tagline}</p>
              <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-ink-2">
                {track.description}
              </p>
            </div>

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
          </div>
        ))}
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto max-w-4xl px-6 py-8 text-[11px] leading-relaxed text-ink-3">
          Practica NestJS y Next.js en el navegador. El frontend no reemplaza
          la API: la consulta, filtra y muestra lo que el backend autoriza.
        </div>
      </footer>
    </div>
  );
}
