"use client";

import { useEffect, useRef, useState } from "react";
import type { RunnerApi } from "@/lib/webcontainer/useRunner";
import type { JestAssertionResult } from "@/lib/webcontainer/types";
import type { Exercise } from "@/lib/types";
import {
  CircleCheckIcon,
  GlobeIcon,
  PlayIcon,
  SendIcon,
  SquareIcon,
  TerminalIcon,
  XIcon,
} from "./icons";

type PanelTab = "tests" | "console" | "api";

const tabs: { id: PanelTab; label: string }[] = [
  { id: "tests", label: "Tests" },
  { id: "console", label: "Consola" },
  { id: "api", label: "API" },
];

const methods = ["GET", "POST", "PATCH", "DELETE"] as const;

const phaseRank: Record<string, number> = {
  booting: 0,
  installing: 1,
  writing: 1,
  running: 2,
};

function lastUsefulLine(log: string[]): string {
  for (let index = log.length - 1; index >= 0; index--) {
    const clean = log[index]
      .replace(/\u001b\[[0-9;]*[A-Za-z]/g, "")
      .replace(/\r/g, "")
      .trim();
    if (clean && !/^[/|\\-]+$/.test(clean)) return clean;
  }
  return "";
}

function RunSteps({ runner }: { runner: RunnerApi }) {
  const lastLine = lastUsefulLine(runner.log);
  const steps = [
    { id: "boot", label: "Arrancar el entorno", rank: 0 },
    ...(runner.showsInstall
      ? [{
          id: "install",
          label: runner.restoring
            ? "Restaurar dependencias"
            : "Instalar dependencias",
          rank: 1,
        }]
      : []),
    { id: "test", label: "Ejecutar los tests", rank: 2 },
  ];
  const current = phaseRank[runner.phase] ?? 0;

  return (
    <ol className="mt-4 flex flex-col gap-2">
      {steps.map((step) => {
        const done = step.rank < current;
        const active = step.rank === current;
        return (
          <li key={step.id} className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span
                className={[
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px]",
                  done
                    ? "bg-pass/15 text-pass"
                    : active
                      ? "bg-ink text-app"
                      : "bg-elevated text-ink-3",
                ].join(" ")}
              >
                {done ? "✓" : active ? "•" : ""}
              </span>
              <span
                className={[
                  "text-[13px]",
                  active ? "font-medium text-ink" : "text-ink-3",
                ].join(" ")}
              >
                {step.label}
              </span>
            </div>
            {active && (
              <p className="pl-6 font-mono text-[11px] leading-relaxed text-ink-3">
                {runner.statusText}
                {lastLine ? ` · ${lastLine.trim()}` : ""}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}

interface TestPanelProps {
  exercise: Exercise;
  runner: RunnerApi;
}

function basename(path: string): string {
  const parts = path.split("/");
  return parts[parts.length - 1] ?? path;
}

function StatusBadge({ status }: { status: number }) {
  const ok = status >= 200 && status < 300;
  return (
    <span
      className={[
        "rounded border px-1.5 py-px font-mono text-[11px] font-medium",
        ok ? "border-pass/30 text-pass" : "border-fail/30 text-fail",
      ].join(" ")}
    >
      {status}
    </span>
  );
}

function AssertionRow({ assertion }: { assertion: JestAssertionResult }) {
  const passed = assertion.status === "passed";
  return (
    <div className="flex flex-col gap-1 py-1.5">
      <div className="flex items-start gap-2">
        {passed ? (
          <CircleCheckIcon size={13} className="mt-0.5 shrink-0 text-pass" />
        ) : (
          <XIcon size={13} className="mt-0.5 shrink-0 text-fail" />
        )}
        <span
          className={[
            "text-[12px] leading-snug",
            passed ? "text-ink-2" : "text-ink",
          ].join(" ")}
        >
          {assertion.title}
        </span>
      </div>
      {!passed && assertion.failureMessages.length > 0 && (
        <pre className="ml-5 overflow-x-auto rounded border border-line-soft bg-app p-2.5 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-fail/90">
          {assertion.failureMessages.join("\n\n")}
        </pre>
      )}
    </div>
  );
}

/**
 * Panel inferior: tests de Jest, consola del WebContainer
 * y probador de endpoints contra el servidor NestJS.
 */
export default function TestPanel({ exercise, runner }: TestPanelProps) {
  const [activeTab, setActiveTab] = useState<PanelTab>("tests");

  // Consola: autoscroll
  const consoleRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = consoleRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [runner.log, activeTab]);

  // Probador de endpoints
  const [method, setMethod] = useState<(typeof methods)[number]>("GET");
  const [path, setPath] = useState("/orders");
  const [body, setBody] = useState(
    '{\n  "item": "Latte",\n  "quantity": 2,\n  "customerId": 1\n}',
  );

  const hasBody = method === "POST" || method === "PATCH";

  return (
    <div className="flex h-full flex-col bg-panel">
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-line px-3 py-1.5">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={[
              "rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors",
              activeTab === tab.id
                ? "bg-elevated text-ink"
                : "text-ink-3 hover:text-ink-2",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1.5 text-[11px] text-ink-3">
          <TerminalIcon size={12} />
          <span className="hidden sm:inline">Jest · WebContainer</span>
        </div>
      </div>

      {/* Tests */}
      {activeTab === "tests" && (
        <div className="flex-1 overflow-auto px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => void runner.runTests()}
              disabled={runner.busy}
              className={[
                "flex h-7 items-center gap-1.5 rounded-md px-3 text-[12px] font-medium transition-colors",
                runner.busy
                  ? "cursor-wait bg-ink/30 text-ink-3"
                  : "bg-ink text-app hover:bg-ink/90",
              ].join(" ")}
            >
              <PlayIcon size={11} strokeWidth={2} />
              {runner.busy ? "Ejecutando…" : "Ejecutar tests"}
            </button>

            {runner.phase !== "idle" &&
              runner.phase !== "done" &&
              !runner.busy && (
              <span className="text-[12px] text-ink-3">
                {runner.statusText}
              </span>
            )}

            {runner.phase === "done" && runner.results && (
              <span className="text-[12px]">
                <span className="text-pass">
                  {runner.results.numPassedTests} pasando
                </span>
                {runner.results.numFailedTests > 0 && (
                  <>
                    {" · "}
                    <span className="text-fail">
                      {runner.results.numFailedTests} fallando
                    </span>
                  </>
                )}
              </span>
            )}
          </div>

          {/* Resuelto */}
          {runner.solvedThisRun && (
            <div className="mt-3 flex items-center gap-2 rounded-md border border-pass/30 bg-pass/10 px-3 py-2">
              <CircleCheckIcon size={14} className="shrink-0 text-pass" />
              <p className="text-[12px] text-pass">
                ¡Todos los tests pasan! Ejercicio resuelto.
              </p>
            </div>
          )}

          {/* Error del runner */}
          {runner.phase === "error" && runner.error && (
            <div className="mt-3 rounded-md border border-fail/30 bg-fail/10 px-3 py-2">
              <p className="font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-fail">
                {runner.error}
              </p>
            </div>
          )}

          {/* Resultados */}
          {runner.results && (
            <div className="mt-3 flex flex-col gap-3">
              {runner.results.testResults.map((suite) => (
                <div
                  key={suite.name}
                  className="rounded-md border border-line"
                >
                  <div className="flex items-center gap-2 border-b border-line-soft bg-elevated px-3 py-1.5">
                    {suite.status === "passed" ? (
                      <CircleCheckIcon size={12} className="text-pass" />
                    ) : (
                      <XIcon size={12} className="text-fail" />
                    )}
                    <span className="font-mono text-[11px] text-ink-2">
                      {basename(suite.name)}
                    </span>
                    {suite.status !== "passed" && suite.message && (
                      <span className="ml-auto font-mono text-[10px] text-fail">
                        suite fallida
                      </span>
                    )}
                  </div>

                  <div className="divide-y divide-line-soft px-3 py-1">
                    {suite.assertionResults.map((assertion) => (
                      <AssertionRow
                        key={assertion.title}
                        assertion={assertion}
                      />
                    ))}
                    {suite.message && (
                      <pre className="overflow-x-auto py-2 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-fail/90">
                        {suite.message}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {runner.busy && <RunSteps runner={runner} />}

          {/* Estado inicial */}
          {runner.phase === "idle" && (
            <div className="flex h-[60%] flex-col items-center justify-center gap-2 text-center">
              <FlaskIcon />
              <p className="text-[13px] font-medium text-ink-2">
                Tests de {exercise.title}
              </p>
              <p className="max-w-sm text-[12px] leading-relaxed text-ink-3">
                Se ejecutan dentro de un WebContainer con Jest y mocks de
                TypeORM. La primera ejecución instala las dependencias y puede
                tardar un par de minutos. Recargar la página borra el editor y
                apaga el contenedor: hay que volver a ejecutar los tests.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Consola */}
      {activeTab === "console" && (
        <div
          ref={consoleRef}
          className="flex-1 overflow-auto px-3 py-2 font-mono text-[11px] leading-relaxed"
        >
          {runner.log.length === 0 ? (
            <p className="text-ink-3">
              La salida del WebContainer aparecerá aquí (npm install, Jest,
              servidor…).
            </p>
          ) : (
            runner.log.map((line, index) => (
              <div
                key={index}
                className="whitespace-pre-wrap break-words text-ink-2"
              >
                {line || " "}
              </div>
            ))
          )}
        </div>
      )}

      {/* API */}
      {activeTab === "api" && (
        <div className="flex-1 overflow-auto px-4 py-3">
          {/* Servidor */}
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={[
                "h-1.5 w-1.5 rounded-full",
                runner.server.state === "running"
                  ? "bg-pass"
                  : runner.server.state === "error"
                    ? "bg-fail"
                    : "bg-ink-3",
              ].join(" ")}
            />
            <span className="text-[12px] text-ink-2">
              {runner.server.state === "running"
                ? "Servidor corriendo"
                : runner.server.state === "starting"
                  ? runner.server.statusText
                  : runner.server.state === "error"
                    ? "El servidor falló"
                    : "Servidor detenido"}
            </span>
            {runner.server.state === "running" && (
              <a
                href={runner.server.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 font-mono text-[11px] text-ink-3 underline-offset-2 hover:text-ink-2 hover:underline"
              >
                <GlobeIcon size={11} />
                {runner.server.url}
              </a>
            )}
            {runner.server.state === "running" ? (
              <button
                onClick={runner.stopServer}
                className="flex h-6 items-center gap-1.5 rounded-md border border-line px-2 text-[11px] text-ink-2 transition-colors hover:bg-hover"
              >
                <SquareIcon size={9} />
                Detener
              </button>
            ) : (
              <button
                onClick={() => void runner.startServer()}
                disabled={runner.server.state === "starting"}
                className={[
                  "flex h-6 items-center gap-1.5 rounded-md border border-line px-2 text-[11px] transition-colors",
                  runner.server.state === "starting"
                    ? "cursor-wait text-ink-3"
                    : "text-ink-2 hover:bg-hover",
                ].join(" ")}
              >
                <PlayIcon size={9} strokeWidth={2} />
                {runner.server.state === "starting"
                  ? "Arrancando…"
                  : "Iniciar servidor"}
              </button>
            )}
          </div>

          {runner.server.state === "error" && (
            <p className="mt-2 font-mono text-[11px] text-fail">
              {runner.server.error}
            </p>
          )}

          {/* Constructor de peticiones */}
          <div className="mt-4 flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={method}
                onChange={(event) =>
                  setMethod(event.target.value as (typeof methods)[number])
                }
                className="h-7 rounded-md border border-line bg-elevated px-2 font-mono text-[11px] text-ink"
              >
                {methods.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <input
                value={path}
                onChange={(event) => setPath(event.target.value)}
                placeholder="/orders"
                spellCheck={false}
                className="h-7 min-w-0 flex-1 rounded-md border border-line bg-elevated px-2 font-mono text-[11px] text-ink placeholder:text-ink-3"
              />
              <button
                onClick={() =>
                  void runner.sendRequest(
                    method,
                    path.startsWith("/") ? path : `/${path}`,
                    hasBody ? body : null,
                  )
                }
                disabled={runner.sending || runner.server.state !== "running"}
                className={[
                  "flex h-7 items-center gap-1.5 rounded-md px-3 text-[11px] font-medium transition-colors",
                  runner.sending || runner.server.state !== "running"
                    ? "cursor-not-allowed bg-ink/30 text-ink-3"
                    : "bg-ink text-app hover:bg-ink/90",
                ].join(" ")}
              >
                <SendIcon size={10} />
                {runner.sending ? "Enviando…" : "Enviar"}
              </button>
            </div>

            {hasBody && (
              <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                rows={5}
                spellCheck={false}
                className="w-full resize-y rounded-md border border-line bg-elevated p-2.5 font-mono text-[11px] leading-relaxed text-ink"
              />
            )}

            {!runner.sending && runner.server.state !== "running" && (
              <p className="text-[11px] text-ink-3">
                Inicia el servidor para probar endpoints (las peticiones se
                ejecutan dentro del WebContainer).
              </p>
            )}
          </div>

          {/* Respuesta */}
          {(runner.response || runner.requestError) && (
            <div className="mt-4">
              <p className="pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-ink-3">
                Respuesta
              </p>
              {runner.requestError ? (
                <div className="rounded-md border border-fail/30 bg-fail/10 px-3 py-2">
                  <p className="font-mono text-[11px] text-fail">
                    {runner.requestError}
                  </p>
                </div>
              ) : (
                runner.response && (
                  <div className="rounded-md border border-line">
                    <div className="flex items-center gap-2 border-b border-line-soft bg-elevated px-3 py-1.5">
                      <StatusBadge status={runner.response.status} />
                      <span className="text-[11px] text-ink-3">
                        {method} {path}
                      </span>
                    </div>
                    <pre className="max-h-64 overflow-auto p-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-ink-2">
                      {typeof runner.response.body === "string"
                        ? runner.response.body
                        : JSON.stringify(runner.response.body, null, 2)}
                    </pre>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FlaskIcon() {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-md border border-line bg-elevated text-ink-3">
      <TerminalIcon size={16} />
    </div>
  );
}
