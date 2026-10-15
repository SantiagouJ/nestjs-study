"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { JSX } from "react";
import {
  BookOpenIcon,
  ChartBarIcon,
  FlaskConicalIcon,
  HomeIcon,
  MoonIcon,
  SettingsIcon,
  SunIcon,
} from "./icons";
import { useTheme } from "@/lib/theme";

interface RailItem {
  label: string;
  href?: string;
  icon: (props: { className?: string; size?: number }) => JSX.Element;
  soon?: boolean;
}

const items: RailItem[] = [
  { label: "Inicio", href: "/", icon: HomeIcon },
  { label: "Track", href: "/", icon: BookOpenIcon },
  { label: "Práctica", icon: FlaskConicalIcon, soon: true },
  { label: "Progreso", icon: ChartBarIcon, soon: true },
  { label: "Ajustes", icon: SettingsIcon, soon: true },
];

/**
 * Rail vertical de navegación (estilo Notion / Affine).
 * Los ítems marcados como "soon" son placeholders de fases posteriores.
 */
export default function NavRail() {
  const pathname = usePathname();
  const { toggle } = useTheme();

  return (
    <nav className="fixed inset-y-0 left-0 z-40 flex w-14 flex-col items-center border-r border-line bg-panel py-3">
      <div className="mb-4 flex h-7 w-7 items-center justify-center rounded-md bg-elevated text-[11px] font-semibold tracking-tight text-ink">
        N
      </div>

      <div className="flex flex-1 flex-col items-center gap-1.5">
        {items.map((item) => {
          const active = item.href !== undefined && pathname === item.href;
          const Icon = item.icon;

          if (item.soon) {
            return (
              <div
                key={item.label}
                title={`${item.label} — próximamente`}
                className="flex h-9 w-9 cursor-not-allowed items-center justify-center rounded-md text-ink-3/50"
              >
                <Icon size={17} />
              </div>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href!}
              title={item.label}
              className={[
                "flex h-9 w-9 items-center justify-center rounded-md transition-colors",
                active
                  ? "bg-elevated text-ink"
                  : "text-ink-3 hover:bg-hover hover:text-ink-2",
              ].join(" ")}
            >
              <Icon size={17} />
            </Link>
          );
        })}
      </div>

      <button
        type="button"
        onClick={toggle}
        title="Cambiar tema"
        aria-label="Cambiar tema"
        className="mb-2 flex h-9 w-9 items-center justify-center rounded-md text-ink-3 transition-colors hover:bg-hover hover:text-ink"
      >
        <SunIcon size={17} className="show-in-dark" />
        <MoonIcon size={17} className="show-in-light" />
      </button>

      <div
        title="Tu perfil — próximamente"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-elevated text-[11px] font-medium text-ink-2"
      >
        Z
      </div>
    </nav>
  );
}
