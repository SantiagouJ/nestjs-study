"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  MouseEvent as ReactMouseEvent,
} from "react";
import CodeEditor from "./CodeEditor";
import DifficultyBadge from "./DifficultyBadge";
import EditorTabs, { type OpenFile } from "./EditorTabs";
import {
  ChevronDownIcon,
  ClockIcon,
  EyeIcon,
  LightbulbIcon,
  PlayIcon,
  RotateCcwIcon,
  XIcon,
} from "./icons";
import Sidebar, { SidebarToggle } from "./Sidebar";
import TestPanel from "./TestPanel";
import type { Exercise, ExerciseFile, Topic } from "@/lib/types";
import { useExerciseRunner } from "@/lib/webcontainer/useRunner";
import ExerciseStatement from "@/components/ExerciseStatement";
import CommandPalette, {
  type PaletteAction,
} from "@/components/CommandPalette";

interface ExerciseWorkspaceProps {
  exercise: Exercise;
  topic: Topic;
  topics: Topic[];
}

const MIN_PANEL_HEIGHT = 160;
const MAX_PANEL_HEIGHT = 440;
const DEFAULT_PANEL_HEIGHT = 168;

function initialContents(files: ExerciseFile[]): Record<string, string> {
  return Object.fromEntries(files.map((file) => [file.path, file.content]));
}

function firstEditable(files: ExerciseFile[]): string {
  const editable = files.find((file) => !file.readOnly);
  return (editable ?? files[0]).path;
}

/**
 * Workspace de ejercicio: sidebar (ejercicios + archivos),
 * tabs + editor, panel inferior de tests.
 */
export default function ExerciseWorkspace({
  exercise,
  topic,
  topics,
}: ExerciseWorkspaceProps) {
  const [contents, setContents] = useState<Record<string, string>>(() =>
    initialContents(exercise.files),
  );
  const [openFiles, setOpenFiles] = useState<OpenFile[]>(() => [
    { path: firstEditable(exercise.files), dirty: false },
  ]);
  const [activePath, setActivePath] = useState(() =>
    firstEditable(exercise.files),
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [solutionPath, setSolutionPath] = useState<string | null>(null);
  const [panelHeight, setPanelHeight] = useState(DEFAULT_PANEL_HEIGHT);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  const router = useRouter();
  const runner = useExerciseRunner(exercise, contents);

  const openSolution = useCallback(() => {
    if (exercise.solutionFiles.length === 0) {
      setSolutionPath(null);
      setShowSolution(true);
      return;
    }

    setContents((prev) => {
      const next = { ...prev };
      for (const file of exercise.solutionFiles) {
        next[file.path] = file.content;
      }
      return next;
    });
    setOpenFiles(
      exercise.solutionFiles.map((file) => ({ path: file.path, dirty: true })),
    );
    setActivePath(exercise.solutionFiles[0].path);
    setSolutionPath(exercise.solutionFiles[0].path);
    setShowSolution(false);
  }, [exercise.solutionFiles]);

  const paletteActions = useMemo<PaletteAction[]>(() => {
    const navigation = topics.flatMap((item) =>
      item.exercises.map((itemExercise) => ({
        id: `go:${itemExercise.id}`,
        label: `Ir a ${item.title}: ${itemExercise.title}`,
      })),
    );

    return [
      { id: "run-tests", label: "Ejecutar tests" },
      { id: "show-solution", label: "Ver solución" },
      ...navigation,
    ];
  }, [topics]);

  const onPaletteSelect = useCallback(
    (action: PaletteAction) => {
      setCommandPaletteOpen(false);
      if (action.id === "run-tests") {
        void runner.runTests();
        return;
      }
      if (action.id === "show-solution") {
        openSolution();
        return;
      }
      if (action.id.startsWith("go:")) {
        router.push(`/exercise/${action.id.slice(3)}`);
      }
    },
    [openSolution, router, runner],
  );

  const closePalette = useCallback(() => {
    setCommandPaletteOpen(false);
  }, []);

  const workspaceRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startY: number; startHeight: number } | null>(
    null,
  );

  /* ---------- Archivos ---------- */

  const selectFile = useCallback((path: string) => {
    setActivePath(path);
    setOpenFiles((prev) =>
      prev.some((file) => file.path === path)
        ? prev
        : [...prev, { path, dirty: false }],
    );
  }, []);

  const handleChange = useCallback(
    (path: string) => (value: string) => {
      setContents((prev) => ({ ...prev, [path]: value }));
      setOpenFiles((prev) =>
        prev.map((file) =>
          file.path === path && !file.dirty ? { ...file, dirty: true } : file,
        ),
      );
    },
    [],
  );

  const closeFile = useCallback((path: string) => {
    setOpenFiles((prev) => {
      const index = prev.findIndex((file) => file.path === path);
      const next = prev.filter((file) => file.path !== path);
      if (prev[index]?.path === path) {
        setActivePath((current) => {
          if (current !== path) return current;
          const neighbor = next[index] ?? next[index - 1];
          return neighbor?.path ?? "";
        });
      }
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setContents(initialContents(exercise.files));
    setOpenFiles([{ path: firstEditable(exercise.files), dirty: false }]);
    setActivePath(firstEditable(exercise.files));
  }, [exercise.files]);

  /* ---------- Splitter del panel inferior ---------- */

  const onSplitterMouseDown = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      event.preventDefault();
      dragRef.current = { startY: event.clientY, startHeight: panelHeight };
    },
    [panelHeight],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandPaletteOpen((open) => !open);
      }
    };

    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, []);

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const delta = drag.startY - event.clientY;
      const next = Math.min(
        MAX_PANEL_HEIGHT,
        Math.max(MIN_PANEL_HEIGHT, drag.startHeight + delta),
      );
      setPanelHeight(next);
    };

    const onMouseUp = () => {
      dragRef.current = null;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  /* ---------- Render ---------- */

  const activeFile = exercise.files.find((file) => file.path === activePath);
  const activeContent = activePath ? contents[activePath] ?? "" : "";
  const activeSolution = exercise.solutionFiles.find(
    (file) => file.path === solutionPath,
  ) ?? exercise.solutionFiles[0];

  return (
    <div className="flex h-screen" ref={workspaceRef}>
      {/* Sidebar */}
      <aside
        className={[
          "flex h-full shrink-0 flex-col border-r border-line bg-panel transition-[width] duration-200",
          sidebarCollapsed ? "w-0 overflow-hidden border-r-0" : "w-64",
        ].join(" ")}
      >
        <Sidebar
          topics={topics}
          activeTopicId={topic.id}
          activeExerciseId={exercise.id}
          files={exercise.files}
          activePath={activePath}
          onSelectFile={selectFile}
        />
      </aside>

      {/* Columna principal */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="flex items-center gap-3 border-b border-line px-4 py-2.5">
          <SidebarToggle
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed((v) => !v)}
          />

          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] text-ink-3">
              Track <span className="mx-1 text-ink-3/60">›</span>{" "}
              {topic.title}
            </p>
            <h1 className="truncate text-[14px] font-semibold tracking-tight">
              {exercise.title}
            </h1>
          </div>

          <DifficultyBadge difficulty={exercise.difficulty} />

          <span className="hidden items-center gap-1.5 text-[11px] text-ink-3 md:flex">
            <ClockIcon size={12} />
            {exercise.minutes} min
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowHints((v) => !v)}
              title="Pistas"
              className={[
                "flex h-7 items-center gap-1.5 rounded-md px-2 text-[12px] transition-colors",
                showHints
                  ? "bg-elevated text-ink"
                  : "text-ink-3 hover:bg-hover hover:text-ink-2",
              ].join(" ")}
            >
              <LightbulbIcon size={13} />
              <span className="hidden sm:inline">Pistas</span>
              <span className="rounded-full border border-line px-1.5 text-[10px]">
                {exercise.hints.length}
              </span>
            </button>

            <button
              onClick={openSolution}
              title="Ver solución"
              className="flex h-7 items-center gap-1.5 rounded-md px-2 text-[12px] text-ink-3 transition-colors hover:bg-hover hover:text-ink-2"
            >
              <EyeIcon size={13} />
              <span className="hidden sm:inline">Solución</span>
            </button>

            <button
              onClick={reset}
              title="Reiniciar ejercicio"
              className="flex h-7 w-7 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-hover hover:text-ink-2"
            >
              <RotateCcwIcon size={13} />
            </button>

            <button
              onClick={() => void runner.runTests()}
              disabled={runner.busy}
              title="Ejecutar tests en el WebContainer"
              className={[
                "ml-1 flex h-7 items-center gap-1.5 rounded-md px-3 text-[12px] font-medium transition-colors",
                runner.busy
                  ? "cursor-wait bg-ink/30 text-ink-3"
                  : "bg-ink text-app hover:bg-ink/90",
              ].join(" ")}
            >
              <PlayIcon size={11} strokeWidth={2} />
              {runner.busy ? "Ejecutando…" : "Ejecutar"}
            </button>
          </div>
        </header>

        {/* Statement / enunciado del ejercicio */}
        <ExerciseStatement summary={exercise.summary} />

        {/* Pistas */}
        {showHints && (
          <div className="flex flex-col gap-2 border-b border-line px-4 py-2.5">
            {exercise.hints.map((hint, index) => (
              <div
                key={hint}
                className="flex items-start gap-2.5 rounded-md border border-line bg-panel px-3 py-2"
              >
                <LightbulbIcon
                  size={13}
                  className="mt-0.5 shrink-0 text-warn"
                />
                <p className="text-[12px] leading-relaxed text-ink-2">
                  <span className="mr-1.5 font-medium text-ink-3">
                    {index + 1}.
                  </span>
                  {hint}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs + editor + panel inferior */}
        <div className="flex min-h-0 flex-1 flex-col">
          <EditorTabs
            openFiles={openFiles}
            activePath={activePath}
            onSelect={selectFile}
            onClose={closeFile}
          />

          <div className="min-h-0 flex-1">
            {activeFile ? (
              <CodeEditor
                key={activeFile.path}
                file={activeFile}
                content={activeContent}
                onChange={handleChange(activeFile.path)}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[13px] text-ink-3">
                Selecciona un archivo para editar
              </div>
            )}
          </div>

          {/* Splitter */}
          <div
            onMouseDown={onSplitterMouseDown}
            className="group flex h-1.5 shrink-0 cursor-row-resize items-center justify-center border-y border-line-soft bg-panel hover:bg-hover"
            title="Arrastra para redimensionar"
          >
            <div className="h-0.5 w-10 rounded-full bg-ink-3/40 transition-colors group-hover:bg-ink-3" />
          </div>

          <div style={{ height: panelHeight }} className="shrink-0">
            <TestPanel exercise={exercise} runner={runner} />
          </div>
        </div>
      </div>

      {/* Modal de solución */}
      {commandPaletteOpen && (
        <CommandPalette
          actions={paletteActions}
          onSelect={onPaletteSelect}
          onClose={closePalette}
        />
      )}

      {showSolution && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm"
          onClick={() => setShowSolution(false)}
        >
          <div
            className="flex h-[70vh] w-full max-w-3xl flex-col rounded-lg border border-line bg-panel shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
              <span className="flex-1 text-[13px] font-semibold">
                Solución
              </span>
              {exercise.solutionFiles.length > 1 &&
                exercise.solutionFiles.map((file) => (
                  <button
                    key={file.path}
                    onClick={() => setSolutionPath(file.path)}
                    className={[
                      "rounded-md px-2 py-1 text-[11px] transition-colors",
                      (activeSolution?.path ?? "") === file.path
                        ? "bg-elevated text-ink"
                        : "text-ink-3 hover:text-ink-2",
                    ].join(" ")}
                  >
                    {file.path.split("/").pop()}
                  </button>
                ))}
              <button
                onClick={() => setShowSolution(false)}
                className="flex h-6 w-6 items-center justify-center rounded-md text-ink-3 hover:bg-hover hover:text-ink"
                aria-label="Cerrar solución"
              >
                <XIcon size={13} />
              </button>
            </div>

            <div className="min-h-0 flex-1">
              {activeSolution ? (
                <CodeEditor file={activeSolution} content={activeSolution.content} />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
                  <ChevronDownIcon size={18} className="rotate-90 text-ink-3" />
                  <p className="max-w-xs text-[12px] leading-relaxed text-ink-3">
                    Este ejercicio todavía no tiene solución publicada.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}