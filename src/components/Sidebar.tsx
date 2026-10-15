"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FileCodeIcon,
  FolderIcon,
} from "./icons";
import type { ExerciseFile, Topic } from "@/lib/types";
import { useProgress } from "@/lib/progress";
import DifficultyBadge from "./DifficultyBadge";

/* ---------- Árbol de archivos ---------- */

interface TreeNode {
  name: string;
  path: string;
  children: TreeNode[];
  isFile: boolean;
}

function buildTree(files: ExerciseFile[]): TreeNode[] {
  const root: TreeNode = { name: "", path: "", children: [], isFile: false };

  for (const file of files) {
    const segments = file.path.split("/");
    let current = root;

    segments.forEach((segment, index) => {
      const isFile = index === segments.length - 1;
      const path = segments.slice(0, index + 1).join("/");

      let child = current.children.find((node) => node.name === segment);
      if (!child) {
        child = { name: segment, path, children: [], isFile };
        current.children.push(child);
      }
      current = child;
    });
  }

  const sort = (nodes: TreeNode[]): TreeNode[] =>
    nodes.sort((a, b) => {
      if (a.isFile !== b.isFile) return a.isFile ? 1 : -1;
      return a.name.localeCompare(b.name);
    });

  const walk = (nodes: TreeNode[]) => {
    sort(nodes);
    nodes.forEach((node) => walk(node.children));
  };

  walk(root.children);
  return root.children;
}

function TreeNodes({
  nodes,
  depth,
  activePath,
  onSelect,
}: {
  nodes: TreeNode[];
  depth: number;
  activePath: string;
  onSelect: (path: string) => void;
}) {
  return (
    <>
      {nodes.map((node) => (
        <div key={node.path}>
          {node.isFile ? (
            <button
              onClick={() => onSelect(node.path)}
              title={node.path}
              className={[
                "flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-[12px] transition-colors",
                activePath === node.path
                  ? "bg-elevated text-ink"
                  : "text-ink-3 hover:bg-hover hover:text-ink-2",
              ].join(" ")}
              style={{ paddingLeft: `${depth * 12 + 6}px` }}
            >
              <FileCodeIcon size={13} className="shrink-0 text-ink-3" />
              <span className="truncate">{node.name}</span>
            </button>
          ) : (
            <div
              className="flex items-center gap-1.5 px-1.5 py-1 text-[11px] font-medium uppercase tracking-wide text-ink-3"
              style={{ paddingLeft: `${depth * 12 + 6}px` }}
            >
              <FolderIcon size={12} className="shrink-0" />
              <span className="truncate">{node.name}</span>
            </div>
          )}
          {node.children.length > 0 && (
            <TreeNodes
              nodes={node.children}
              depth={depth + 1}
              activePath={activePath}
              onSelect={onSelect}
            />
          )}
        </div>
      ))}
    </>
  );
}

/* ---------- Sidebar del workspace ---------- */

interface SidebarProps {
  topics: Topic[];
  activeTopicId: string;
  activeExerciseId: string;
  files: ExerciseFile[];
  activePath: string;
  onSelectFile: (path: string) => void;
}

/**
 * Sidebar del workspace: navegación por temas/ejercicios y
 * árbol de archivos del ejercicio activo (estilo Scrimba).
 */
export default function Sidebar({
  topics,
  activeTopicId,
  activeExerciseId,
  files,
  activePath,
  onSelectFile,
}: SidebarProps) {
  const tree = useMemo(() => buildTree(files), [files]);
  const [filesOpen, setFilesOpen] = useState(true);
  const [trackOpen, setTrackOpen] = useState(true);
  const { isDone } = useProgress();
  const [openTopics, setOpenTopics] = useState<Set<string>>(
    () => new Set([activeTopicId]),
  );

  useEffect(() => {
    setOpenTopics((current) => {
      if (current.has(activeTopicId)) return current;
      const next = new Set(current);
      next.add(activeTopicId);
      return next;
    });
  }, [activeTopicId]);

  function toggleTopic(topicId: string) {
    setOpenTopics((current) => {
      const next = new Set(current);
      if (next.has(topicId)) next.delete(topicId);
      else next.add(topicId);
      return next;
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <section className="flex min-h-0 shrink-0 flex-col border-b border-line">
        <button
          type="button"
          onClick={() => setFilesOpen((open) => !open)}
          aria-expanded={filesOpen}
          className="flex items-center gap-1.5 px-3.5 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-ink-3 hover:text-ink-2"
        >
          <ChevronDownIcon
            size={11}
            className={[
              "shrink-0 transition-transform",
              filesOpen ? "" : "-rotate-90",
            ].join(" ")}
          />
          Archivos
        </button>
        {filesOpen && (
          <div className="max-h-56 overflow-y-auto px-2 pb-3">
            <TreeNodes
              nodes={tree}
              depth={0}
              activePath={activePath}
              onSelect={onSelectFile}
            />
          </div>
        )}
      </section>

      <section className="flex min-h-0 flex-1 flex-col">
        <button
          type="button"
          onClick={() => setTrackOpen((open) => !open)}
          aria-expanded={trackOpen}
          className="flex items-center gap-1.5 px-3.5 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-ink-3 hover:text-ink-2"
        >
          <ChevronDownIcon
            size={11}
            className={[
              "shrink-0 transition-transform",
              trackOpen ? "" : "-rotate-90",
            ].join(" ")}
          />
          Track
        </button>
        {trackOpen && (
          <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
            {topics.map((topic) => {
              const topicOpen = openTopics.has(topic.id);
              return (
                <div key={topic.id} className="mb-1">
                  <button
                    type="button"
                    onClick={() => toggleTopic(topic.id)}
                    aria-expanded={topicOpen}
                    className={[
                      "flex w-full items-center gap-1 rounded-md px-1.5 py-1 text-left",
                      topic.id === activeTopicId ? "text-ink" : "text-ink-2",
                    ].join(" ")}
                  >
                    <ChevronDownIcon
                      size={11}
                      className={[
                        "shrink-0 text-ink-3 transition-transform",
                        topicOpen ? "" : "-rotate-90",
                      ].join(" ")}
                    />
                    <span className="text-[10px] font-medium text-ink-3">
                      {String(topic.order).padStart(2, "0")}
                    </span>
                    <span className="truncate text-[12px] font-medium">
                      {topic.title}
                    </span>
                  </button>

                  {topicOpen && (
                    <div className="mt-0.5 flex flex-col gap-px">
                      {topic.exercises.map((exercise) => {
                        const active = exercise.id === activeExerciseId;
                        const solved = isDone(exercise.id);

                        return (
                          <Link
                            key={exercise.id}
                            href={`/exercise/${exercise.id}`}
                            className={[
                              "group flex items-center gap-2 rounded-md py-1.5 pr-1.5 pl-6 transition-colors",
                              active
                                ? "bg-elevated text-ink"
                                : "text-ink-3 hover:bg-hover hover:text-ink-2",
                            ].join(" ")}
                          >
                            <span
                              className={[
                                "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border transition-colors",
                                solved
                                  ? "border-pass/40 bg-pass/10 text-pass"
                                  : active
                                    ? "border-ink-3"
                                    : "border-line group-hover:border-ink-3",
                              ].join(" ")}
                            >
                              {solved && (
                                <CheckIcon size={9} strokeWidth={2.5} />
                              )}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-[12px]">
                              {exercise.title}
                            </span>
                            <DifficultyBadge difficulty={exercise.difficulty} />
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

/** Expansor compacto para el botón de colapsar sidebar. */
export function SidebarToggle({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      title={collapsed ? "Mostrar sidebar" : "Ocultar sidebar"}
      className="flex h-6 w-6 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-hover hover:text-ink"
    >
      {collapsed ? <ChevronRightIcon size={14} /> : <ChevronLeftIcon size={14} />}
    </button>
  );
}
