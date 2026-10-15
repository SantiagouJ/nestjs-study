import type { WebContainerProcess } from "@webcontainer/api";
import { container } from "./container";
import {
  hasContext,
  hiddenTestPaths,
  resolveProjectFiles,
} from "./template";
import type { EndpointResponse, JestResult } from "./types";
import type { Exercise } from "@/lib/types";

type LogListener = (chunk: string) => void;

/**
 * Motor de ejecución de ejercicios dentro de un WebContainer:
 * escribe el proyecto, instala dependencias, corre Jest,
 * arranca el servidor NestJS y hace peticiones contra él.
 */
class ExerciseRunner {
  private serverProcess: WebContainerProcess | null = null;

  /** Arranca el contenedor e instala dependencias sin esperar al clic. */
  warmup(onLog: LogListener = () => {}): Promise<void> {
    return container.warmup(onLog);
  }

  /**
   * Escribe el proyecto completo del ejercicio en el WebContainer
   * (arranca e instala dependencias en la primera ejecución).
   */
  async prepare(
    exercise: Exercise,
    contents: Record<string, string>,
    onLog: LogListener,
  ): Promise<void> {
    const files = resolveProjectFiles(exercise, contents);

    // Limpia archivos de ejercicios anteriores que ya no existen.
    const newPaths = new Set(files.map((file) => file.path));
    const stale = container.writtenPaths.filter((path) => !newPaths.has(path));
    if (stale.length > 0) {
      await container.removeFiles(stale);
    }

    // La instalación ya pudo empezar al abrir el ejercicio.
    if (!container.installed) {
      onLog(
        container.activity === "restoring"
          ? "▶ Restaurando dependencias…\n"
          : "▶ Instalando dependencias…\n",
      );
      await container.warmup(onLog);
    }

    await container.writeFiles(files);
    onLog(
      `✔ Proyecto "${exercise.title}" listo (${files.length} archivos)\n`,
    );
  }

  /**
   * Corrige Jest dentro del WebContainer y devuelve el resultado
   * estructurado. Lanza si Jest no pudo producir resultados.
   */
  async runTests(
    exercise: Exercise,
    onLog: LogListener,
  ): Promise<JestResult> {
    const { exitCode } = await container.spawn(
      "sh",
      [
        "-c",
        'npm test -- --json --outputFile=jest-results.json --colors=false 1>/dev/null',
      ],
      onLog,
    );

    let raw: string;
    try {
      raw = await container.readFile("jest-results.json");
    } catch {
      throw new Error(
        `Jest no produjo resultados (código de salida ${exitCode}). Revisa la consola.`,
      );
    }

    const parsed = JSON.parse(raw) as JestResult;

    if (!parsed.testResults || parsed.testResults.length === 0) {
      throw new Error(
        "No se encontraron archivos de tests (*.spec.ts) en este ejercicio.",
      );
    }

    return parsed;
  }

  /** Compila y arranca el servidor NestJS (modo watch). */
  async startServer(onLog: LogListener): Promise<string> {
    if (this.serverProcess) {
      this.stopServer(onLog);
    }

    const proc = await container.spawnLong(
      "npm",
      ["run", "start", "--", "--watch"],
      onLog,
    );
    this.serverProcess = proc;

    onLog("⏳ Esperando a que el servidor escuche en el puerto 3000…\n");
    const url = await container.waitForServer(3000);
    onLog(`✔ Servidor corriendo en ${url}\n`);
    return url;
  }

  stopServer(onLog: LogListener): void {
    if (!this.serverProcess) return;
    try {
      this.serverProcess.kill();
      onLog("■ Servidor detenido\n");
    } catch {
      // Ya estaba muerto.
    }
    this.serverProcess = null;
  }

  /**
   * Hace una petición HTTP contra el servidor que corre dentro del
   * WebContainer (la petición se ejecuta con Node dentro del
   * contenedor para evitar problemas de CORS con el proxy).
   */
  async sendRequest(
    method: string,
    path: string,
    body: string | null,
  ): Promise<EndpointResponse> {
    const scriptLines = [
      "const options = { method: " + JSON.stringify(method) + " };",
    ];
    if (body) {
      scriptLines.push(
        'options.headers = { "content-type": "application/json" };',
      );
      scriptLines.push("options.body = " + JSON.stringify(body) + ";");
    }
    scriptLines.push(
      "const res = await fetch(" +
        JSON.stringify("http://localhost:3000" + path) +
        ", options);",
    );
    scriptLines.push("const text = await res.text();");
    scriptLines.push(
      "let parsed = text; try { parsed = JSON.parse(text); } catch {}",
    );
    scriptLines.push(
      'console.log("@@RESULT@@" + JSON.stringify({ status: res.status, body: parsed }));',
    );

    await container.writeFiles([
      { path: "endpoint-request.mjs", content: scriptLines.join("\n") },
    ]);

    const { output } = await container.spawn(
      "node",
      ["endpoint-request.mjs"],
      () => {
        // La salida del script (el JSON) no interesa en la consola.
      },
    );

    const marker = output.indexOf("@@RESULT@@");
    if (marker === -1) {
      throw new Error(
        "No se pudo leer la respuesta. ¿Está el servidor corriendo?",
      );
    }

    const payload = JSON.parse(output.slice(marker + "@@RESULT@@".length)) as {
      status: number;
      body: unknown;
    };

    return {
      status: payload.status,
      ok: payload.status >= 200 && payload.status < 300,
      body: payload.body,
      raw: typeof payload.body === "string" ? payload.body : "",
    };
  }

  /** true si la corrida de tests incluyó tests ocultos (puede resolver el ejercicio). */
  exerciseHasHiddenTests(exercise: Exercise): boolean {
    return hiddenTestPaths(exercise).size > 0;
  }

  /** true si el ejercicio tiene contexto completo para ejecutarse. */
  exerciseHasContext(exercise: Exercise): boolean {
    return hasContext(exercise.id);
  }
}

export const runner = new ExerciseRunner();
