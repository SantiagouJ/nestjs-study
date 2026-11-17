"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, RotateCcwIcon } from "./icons";
import { bundlePreview } from "@/lib/preview/bundle";
import {
  hasLayout,
  initialHref,
  listRoutes,
  matchHref,
} from "@/lib/preview/routes";

const PREVIEW_CSS = `
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Georgia, "Times New Roman", serif; background: #f7f3ee; color: #30251e; }
  a { color: #704629; }
  main { max-width: 880px; margin: 1.5rem auto; padding: 0 1rem; }
  header, .site-header { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 1rem; padding: 1rem 1.25rem; background: white; border-bottom: 1px solid #e4dcd3; }
  nav { display: flex; flex-wrap: wrap; gap: 0.9rem; }
  article, .order-card { padding: 1rem; background: white; border: 1px solid #e4dcd3; border-radius: 8px; }
  section { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.8rem; }
  button, input, select { font: inherit; }
  input { display: block; margin-top: 0.25rem; padding: 0.4rem 0.5rem; border: 1px solid #ddd; border-radius: 6px; }
  button { margin-top: 0.6rem; padding: 0.45rem 0.8rem; cursor: pointer; }
  p[role="alert"] { color: #8a3b12; }
  pre { white-space: pre-wrap; color: #8a1f1f; font-family: ui-monospace, monospace; font-size: 12px; }
`;

function previewDocument(options: {
  bundleUrl: string;
  params: Record<string, string>;
  search: Record<string, string | string[]>;
  authenticated: boolean;
}): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <script type="importmap">
    ${JSON.stringify({
      imports: {
        react: "https://esm.sh/react@19.3.0",
        "react/jsx-runtime": "https://esm.sh/react@19.3.0/jsx-runtime",
        "react/jsx-dev-runtime": "https://esm.sh/react@19.3.0/jsx-dev-runtime",
        "react-dom": "https://esm.sh/react-dom@19.3.0",
        "react-dom/client": "https://esm.sh/react-dom@19.3.0/client",
      },
    })}
  </script>
  <style>${PREVIEW_CSS}</style>
</head>
<body>
  <div id="root"></div>
  <script>globalThis.__PREVIEW_AUTH__ = ${options.authenticated ? "true" : "false"};</script>
  <script type="module">
    import { createRoot } from "react-dom/client";
    import { mount } from ${JSON.stringify(options.bundleUrl)};
    const props = {
      params: Promise.resolve(${JSON.stringify(options.params)}),
      searchParams: Promise.resolve(${JSON.stringify(options.search)}),
    };
    const root = document.getElementById("root");
    try {
      const tree = await mount(props);
      createRoot(root).render(tree);
    } catch (error) {
      if (error && error.name === "RedirectError") {
        window.parent.postMessage({ type: "preview-nav", href: error.path }, "*");
        root.textContent = "Redirigiendo a " + error.path;
      } else if (error && error.name === "NotFoundError") {
        root.innerHTML = "<main><h1>No encontrado</h1><p>El id de la ruta no corresponde a un recurso.</p></main>";
      } else {
        const pre = document.createElement("pre");
        pre.textContent = error && error.stack ? error.stack : String(error);
        root.replaceChildren(pre);
      }
    }
  </script>
</body>
</html>`;
}

/**
 * Navegador de la vista previa: compila las páginas del ejercicio
 * y las muestra sin levantar Next.js.
 */
export default function FrontendPreview({
  exerciseId,
  files,
}: {
  exerciseId: string;
  files: Record<string, string>;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const routes = useMemo(() => listRoutes(files), [files]);
  const layoutFile = hasLayout(files) ? "src/app/layout.tsx" : null;
  const [nav, setNav] = useState(() => {
    const start = initialHref(routes);
    return { stack: [start], index: 0 };
  });
  const [draft, setDraft] = useState(nav.stack[0] ?? "/");
  const [authenticated, setAuthenticated] = useState(true);
  const [srcDoc, setSrcDoc] = useState<string | null>(null);
  const [status, setStatus] = useState("Preparando la vista…");
  const [nonce, setNonce] = useState(0);
  const href = nav.stack[nav.index] ?? "/";

  useEffect(() => {
    const start = initialHref(listRoutes(files));
    setNav({ stack: [start], index: 0 });
    setDraft(start);
    setAuthenticated(true);
  }, [exerciseId]);

  useEffect(() => {
    setDraft(href);
  }, [href]);

  useEffect(() => {
    const frame = iframeRef.current;
    function onMessage(event: MessageEvent) {
      if (event.source !== frame?.contentWindow) return;
      const data = event.data as { type?: string; href?: string };
      if (data?.type === "preview-refresh") {
        setNonce((value) => value + 1);
        return;
      }
      if (data?.type !== "preview-nav" || !data.href) return;
      const next = data.href.startsWith("/") ? data.href : `/${data.href}`;
      setNav((current) => {
        if (current.stack[current.index] === next) return current;
        const stack = [...current.stack.slice(0, current.index + 1), next];
        return { stack, index: stack.length - 1 };
      });
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [srcDoc]);

  useEffect(() => {
    let cancelled = false;
    let bundleUrl: string | null = null;
    const timer = window.setTimeout(() => {
      const matched = matchHref(routes, href);
      if (!matched && !layoutFile) {
        setSrcDoc(null);
        setStatus("Esa ruta no está en este ejercicio.");
        return;
      }

      setStatus("Compilando…");
      void bundlePreview({
        files,
        pageFile: matched?.file ?? null,
        layoutFile,
      })
        .then((result) => {
          if (cancelled) return;
          if ("error" in result) {
            setSrcDoc(null);
            setStatus(result.error);
            return;
          }
          bundleUrl = URL.createObjectURL(
            new Blob([result.code], { type: "text/javascript" }),
          );
          setSrcDoc(
            previewDocument({
              bundleUrl,
              params: matched?.params ?? {},
              search: matched?.search ?? {},
              authenticated,
            }),
          );
          setStatus("");
        })
        .catch((error: unknown) => {
          if (cancelled) return;
          setSrcDoc(null);
          setStatus(error instanceof Error ? error.message : String(error));
        });
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      if (bundleUrl) URL.revokeObjectURL(bundleUrl);
    };
  }, [files, href, authenticated, nonce, routes, layoutFile]);

  function navigate(next: string) {
    const normalized = next.startsWith("/") ? next : `/${next}`;
    setNav((current) => {
      if (current.stack[current.index] === normalized) return current;
      const stack = [...current.stack.slice(0, current.index + 1), normalized];
      return { stack, index: stack.length - 1 };
    });
  }

  return (
    <aside className="flex h-full w-[min(460px,46vw)] shrink-0 flex-col border-l border-line bg-panel">
      <div className="flex items-center gap-1 border-b border-line px-2 py-1.5">
        <button
          type="button"
          title="Atrás"
          disabled={nav.index === 0}
          onClick={() =>
            setNav((current) => ({
              ...current,
              index: Math.max(0, current.index - 1),
            }))
          }
          className="flex h-7 w-7 items-center justify-center rounded-md text-ink-3 hover:bg-hover hover:text-ink disabled:opacity-30"
        >
          <ChevronLeftIcon size={14} />
        </button>
        <button
          type="button"
          title="Adelante"
          disabled={nav.index >= nav.stack.length - 1}
          onClick={() =>
            setNav((current) => ({
              ...current,
              index: Math.min(current.stack.length - 1, current.index + 1),
            }))
          }
          className="flex h-7 w-7 items-center justify-center rounded-md text-ink-3 hover:bg-hover hover:text-ink disabled:opacity-30"
        >
          <ChevronRightIcon size={14} />
        </button>
        <button
          type="button"
          title="Recargar vista"
          onClick={() => setNonce((value) => value + 1)}
          className="flex h-7 w-7 items-center justify-center rounded-md text-ink-3 hover:bg-hover hover:text-ink"
        >
          <RotateCcwIcon size={13} />
        </button>
        <form
          className="min-w-0 flex-1"
          onSubmit={(event) => {
            event.preventDefault();
            navigate(draft.trim() || "/");
          }}
        >
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            aria-label="Ruta de la vista previa"
            list="preview-routes"
            className="h-7 w-full rounded-md border border-line bg-app px-2 font-mono text-[11px] text-ink outline-none focus:border-ink-3"
          />
          <datalist id="preview-routes">
            {routes.map((route) => (
              <option
                key={route.pattern}
                value={route.pattern.replace(/:([A-Za-z0-9_]+)/g, "1")}
              />
            ))}
          </datalist>
        </form>
      </div>

      <label className="flex items-center gap-2 border-b border-line px-3 py-1.5 text-[11px] text-ink-3">
        <input
          type="checkbox"
          checked={authenticated}
          onChange={(event) => setAuthenticated(event.target.checked)}
        />
        Sesión de prueba
        <span className="ml-auto truncate">
          Vista local · la API no responde
        </span>
      </label>

      <div className="relative min-h-0 flex-1 bg-white">
        {srcDoc ? (
          <iframe
            ref={iframeRef}
            title="Vista previa del frontend"
            sandbox="allow-scripts allow-same-origin"
            srcDoc={srcDoc}
            className="h-full w-full border-0 bg-white"
          />
        ) : (
          <p className="px-4 py-6 text-[12px] leading-relaxed text-ink-2">
            {status}
          </p>
        )}
      </div>
    </aside>
  );
}
