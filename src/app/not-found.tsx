import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-3">
        404
      </p>
      <h1 className="text-2xl font-semibold tracking-tight">
        Ejercicio no encontrado
      </h1>
      <p className="max-w-xs text-[13px] text-ink-3">
        El ejercicio que buscas no existe en este track.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-md bg-ink px-4 py-2 text-[13px] font-medium text-app transition-opacity hover:opacity-90"
      >
        Volver al track
      </Link>
    </div>
  );
}
