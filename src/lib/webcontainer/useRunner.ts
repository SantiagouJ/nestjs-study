"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { isSolved, markSolved } from "@/lib/progress";
import { container } from "@/lib/webcontainer/container";
import { runner } from "@/lib/webcontainer/runner";
import type {
  EndpointResponse,
  JestResult,
  RunPhase,
  RunState,
  ServerState,
} from "@/lib/webcontainer/types";
import type { Exercise } from "@/lib/types";

export interface RunnerApi {
  phase: RunPhase;
  statusText: string;
  results: JestResult | null;
  hadHiddenTests: boolean;
  error: string | null;
  /** true cuando esta corrida resolvió el ejercicio por primera vez */
  solvedThisRun: boolean;
  log: string[];
  busy: boolean;
  /** La corrida actual incluye npm install o una restauración de la caché. */
  showsInstall: boolean;
  /** La copia de node_modules se está montando desde IndexedDB. */
  restoring: boolean;
  runTests: () => Promise<void>;
  server: ServerState;
  startServer: () => Promise<void>;
  stopServer: () => void;
  sending: boolean;
  response: EndpointResponse | null;
  requestError: string | null;
  sendRequest: (
    method: string,
    path: string,
    body: string | null,
  ) => Promise<void>;
}

const IDLE_RUN: RunState = {
  phase: "idle",
  statusText: "",
  results: null,
  hadHiddenTests: false,
  error: null,
};

const MAX_LOG_LINES = 800;

/**
 * Hook que conecta el runner de WebContainer con la UI:
 * streaming de consola, resultados de Jest, ciclo de vida del
 * servidor y probador de endpoints. Marca el ejercicio como
 * resuelto cuando los tests ocultos pasan todos.
 */
export function useExerciseRunner(
  exercise: Exercise,
  contents: Record<string, string>,
): RunnerApi {
  const [run, setRun] = useState<RunState>(IDLE_RUN);
  const [solvedThisRun, setSolvedThisRun] = useState(false);
  const [showsInstall, setShowsInstall] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [server, setServer] = useState<ServerState>({ state: "stopped" });
  const [sending, setSending] = useState(false);
  const [response, setResponse] = useState<EndpointResponse | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);

  const stateRef = useRef({ exercise, contents });
  stateRef.current = { exercise, contents };

  const busyRef = useRef(false);
  const logRef = useRef<string[]>([]);
  const pendingLineRef = useRef("");

  /* ---------- Consola con acumulación de líneas ---------- */

  const appendLog = useCallback((chunk: string) => {
    const text = pendingLineRef.current + chunk;
    const parts = text.split("\n");
    pendingLineRef.current = parts.pop() ?? "";
    if (parts.length === 0) return;
    logRef.current = [...logRef.current, ...parts];
    if (logRef.current.length > MAX_LOG_LINES) {
      logRef.current = logRef.current.slice(
        logRef.current.length - MAX_LOG_LINES,
      );
    }
    setLog(logRef.current);
  }, []);

  const flushLog = useCallback(() => {
    if (!pendingLineRef.current) return;
    logRef.current = [...logRef.current, pendingLineRef.current];
    pendingLineRef.current = "";
    if (logRef.current.length > MAX_LOG_LINES) {
      logRef.current = logRef.current.slice(
        logRef.current.length - MAX_LOG_LINES,
      );
    }
    setLog(logRef.current);
  }, []);

  useEffect(() => {
    void runner.warmup(appendLog).catch((error) => {
      appendLog(
        `\n✖ No se pudo preparar el entorno: ${
          error instanceof Error ? error.message : String(error)
        }\n`,
      );
      flushLog();
    });
  }, [appendLog, flushLog]);

  useEffect(() => {
    setRestoring(container.activity === "restoring");
    return container.subscribeActivity(() => {
      const isRestoring = container.activity === "restoring";
      setRestoring(isRestoring);
      if (container.activity === null) return;
      setRun((current) => {
        if (current.phase !== "booting" && current.phase !== "installing") {
          return current;
        }
        return {
          ...current,
          phase: "installing",
          statusText: isRestoring
            ? "Restaurando dependencias…"
            : "Instalando dependencias. La primera vez tarda un poco…",
        };
      });
    });
  }, []);

  /* ---------- Tests ---------- */

  const runTests = useCallback(async () => {
    if (busyRef.current) return;
    const { exercise: current, contents: currentContents } = stateRef.current;

    busyRef.current = true;
    setSolvedThisRun(false);
    const needsInstall = !container.installed;
    setShowsInstall(needsInstall);
    setRun({
      ...IDLE_RUN,
      phase: "booting",
      statusText: needsInstall
        ? "Arrancando el entorno…"
        : "Preparando el proyecto…",
    });

    try {
      await container.boot();
      if (needsInstall) {
        setRun({
          ...IDLE_RUN,
          phase: "installing",
        statusText: container.activity === "restoring"
          ? "Restaurando dependencias…"
          : "Instalando dependencias. La primera vez tarda un poco…",
        });
      }
      await runner.prepare(current, currentContents, appendLog);
      flushLog();

      setRun({ ...IDLE_RUN, phase: "running", statusText: "Ejecutando Jest…" });
      const results = await runner.runTests(current, appendLog);
      flushLog();

      const hadHiddenTests = runner.exerciseHasHiddenTests(current);
      const allPassed =
        results.numFailedTests === 0 && results.numTotalTests > 0;

      setRun({
        phase: "done",
        statusText:
          results.numFailedTests === 0
            ? `${results.numTotalTests} tests pasando`
            : `${results.numFailedTests} de ${results.numTotalTests} tests fallan`,
        results,
        hadHiddenTests,
        error: null,
      });

      if (allPassed && hadHiddenTests && !isSolved(current.id)) {
        markSolved(current.id);
        setSolvedThisRun(true);
        appendLog(`\n✔ ¡Ejercicio "${current.title}" resuelto!\n`);
        flushLog();
      }
    } catch (error) {
      flushLog();
      setRun({
        ...IDLE_RUN,
        phase: "error",
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      busyRef.current = false;
    }
  }, [appendLog, flushLog]);

  /* ---------- Servidor ---------- */

  const startServer = useCallback(async () => {
    const { exercise: current, contents: currentContents } = stateRef.current;

    setServer({ state: "starting", statusText: "Preparando proyecto…" });
    try {
      await runner.prepare(current, currentContents, appendLog);
      flushLog();

      setServer({
        state: "starting",
        statusText: "Compilando y arrancando NestJS…",
      });
      const url = await runner.startServer(appendLog);
      flushLog();
      setServer({ state: "running", url });
    } catch (error) {
      flushLog();
      setServer({
        state: "error",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }, [appendLog, flushLog]);

  const stopServer = useCallback(() => {
    runner.stopServer(appendLog);
    setServer({ state: "stopped" });
    setResponse(null);
    setRequestError(null);
  }, [appendLog]);

  /* ---------- Peticiones HTTP ---------- */

  const sendRequest = useCallback(
    async (method: string, path: string, body: string | null) => {
      setSending(true);
      setRequestError(null);
      setResponse(null);
      try {
        const result = await runner.sendRequest(method, path, body);
        setResponse(result);
      } catch (error) {
        setRequestError(
          error instanceof Error ? error.message : String(error),
        );
      } finally {
        setSending(false);
      }
    },
    [],
  );

  /* ---------- Reset al cambiar de ejercicio ---------- */

  useEffect(() => {
    setRun(IDLE_RUN);
    setSolvedThisRun(false);
    setShowsInstall(false);
    setResponse(null);
    setRequestError(null);
  }, [exercise.id]);

  const busy =
    run.phase === "booting" ||
    run.phase === "installing" ||
    run.phase === "writing" ||
    run.phase === "running";

  return {
    phase: run.phase,
    statusText: run.statusText,
    results: run.results,
    hadHiddenTests: run.hadHiddenTests,
    error: run.error,
    solvedThisRun,
    log,
    busy,
    showsInstall,
    restoring,
    runTests,
    server,
    startServer,
    stopServer,
    sending,
    response,
    requestError,
    sendRequest,
  };
}
