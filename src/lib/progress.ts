"use client";

import { useCallback, useSyncExternalStore } from "react";

const KEY = "nestjs-study:progress:v1";

/** Referencia estable: useSyncExternalStore compara snapshots con Object.is. */
const EMPTY_SOLVED: string[] = [];

let snapshot: string[] = EMPTY_SOLVED;
let snapshotRaw: string | null | undefined;

function read(): string[] {
  if (typeof window === "undefined") return EMPTY_SOLVED;

  let raw: string | null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return EMPTY_SOLVED;
  }

  if (raw === snapshotRaw) return snapshot;

  snapshotRaw = raw;
  if (!raw) {
    snapshot = EMPTY_SOLVED;
    return snapshot;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    snapshot = Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : EMPTY_SOLVED;
  } catch {
    snapshot = EMPTY_SOLVED;
  }

  return snapshot;
}

function write(ids: string[]) {
  const raw = JSON.stringify(ids);
  window.localStorage.setItem(KEY, raw);
  snapshot = ids;
  snapshotRaw = raw;
}

function getServerSnapshot(): string[] {
  return EMPTY_SOLVED;
}

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function getSolvedIds(): string[] {
  return read();
}

export function isSolved(exerciseId: string): boolean {
  return read().includes(exerciseId);
}

export function markSolved(exerciseId: string) {
  const ids = read();
  if (ids.includes(exerciseId)) return;
  write([...ids, exerciseId]);
  emit();
}

/** Suscripción externa para que toda la UI reaccione al progreso. */
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Hook de progreso: ejercicios resueltos persistidos en localStorage. */
export function useProgress() {
  const solved = useSyncExternalStore(subscribe, read, getServerSnapshot);

  const mark = useCallback((exerciseId: string) => {
    markSolved(exerciseId);
  }, []);

  const isDone = useCallback(
    (exerciseId: string) => solved.includes(exerciseId),
    [solved],
  );

  return { solved, mark, isDone };
}
