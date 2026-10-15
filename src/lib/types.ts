export type Difficulty = "easy" | "medium";

export type FileLanguage = "typescript" | "json" | "markdown" | "css";

export interface ExerciseFile {
  /** Ruta relativa al proyecto, ej. "src/orders/orders.service.ts" */
  path: string;
  language: FileLanguage;
  /** Contenido inicial del ejercicio */
  content: string;
  readOnly?: boolean;
}

export interface Exercise {
  id: string;
  topicId: string;
  order: number;
  title: string;
  difficulty: Difficulty;
  /** Duración estimada en minutos */
  minutes: number;
  summary: string;
  objectives: string[];
  files: ExerciseFile[];
  hints: string[];
  /**
   * Tests ocultos que validan la solución. Se escriben en el
   * WebContainer al ejecutar (fase 4: se rellenan por ejercicio).
   */
  tests?: ExerciseFile[];
  /** Se rellena en la fase de contenido */
  solutionFiles: ExerciseFile[];
}

export interface Topic {
  id: string;
  order: number;
  title: string;
  tagline: string;
  description: string;
  exercises: Exercise[];
}

export interface Track {
  id: string;
  title: string;
  tagline: string;
  description: string;
  topics: Topic[];
}
