import { WebContainer, type WebContainerProcess } from "@webcontainer/api";
import { readDepCache, writeDepCache } from "./depCache";
import { baseFiles, dependencyCacheKey } from "./template";

type LogListener = (chunk: string) => void;

/**
 * Gestor del WebContainer (singleton por pestaña).
 *
 * - Arranca el contenedor bajo demanda. `coep` coincide con la
 *   cabecera Cross-Origin-Embedder-Policy del documento.
 * - Instala las dependencias de npm una sola vez por sesión.
 * - Expone helpers para escribir archivos, ejecutar comandos con
 *   streaming de salida y leer archivos del sistema virtual.
 */
class WebContainerManager {
  private instance: WebContainer | null = null;
  private bootPromise: Promise<WebContainer> | null = null;
  private installPromise: Promise<void> | null = null;
  private warmupPromise: Promise<void> | null = null;
  private activityListeners = new Set<() => void>();
  /** `restoring` cuando se monta una copia guardada; `installing` en npm install. */
  activity: "restoring" | "installing" | null = null;
  private serverUrl: string | null = null;
  private serverPort: number | null = null;
  private serverWaiters: Array<{
    port: number;
    resolve: (url: string) => void;
    reject: (error: Error) => void;
  }> = [];

  installed = false;
  /** Rutas escritas por `writeFiles` (para limpiar archivos obsoletos). */
  writtenPaths: string[] = [];

  async boot(): Promise<WebContainer> {
    if (this.instance) return this.instance;
    if (this.bootPromise) return this.bootPromise;

    this.bootPromise = WebContainer.boot({
      coep: "credentialless",
      workdirName: "nestjs-study",
    })
      .then((wcs) => {
        this.instance = wcs;
        wcs.on("server-ready", (port, url) => {
          this.serverUrl = url;
          this.serverPort = port;
          const pending = this.serverWaiters.filter(
            (waiter) => waiter.port === port,
          );
          this.serverWaiters = this.serverWaiters.filter(
            (waiter) => waiter.port !== port,
          );
          for (const waiter of pending) waiter.resolve(url);
        });
        wcs.on("error", (error) => {
          console.error("[webcontainer]", error);
        });
        return wcs;
      })
      .catch((error) => {
        this.bootPromise = null;
        throw error;
      });

    return this.bootPromise;
  }

  async writeFiles(files: { path: string; content: string }[]): Promise<void> {
    const wcs = await this.boot();
    for (const file of files) {
      const dir = file.path.split("/").slice(0, -1).join("/");
      if (dir) {
        await wcs.fs.mkdir(dir, { recursive: true });
      }
      await wcs.fs.writeFile(file.path, file.content);
      if (!this.writtenPaths.includes(file.path)) {
        this.writtenPaths.push(file.path);
      }
    }
  }

  async removeFiles(paths: string[]): Promise<void> {
    const wcs = await this.boot();
    for (const path of paths) {
      await wcs.fs.rm(path, { force: true });
      this.writtenPaths = this.writtenPaths.filter(
        (written) => written !== path,
      );
    }
  }

  /**
   * Arranca el contenedor, escribe la configuración compartida
   * e instala dependencias. Se puede llamar al abrir el ejercicio;
   * las llamadas siguientes esperan la misma instalación.
   */
  warmup(onLog: LogListener = () => {}): Promise<void> {
    if (this.installed) return Promise.resolve();
    if (!this.warmupPromise) {
      this.warmupPromise = this.bootAndInstall(onLog).catch((error) => {
        this.warmupPromise = null;
        throw error;
      });
    }
    return this.warmupPromise;
  }

  private setActivity(next: "restoring" | "installing" | null) {
    this.activity = next;
    for (const listener of this.activityListeners) listener();
  }

  subscribeActivity(listener: () => void): () => void {
    this.activityListeners.add(listener);
    return () => {
      this.activityListeners.delete(listener);
    };
  }

  private async bootAndInstall(onLog: LogListener): Promise<void> {
    await this.boot();
    if (this.installed) return;
    await this.writeFiles(baseFiles);

    const key = dependencyCacheKey();
    const cached = await readDepCache(key);
    if (cached) {
      this.setActivity("restoring");
      onLog("▶ Restaurando dependencias guardadas…\n");
      try {
        await this.instance!.mount({
          node_modules: { directory: cached },
        });
        const chmod = await this.instance!.spawn("chmod", [
          "-R",
          "a+x",
          "node_modules/.bin",
        ]);
        await chmod.exit;
        this.installed = true;
        onLog("\n✔ Dependencias restauradas\n");
        return;
      } catch {
        onLog("No se pudo restaurar la caché. Instalando de nuevo…\n");
      }
    }

    this.setActivity("installing");
    await this.ensureInstalled(onLog);
    await this.saveDepCache(key, onLog);
  }

  private async saveDepCache(key: string, onLog: LogListener): Promise<void> {
    try {
      const tree = await this.instance!.export("node_modules", {
        format: "json",
      });
      await writeDepCache(key, tree);
      onLog("✔ Dependencias guardadas para la próxima visita\n");
    } catch {
      onLog("No se pudo guardar la caché de dependencias\n");
    }
  }

  /**
   * npm install (solo la primera vez). Requiere que `package.json`
   * ya esté escrito en el sistema de archivos virtual.
   */
  async ensureInstalled(onLog: LogListener): Promise<void> {
    await this.boot();
    if (this.installed) return;
    if (this.installPromise) return this.installPromise;

    this.installPromise = this.install(onLog).then(() => {
      this.installed = true;
    });

    try {
      await this.installPromise;
    } catch (error) {
      this.installPromise = null;
      throw error;
    }
    return this.installPromise;
  }

  private async install(onLog: LogListener): Promise<void> {
    const wcs = this.instance!;
    onLog("$ npm install --no-audit --no-fund\n");
    const proc = await wcs.spawn("npm", ["install", "--no-audit", "--no-fund"], {
      terminal: { cols: 100, rows: 30 },
    });
    const { exitCode } = await this.stream(proc, onLog);
    if (exitCode !== 0) {
      throw new Error(`npm install terminó con código ${exitCode}`);
    }
    onLog("\n✔ Dependencias instaladas\n");
  }

  /**
   * Ejecuta un comando a corto plazo y devuelve el código de salida
   * junto con la salida completa capturada.
   */
  async spawn(
    command: string,
    args: string[],
    onLog: LogListener,
  ): Promise<{ exitCode: number; output: string }> {
    const wcs = await this.boot();
    onLog(`$ ${command} ${args.join(" ")}\n`);
    const proc = await wcs.spawn(command, args, {
      terminal: { cols: 100, rows: 30 },
    });
    const { exitCode, output } = await this.stream(proc, onLog);
    return { exitCode, output };
  }

  /**
   * Ejecuta un comando de larga duración (el servidor). La salida
   * se sigue enviando a `onLog` en segundo plano.
   */
  async spawnLong(
    command: string,
    args: string[],
    onLog: LogListener,
  ): Promise<WebContainerProcess> {
    const wcs = await this.boot();
    onLog(`$ ${command} ${args.join(" ")}\n`);
    const proc = await wcs.spawn(command, args, {
      terminal: { cols: 100, rows: 30 },
    });
    // No se await: el servidor vive hasta que se mata.
    void this.stream(proc, onLog);
    return proc;
  }

  private async stream(
    proc: WebContainerProcess,
    onLog: LogListener,
  ): Promise<{ exitCode: number; output: string }> {
    const reader = proc.output.getReader();
    let output = "";
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        output += value;
        onLog(value);
      }
    } catch {
      // El proceso fue matado: el stream se cierra.
    }
    const exitCode = await proc.exit;
    return { exitCode, output };
  }

  async readFile(path: string): Promise<string> {
    const wcs = await this.boot();
    return wcs.fs.readFile(path, "utf-8");
  }

  /** Espera a que un servidor escuche en el puerto indicado. */
  waitForServer(
    port: number,
    timeoutMs = 150_000,
  ): Promise<string> {
    if (this.serverPort === port && this.serverUrl) {
      return Promise.resolve(this.serverUrl);
    }
    return new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.serverWaiters = this.serverWaiters.filter(
          (waiter) => waiter.resolve !== resolve,
        );
        reject(new Error(`El servidor no respondió en ${timeoutMs / 1000}s`));
      }, timeoutMs);
      this.serverWaiters.push({
        port,
        resolve: (url) => {
          clearTimeout(timer);
          resolve(url);
        },
        reject,
      });
    });
  }
}

export const container = new WebContainerManager();
