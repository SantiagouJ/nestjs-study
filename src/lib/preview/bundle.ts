const WASM_URL = "https://unpkg.com/esbuild-wasm@0.25.5/esbuild.wasm";

const sessionShim = `type Stored = { name: string; value: string; options?: Record<string, unknown> };
const jar = new Map<string, Stored>();

function authOn() {
  return Boolean((globalThis as { __PREVIEW_AUTH__?: boolean }).__PREVIEW_AUTH__);
}

export class RedirectError extends Error {
  path: string;
  constructor(path: string) {
    super(path);
    this.name = "RedirectError";
    this.path = path;
  }
}

export class NotFoundError extends Error {
  constructor() {
    super("NEXT_NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export async function cookies() {
  if (authOn() && jar.size === 0) {
    for (const name of ["coffee_token", "print_token", "lab_token"]) {
      jar.set(name, { name, value: "preview-token" });
    }
  }
  return {
    get(name: string) {
      return jar.get(name);
    },
    set(name: string, value: string, options?: Record<string, unknown>) {
      jar.set(name, { name, value, options });
    },
    delete(name: string) {
      jar.delete(name);
    },
  };
}

export function redirect(path: string): never {
  throw new RedirectError(path);
}

export function notFound(): never {
  throw new NotFoundError();
}

export function useRouter() {
  return {
    refresh() {
      window.parent.postMessage({ type: "preview-refresh" }, "*");
    },
    push(path: string) {
      window.parent.postMessage({ type: "preview-nav", href: path }, "*");
    },
  };
}
`;

const linkShim = `import type { MouseEvent, ReactNode } from "react";

export default function Link({
  href,
  children,
  ...rest
}: {
  href: string;
  children?: ReactNode;
  [key: string]: unknown;
}) {
  return (
    <a
      href={href}
      {...rest}
      onClick={(event: MouseEvent<HTMLAnchorElement>) => {
        event.preventDefault();
        window.parent.postMessage(
          { type: "preview-nav", href: String(href) },
          "*",
        );
      }}
    >
      {children}
    </a>
  );
}
`;

let esbuildPromise: Promise<typeof import("esbuild-wasm")> | null = null;

async function loadEsbuild() {
  if (!esbuildPromise) {
    esbuildPromise = (async () => {
      const esbuild = await import("esbuild-wasm/lib/browser");
      try {
        await esbuild.initialize({ wasmURL: WASM_URL, worker: false });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!message.toLowerCase().includes("already")) throw error;
      }
      return esbuild;
    })();
  }
  return esbuildPromise;
}

function resolveRelative(importer: string, spec: string): string {
  const stack = importer.split("/").slice(0, -1);
  for (const part of spec.split("/")) {
    if (part === "." || part === "") continue;
    if (part === "..") stack.pop();
    else stack.push(part);
  }
  return stack.join("/");
}

function lookup(files: Record<string, string>, path: string): string | null {
  const candidates = [
    path,
    `${path}.tsx`,
    `${path}.ts`,
    `${path}.jsx`,
    `${path}/index.tsx`,
    `${path}/index.ts`,
  ];
  return candidates.find((candidate) => candidate in files) ?? null;
}

function entrySource(pageFile: string | null, layoutFile: string | null): string {
  const pageImport = pageFile
    ? `import Page from ${JSON.stringify(pageFile)};`
    : `import { jsx } from "react/jsx-runtime";`;
  const layoutImport = layoutFile
    ? `import Layout from ${JSON.stringify(layoutFile)};`
    : "";
  const pageExpr = pageFile
    ? "await Page(props)"
    : `jsx("main", { children: jsx("p", { children: "Esta ruta todavía no tiene page.tsx en el ejercicio." }) })`;

  return `${pageImport}
${layoutImport}
export async function mount(props) {
  const page = ${pageExpr};
  ${layoutFile ? "return await Layout({ ...props, children: page });" : "return page;"}
}
`;
}

export async function bundlePreview(options: {
  files: Record<string, string>;
  pageFile: string | null;
  layoutFile: string | null;
}): Promise<{ code: string } | { error: string }> {
  const esbuild = await loadEsbuild();
  const entry = entrySource(options.pageFile, options.layoutFile);

  const result = await esbuild.build({
    bundle: true,
    write: false,
    format: "esm",
    platform: "browser",
    target: "es2022",
    jsx: "automatic",
    outfile: "preview.js",
    entryPoints: ["entry.tsx"],
    banner: {
      js: `globalThis.process = globalThis.process || { env: new Proxy({
  NODE_ENV: "development",
  COFFEE_API_URL: "https://coffee-orders-api.preview/api",
  PRINT_API_URL: "https://print-api.preview/api",
  LAB_API_URL: "https://lab-api.preview/api",
  COFFEE_DEMO_MANAGER_EMAIL: "manager@example.com"
}, { get(target, key) { return Object.prototype.hasOwnProperty.call(target, key) ? target[key] : ""; } }) };`,
    },
    plugins: [
      {
        name: "exercise-files",
        setup(build) {
          build.onResolve({ filter: /.*/ }, (args) => {
            if (
              args.path === "react" ||
              args.path.startsWith("react/") ||
              args.path === "react-dom" ||
              args.path.startsWith("react-dom/")
            ) {
              return { path: args.path, external: true };
            }
            if (args.path === "entry.tsx") {
              return { path: "entry.tsx", namespace: "preview" };
            }
            if (args.path.endsWith(".css")) {
              return { path: args.path, namespace: "css" };
            }
            if (args.path === "server-only" || args.path.startsWith("next/")) {
              return { path: args.path, namespace: "shim" };
            }

            const target = args.path.startsWith(".")
              ? resolveRelative(args.importer, args.path)
              : args.path;
            const found = lookup(options.files, target);
            if (!found) {
              return {
                errors: [
                  {
                    text: `No se encontró "${args.path}" importado desde ${args.importer || "el ejercicio"}.`,
                  },
                ],
              };
            }
            return { path: found, namespace: "preview" };
          });

          build.onLoad({ filter: /.*/, namespace: "preview" }, (args) => {
            if (args.path === "entry.tsx") {
              return { contents: entry, loader: "tsx" };
            }
            const contents = options.files[args.path];
            return {
              contents,
              loader: args.path.endsWith(".tsx") ? "tsx" : "ts",
            };
          });

          build.onLoad({ filter: /.*/, namespace: "shim" }, (args) => {
            if (args.path === "next/link") {
              return { contents: linkShim, loader: "tsx" };
            }
            if (args.path === "server-only") {
              return { contents: "export {};", loader: "ts" };
            }
            return { contents: sessionShim, loader: "ts" };
          });

          build.onLoad({ filter: /.*/, namespace: "css" }, () => ({
            contents:
              "const styles = new Proxy({}, { get(_target, prop) { return String(prop); } }); export default styles;",
            loader: "js",
          }));
        },
      },
    ],
  });

  if (result.errors.length > 0) {
    return { error: result.errors.map((item) => item.text).join("\n") };
  }

  return { code: result.outputFiles[0]?.text ?? "" };
}
