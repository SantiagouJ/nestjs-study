"use client";

import { XIcon } from "./icons";

export interface OpenFile {
  path: string;
  dirty: boolean;
}

interface EditorTabsProps {
  openFiles: OpenFile[];
  activePath: string;
  onSelect: (path: string) => void;
  onClose: (path: string) => void;
}

function basename(path: string) {
  const parts = path.split("/");
  return parts[parts.length - 1];
}

/**
 * Tabs de archivos abiertos, con indicador de cambios sin guardar.
 */
export default function EditorTabs({
  openFiles,
  activePath,
  onSelect,
  onClose,
}: EditorTabsProps) {
  return (
    <div className="flex items-stretch overflow-x-auto border-b border-line bg-panel">
      {openFiles.map((file) => {
        const active = file.path === activePath;
        return (
          <div
            key={file.path}
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(file.path)}
            title={file.path}
            className={[
              "group flex min-w-0 cursor-pointer items-center gap-2 border-r border-line-soft px-3 py-2 text-[12px] transition-colors",
              active
                ? "bg-app text-ink"
                : "text-ink-3 hover:bg-hover hover:text-ink-2",
            ].join(" ")}
          >
            <span className="truncate">{basename(file.path)}</span>
            {file.dirty && (
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ink-2" />
            )}
            <button
              onClick={(event) => {
                event.stopPropagation();
                onClose(file.path);
              }}
              aria-label={`Cerrar ${basename(file.path)}`}
              className="hidden h-4 w-4 shrink-0 items-center justify-center rounded text-ink-3 hover:bg-elevated hover:text-ink group-hover:flex"
            >
              <XIcon size={11} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
