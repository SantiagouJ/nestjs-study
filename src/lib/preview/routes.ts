export interface PreviewRoute {
  /** Patrón con segmentos `:id` para las carpetas `[id]`. */
  pattern: string;
  file: string;
}

export interface MatchedRoute {
  file: string;
  pattern: string;
  pathname: string;
  params: Record<string, string>;
  search: Record<string, string | string[]>;
}

const PAGE_SUFFIX = "/page.tsx";

export function listRoutes(files: Record<string, string>): PreviewRoute[] {
  const routes: PreviewRoute[] = [];

  for (const file of Object.keys(files)) {
    if (!file.startsWith("src/app/") || !file.endsWith(PAGE_SUFFIX)) continue;
    const relative = file.slice("src/app/".length, -PAGE_SUFFIX.length);
    const segments = relative
      .split("/")
      .filter(Boolean)
      .map((segment) =>
        segment.startsWith("[") && segment.endsWith("]")
          ? `:${segment.slice(1, -1)}`
          : segment,
      );
    routes.push({
      pattern: segments.length === 0 ? "/" : `/${segments.join("/")}`,
      file,
    });
  }

  return routes.sort((a, b) => a.pattern.length - b.pattern.length);
}

export function hasLayout(files: Record<string, string>): boolean {
  return "src/app/layout.tsx" in files;
}

export function canPreview(files: Record<string, string>): boolean {
  return listRoutes(files).length > 0 || hasLayout(files);
}

/** Ruta concreta para abrir el ejercicio: `/` si existe, si no la primera estática. */
export function initialHref(routes: PreviewRoute[]): string {
  const home = routes.find((route) => route.pattern === "/");
  const first =
    home ?? routes.find((route) => !route.pattern.includes(":")) ?? routes[0];
  if (!first) return "/";
  return first.pattern.replace(/:([A-Za-z0-9_]+)/g, "1");
}

export function matchHref(
  routes: PreviewRoute[],
  href: string,
): MatchedRoute | null {
  const url = new URL(href, "http://preview.local");
  const pathname =
    url.pathname.length > 1 ? url.pathname.replace(/\/$/, "") : url.pathname;
  const search: Record<string, string | string[]> = {};

  for (const [key, value] of url.searchParams.entries()) {
    const current = search[key];
    if (current === undefined) search[key] = value;
    else if (Array.isArray(current)) current.push(value);
    else search[key] = [current, value];
  }

  const staticMatch = routes.find((route) => route.pattern === pathname);
  if (staticMatch) {
    return {
      file: staticMatch.file,
      pattern: staticMatch.pattern,
      pathname,
      params: {},
      search,
    };
  }

  for (const route of routes) {
    if (!route.pattern.includes(":")) continue;
    const patternParts = route.pattern.split("/").filter(Boolean);
    const pathParts = pathname.split("/").filter(Boolean);
    if (patternParts.length !== pathParts.length) continue;

    const params: Record<string, string> = {};
    let matches = true;
    for (let index = 0; index < patternParts.length; index++) {
      const expected = patternParts[index];
      const actual = pathParts[index];
      if (expected.startsWith(":")) params[expected.slice(1)] = actual;
      else if (expected !== actual) matches = false;
    }
    if (matches) {
      return { file: route.file, pattern: route.pattern, pathname, params, search };
    }
  }

  return null;
}
