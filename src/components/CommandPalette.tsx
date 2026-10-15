"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { SearchIcon } from "./icons";

export type PaletteAction = {
  id: string;
  label: string;
  shortcut?: string;
};

/**
 * Paleta de comandos. Se monta solo mientras está abierta.
 * El clic que la abre no la cierra: el listener de fuera se registra
 * en el siguiente tick.
 */
export default function CommandPalette({
  actions,
  onSelect,
  onClose,
}: {
  actions: PaletteAction[];
  onSelect: (action: PaletteAction) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions;
    return actions.filter((action) => action.label.toLowerCase().includes(q));
  }, [actions, query]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((index) =>
          Math.min(index + 1, Math.max(filtered.length - 1, 0)),
        );
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((index) => Math.max(index - 1, 0));
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        const action = filtered[activeIndex];
        if (action) onSelect(action);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, filtered, onClose, onSelect]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const timer = window.setTimeout(() => {
      window.addEventListener("mousedown", onPointerDown);
    }, 0);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("mousedown", onPointerDown);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-4 pt-[16vh]">
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Paleta de comandos"
        className="w-full max-w-lg overflow-hidden rounded-lg border border-line bg-panel shadow-2xl"
      >
        <div className="flex items-center gap-2 border-b border-line px-3 py-2.5">
          <SearchIcon size={14} className="shrink-0 text-ink-3" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar una acción o un ejercicio"
            className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-3"
            aria-label="Buscar en la paleta"
          />
          <kbd className="rounded border border-line px-1.5 py-0.5 text-[10px] text-ink-3">
            Esc
          </kbd>
        </div>

        <ul className="max-h-80 overflow-y-auto py-1">
          {filtered.length === 0 && (
            <li className="px-3 py-6 text-center text-[12px] text-ink-3">
              No hay acciones que coincidan
            </li>
          )}
          {filtered.map((action, index) => (
            <li key={action.id}>
              <button
                type="button"
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => onSelect(action)}
                className={[
                  "flex w-full items-center gap-3 px-3 py-2 text-left text-[13px]",
                  index === activeIndex
                    ? "bg-elevated text-ink"
                    : "text-ink-2",
                ].join(" ")}
              >
                <span className="min-w-0 flex-1 truncate">{action.label}</span>
                {action.shortcut && (
                  <span className="shrink-0 text-[10px] text-ink-3">
                    {action.shortcut}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
