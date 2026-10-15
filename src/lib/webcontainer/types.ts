/** Resultado estructurado de una ejecución de Jest (--json). */
export interface JestAssertionResult {
  title: string;
  status: "passed" | "failed" | "todo" | "skipped";
  failureMessages: string[];
}

export interface JestSuiteResult {
  name: string;
  status: string;
  /** Presente cuando la suite no pudo ejecutarse (error de compilación, etc.) */
  message?: string;
  assertionResults: JestAssertionResult[];
}

export interface JestResult {
  numPassedTests: number;
  numFailedTests: number;
  numTotalTests: number;
  numPassedTestSuites: number;
  numFailedTestSuites: number;
  testResults: JestSuiteResult[];
}

/** Fases de una ejecución de tests. */
export type RunPhase =
  | "idle"
  | "booting"
  | "installing"
  | "writing"
  | "running"
  | "done"
  | "error";

export interface RunState {
  phase: RunPhase;
  /** Texto de estado para la fase actual */
  statusText: string;
  results: JestResult | null;
  /** true cuando la corrida incluyó tests ocultos (permite resolver el ejercicio) */
  hadHiddenTests: boolean;
  error: string | null;
}

export type ServerState =
  | { state: "stopped" }
  | { state: "starting"; statusText: string }
  | { state: "running"; url: string }
  | { state: "error"; error: string };

export interface EndpointResponse {
  status: number;
  ok: boolean;
  body: unknown;
  /** Cuerpo crudo cuando no es JSON válido */
  raw: string;
}
