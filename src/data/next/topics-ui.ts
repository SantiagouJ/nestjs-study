import type { ExerciseFile, Topic } from "@/lib/types";

/** Crea un archivo TypeScript del ejercicio (solo lectura si se indica). */
function ts(path: string, content: string, readOnly = false): ExerciseFile {
  return readOnly
    ? { path, language: "typescript", content, readOnly: true }
    : { path, language: "typescript", content };
}

/* ------------------------------------------------------------------ */
/* Ejercicio 1: nx-home                                                */
/* ------------------------------------------------------------------ */

const homeStarter = `export default function Home() {
  return (
    <main>
      {/* TODO: h1 Coffee Orders Start */}
      {/* TODO: párrafo "Una interfaz para consultar los pedidos de la cafetería." */}
      {/* TODO: párrafo "Utilizar el enlace Pedidos del menú para consultar el listado." */}
    </main>
  );
}
`;

const homeSolution = `export default function Home() {
  return (
    <main>
      <h1>Coffee Orders Start</h1>
      <p>Una interfaz para consultar los pedidos de la cafetería.</p>
      <p>Utilizar el enlace Pedidos del menú para consultar el listado.</p>
    </main>
  );
}
`;

const homeSpec = `import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import Home from "./page";

describe("Página de inicio", () => {
  const html = renderToStaticMarkup(createElement(Home));

  it("muestra el h1 exacto", () => {
    expect(html).toContain("<h1>Coffee Orders Start</h1>");
  });

  it("muestra el primer párrafo", () => {
    expect(html).toContain(
      "<p>Una interfaz para consultar los pedidos de la cafetería.</p>"
    );
  });

  it("muestra el segundo párrafo", () => {
    expect(html).toContain(
      "<p>Utilizar el enlace Pedidos del menú para consultar el listado.</p>"
    );
  });

  it("está envuelta en un main", () => {
    expect(html.startsWith("<main>")).toBe(true);
  });
});
`;

/* ------------------------------------------------------------------ */
/* Ejercicio 2: nx-header                                              */
/* ------------------------------------------------------------------ */

const headerStarter = `import Link from "next/link";

export default function AppHeader() {
  return (
    // TODO: usa className "site-header" en el header
    <header>
      {/* TODO: texto de marca "Coffee Orders" */}
      {/* TODO: nav con aria-label "Navegación principal" */}
      <nav>
        {/* TODO: Link a "/" con el texto Inicio */}
        {/* TODO: Link a "/orders" con el texto Pedidos */}
        {/* TODO: Link a "/otraPagina" con el texto Otra Página */}
      </nav>
    </header>
  );
}
`;

const headerSolution = `import Link from "next/link";

export default function AppHeader() {
  return (
    <header className="site-header">
      <span>Coffee Orders</span>
      <nav aria-label="Navegación principal">
        <Link href="/">Inicio</Link>
        <Link href="/orders">Pedidos</Link>
        <Link href="/otraPagina">Otra Página</Link>
      </nav>
    </header>
  );
}
`;

const layoutStarter = `import type { ReactNode } from "react";
import AppHeader from "../components/app-header";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        {/* TODO: muestra <AppHeader /> una sola vez */}
        {/* TODO: renderiza {children} debajo del encabezado */}
      </body>
    </html>
  );
}
`;

const layoutSolution = `import type { ReactNode } from "react";
import AppHeader from "../components/app-header";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AppHeader />
        {children}
      </body>
    </html>
  );
}
`;

const layoutSpec = `import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import AppHeader from "../components/app-header";
import RootLayout from "./layout";

function count(text: string, part: string): number {
  return text.split(part).length - 1;
}

describe("AppHeader", () => {
  const html = renderToStaticMarkup(createElement(AppHeader));

  it("enlaza a las tres rutas", () => {
    expect(html).toContain('href="/"');
    expect(html).toContain('href="/orders"');
    expect(html).toContain('href="/otraPagina"');
  });

  it("muestra los textos de los enlaces", () => {
    expect(html).toContain("Inicio");
    expect(html).toContain("Pedidos");
    expect(html).toContain("Otra Página");
  });

  it("muestra la marca, la clase y la etiqueta accesible", () => {
    expect(html).toContain("Coffee Orders");
    expect(html).toContain("site-header");
    expect(html).toContain("Navegación principal");
  });
});

describe("RootLayout", () => {
  const html = renderToStaticMarkup(
    createElement(RootLayout, {
      children: createElement("p", null, "contenido-unico"),
    })
  );

  it("renderiza los children de la página", () => {
    expect(html).toContain("contenido-unico");
  });

  it("muestra el encabezado exactamente una vez", () => {
    expect(count(html, 'href="/orders"')).toBe(1);
  });

  it("pone el encabezado antes del contenido", () => {
    expect(html.indexOf("Coffee Orders")).toBeGreaterThanOrEqual(0);
    expect(html.indexOf("Coffee Orders")).toBeLessThan(
      html.indexOf("contenido-unico")
    );
  });
});
`;

/* ------------------------------------------------------------------ */
/* Ejercicio 3: nx-summary                                             */
/* ------------------------------------------------------------------ */

const orderSummaryType = `export type OrderSummary = {
  id: number;
  item: string;
  quantity: number;
  status: "pending" | "ready";
};
`;

const sampleOrdersData = `import type { OrderSummary } from "../types/order-summary";

// Datos temporales de práctica. Más adelante vendrán de la API.
export const sampleOrders: OrderSummary[] = [
  { id: 1, item: "Cappuccino", quantity: 2, status: "pending" },
  { id: 2, item: "Americano", quantity: 1, status: "ready" },
  { id: 3, item: "Latte", quantity: 3, status: "pending" },
];
`;

const orderCardStarter = `import type { OrderSummary } from "../types/order-summary";

export default function OrderCard({ order }: { order: OrderSummary }) {
  // TODO: calcula la etiqueta: "ready" -> "Listo", "pending" -> "Pendiente"
  return (
    <article className="order-card">
      {/* TODO: h3 con order.item */}
      {/* TODO: párrafo "Cantidad: {order.quantity}" */}
      {/* TODO: párrafo con el estado traducido */}
    </article>
  );
}
`;

const orderCardSolution = `import type { OrderSummary } from "../types/order-summary";

export default function OrderCard({ order }: { order: OrderSummary }) {
  const label = order.status === "ready" ? "Listo" : "Pendiente";

  return (
    <article className="order-card">
      <h3>{order.item}</h3>
      <p>Cantidad: {order.quantity}</p>
      <p>Estado: {label}</p>
    </article>
  );
}
`;

const ordersSummaryStarter = `export default function OrdersSummary({
  total,
  pending,
  ready,
}: {
  total: number;
  pending: number;
  ready: number;
}) {
  return (
    <section className="orders-summary">
      {/* TODO: párrafo "Total: {total}" usando la prop */}
      {/* TODO: párrafo "Pendientes: {pending}" usando la prop */}
      {/* TODO: párrafo "Listos: {ready}" usando la prop */}
    </section>
  );
}
`;

const ordersSummarySolution = `export default function OrdersSummary({
  total,
  pending,
  ready,
}: {
  total: number;
  pending: number;
  ready: number;
}) {
  return (
    <section className="orders-summary">
      <p>Total: {total}</p>
      <p>Pendientes: {pending}</p>
      <p>Listos: {ready}</p>
    </section>
  );
}
`;

const summaryPageStarter = `import OrderCard from "../../components/order-card";
import OrdersSummary from "../../components/orders-summary";
import { sampleOrders } from "../../data/sample-orders";

export default function OrdersPage() {
  // TODO: calcula total con sampleOrders.length
  // TODO: calcula pending y ready con filter y length
  const total = 0;
  const pending = 0;
  const ready = 0;

  return (
    <main>
      <h1>Pedidos</h1>
      <p>Datos temporales. Todavía no se consulta el backend.</p>
      {/* TODO: renderiza <OrdersSummary /> con total, pending y ready */}
      {/* TODO: recorre sampleOrders con map y muestra un <OrderCard key={order.id} order={order} /> */}
    </main>
  );
}
`;

const summaryPageSolution = `import OrderCard from "../../components/order-card";
import OrdersSummary from "../../components/orders-summary";
import { sampleOrders } from "../../data/sample-orders";

export default function OrdersPage() {
  const total = sampleOrders.length;
  const pending = sampleOrders.filter((order) => order.status === "pending").length;
  const ready = sampleOrders.filter((order) => order.status === "ready").length;

  return (
    <main>
      <h1>Pedidos</h1>
      <p>Datos temporales. Todavía no se consulta el backend.</p>
      <OrdersSummary total={total} pending={pending} ready={ready} />
      <section>
        {sampleOrders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </section>
    </main>
  );
}
`;

const orderCardSpec = `import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import OrderCard from "./order-card";

describe("OrderCard", () => {
  it("muestra un pedido listo", () => {
    const html = renderToStaticMarkup(
      createElement(OrderCard, {
        order: { id: 2, item: "Americano", quantity: 1, status: "ready" },
      })
    );
    expect(html).toContain("Listo");
    expect(html).toContain("Americano");
    expect(html).toContain("Cantidad");
    expect(html).not.toContain("Pendiente");
  });

  it("muestra un pedido pendiente", () => {
    const html = renderToStaticMarkup(
      createElement(OrderCard, {
        order: { id: 5, item: "Mocha", quantity: 4, status: "pending" },
      })
    );
    expect(html).toContain("Pendiente");
    expect(html).toContain("Mocha");
    expect(html).not.toContain("Listo");
  });
});
`;

const ordersSummarySpec = `import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import OrdersSummary from "./orders-summary";

function clean(html: string): string {
  return html.replace(/<!--.*?-->/g, "");
}

describe("OrdersSummary", () => {
  it("usa los números recibidos por props", () => {
    const html = clean(
      renderToStaticMarkup(
        createElement(OrdersSummary, { total: 9, pending: 4, ready: 5 })
      )
    );
    expect(html).toContain("Total: 9");
    expect(html).toContain("Pendientes: 4");
    expect(html).toContain("Listos: 5");
  });

  it("no tiene los números de práctica escritos a mano", () => {
    const html = clean(
      renderToStaticMarkup(
        createElement(OrdersSummary, { total: 20, pending: 11, ready: 9 })
      )
    );
    expect(html).toContain("Total: 20");
    expect(html).toContain("Pendientes: 11");
    expect(html).toContain("Listos: 9");
  });
});
`;

const ordersPageSpec = `import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import OrdersPage from "./orders/page";

function clean(html: string): string {
  return html.replace(/<!--.*?-->/g, "");
}

describe("OrdersPage con datos temporales", () => {
  const html = clean(renderToStaticMarkup(createElement(OrdersPage)));

  it("muestra el encabezado y la nota", () => {
    expect(html).toContain("Pedidos");
    expect(html).toContain("Datos temporales. Todavía no se consulta el backend.");
  });

  it("calcula el resumen: 3 pedidos, 2 pendientes, 1 listo", () => {
    expect(html).toContain("Total: 3");
    expect(html).toContain("Pendientes: 2");
    expect(html).toContain("Listos: 1");
  });

  it("muestra una tarjeta por pedido", () => {
    expect(html).toContain("Cappuccino");
    expect(html).toContain("Americano");
    expect(html).toContain("Latte");
    expect(html.split("Cantidad").length - 1).toBe(3);
  });
});
`;

/* ------------------------------------------------------------------ */
/* Ejercicio 4: nx-login                                               */
/* ------------------------------------------------------------------ */

const loginStarter = `import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  "use server";

  // TODO: lee email y password con formData.get(...)
  // TODO: haz POST JSON a process.env.COFFEE_API_URL + "/auth/login"
  //       con el header Content-Type: application/json
  //       y usa .catch(() => null) para tolerar errores de red
  // TODO: si la respuesta es ok y data.access_token es string:
  //       guarda la cookie "coffee_token" (httpOnly, sameSite "lax", path "/", maxAge 15 * 60)
  //       y haz redirect("/orders")
  // TODO: en cualquier otro caso haz redirect("/login?error=1") sin guardar cookie
  throw new Error("TODO: implementa login");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; registered?: string }>;
}) {
  const params = await searchParams;

  return (
    <main>
      <h1>Iniciar sesión</h1>
      {params.error === "1" && <p>No se pudo iniciar sesión. Revisa tus datos.</p>}
      {params.registered === "1" && <p>Cuenta creada. Ya puedes iniciar sesión.</p>}
      <form action={login}>
        <label>
          Correo
          <input type="email" name="email" required />
        </label>
        <label>
          Contraseña
          <input type="password" name="password" required />
        </label>
        <button type="submit">Entrar</button>
      </form>
    </main>
  );
}
`;

const loginSolution = `import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  "use server";

  const email = formData.get("email");
  const password = formData.get("password");

  const response = await fetch(process.env.COFFEE_API_URL + "/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  }).catch(() => null);

  if (!response || !response.ok) {
    redirect("/login?error=1");
  }

  const data = (await response.json().catch(() => null)) as {
    access_token?: unknown;
  } | null;

  if (!data || typeof data.access_token !== "string") {
    redirect("/login?error=1");
  }

  const cookieStore = await cookies();
  cookieStore.set("coffee_token", data.access_token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60,
  });

  redirect("/orders");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; registered?: string }>;
}) {
  const params = await searchParams;

  return (
    <main>
      <h1>Iniciar sesión</h1>
      {params.error === "1" && <p>No se pudo iniciar sesión. Revisa tus datos.</p>}
      {params.registered === "1" && <p>Cuenta creada. Ya puedes iniciar sesión.</p>}
      <form action={login}>
        <label>
          Correo
          <input type="email" name="email" required />
        </label>
        <label>
          Contraseña
          <input type="password" name="password" required />
        </label>
        <button type="submit">Entrar</button>
      </form>
    </main>
  );
}
`;

const loginSpec = `import { renderToStaticMarkup } from "react-dom/server";
import { __resetSession, __readCookie } from "../../shims/session";
import LoginPage, { login } from "./page";

const fetchMock = jest.fn();

function makeForm(email: string, password: string): FormData {
  const form = new FormData();
  form.set("email", email);
  form.set("password", password);
  return form;
}

async function redirectPath(fn: () => Promise<unknown>): Promise<string> {
  try {
    await fn();
  } catch (error) {
    const err = error as { name?: string; path?: string };
    if (err && err.name === "RedirectError") {
      return String(err.path);
    }
    throw error;
  }
  throw new Error("Se esperaba un redirect y no ocurrió");
}

beforeEach(() => {
  __resetSession();
  fetchMock.mockReset();
  (globalThis as unknown as { fetch: unknown }).fetch = fetchMock;
  process.env.COFFEE_API_URL = "https://api.test/api";
});

describe("Server Action login", () => {
  it("guarda la cookie y redirige a /orders cuando el login funciona", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ access_token: "tok-1" }),
    });

    const path = await redirectPath(() =>
      login(makeForm("ana@test.com", "secreto123"))
    );

    expect(path).toBe("/orders");
    const cookie = __readCookie("coffee_token");
    expect(cookie).toBeDefined();
    expect(cookie?.value).toBe("tok-1");
    expect(cookie?.options).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 900,
    });
  });

  it("envía un POST JSON a /auth/login", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ access_token: "tok-1" }),
    });

    await redirectPath(() => login(makeForm("ana@test.com", "secreto123")));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url).endsWith("/auth/login")).toBe(true);
    expect(String(url).startsWith("https://api.test/api")).toBe(true);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({
      email: "ana@test.com",
      password: "secreto123",
    });
    expect(new Headers(init.headers).get("content-type")).toBe("application/json");
  });

  it("redirige a /login?error=1 sin cookie si la API responde 401", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 401 });

    const path = await redirectPath(() =>
      login(makeForm("ana@test.com", "mala"))
    );

    expect(path).toBe("/login?error=1");
    expect(__readCookie("coffee_token")).toBeUndefined();
  });

  it("redirige a /login?error=1 sin cookie si la red falla", async () => {
    fetchMock.mockRejectedValue(new Error("sin red"));

    const path = await redirectPath(() =>
      login(makeForm("ana@test.com", "secreto123"))
    );

    expect(path).toBe("/login?error=1");
    expect(__readCookie("coffee_token")).toBeUndefined();
  });

  it("no guarda cookie si la respuesta no trae access_token string", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ access_token: 123 }),
    });

    const path = await redirectPath(() =>
      login(makeForm("ana@test.com", "secreto123"))
    );

    expect(path).toBe("/login?error=1");
    expect(__readCookie("coffee_token")).toBeUndefined();
  });
});

describe("LoginPage", () => {
  it("muestra el error cuando error=1", async () => {
    const element = await LoginPage({
      searchParams: Promise.resolve({ error: "1" }),
    });
    const html = renderToStaticMarkup(element);
    expect(html).toContain("No se pudo iniciar sesión");
    expect(html).toContain('name="email"');
    expect(html).toContain('name="password"');
  });

  it("muestra el aviso cuando registered=1", async () => {
    const element = await LoginPage({
      searchParams: Promise.resolve({ registered: "1" }),
    });
    const html = renderToStaticMarkup(element);
    expect(html).toContain("Cuenta creada");
    expect(html).not.toContain("No se pudo iniciar sesión");
  });

  it("no muestra mensajes sin parámetros", async () => {
    const element = await LoginPage({ searchParams: Promise.resolve({}) });
    const html = renderToStaticMarkup(element);
    expect(html).not.toContain("No se pudo iniciar sesión");
    expect(html).not.toContain("Cuenta creada");
  });
});
`;

/* ------------------------------------------------------------------ */
/* Ejercicio 5: nx-orders-fetch                                        */
/* ------------------------------------------------------------------ */

const ordersFetchStarter = `import { cookies } from "next/headers";
import { redirect } from "next/navigation";

type Order = { id: number; item: string; quantity: number; status: string };

export async function logout() {
  "use server";

  // TODO: borra la cookie "coffee_token" con cookieStore.delete(...)
  // TODO: redirect("/login")
}

export default async function OrdersPage() {
  // TODO: lee la cookie con (await cookies()).get("coffee_token")?.value
  // TODO: si no hay token, redirect("/login") sin llamar a fetch
  // TODO: GET process.env.COFFEE_API_URL + "/orders"
  //       con el header Authorization: "Bearer " + token y cache: "no-store"
  //       usa .catch(() => null) para tolerar errores de red
  // TODO: si la respuesta es 401, redirect("/login")
  // TODO: si falla o no es un arreglo, orders queda en null
  const orders: Order[] | null = null;

  return (
    <main>
      <h1>Pedidos</h1>
      <form action={logout}>
        <button type="submit">Cerrar sesión</button>
      </form>
      {/* TODO: null -> "No se pudieron consultar los pedidos." */}
      {/* TODO: lista vacía -> "Todavía no hay pedidos." */}
      {/* TODO: con datos -> un article por pedido con key={order.id} y order.item */}
    </main>
  );
}
`;

const ordersFetchSolution = `import { cookies } from "next/headers";
import { redirect } from "next/navigation";

type Order = { id: number; item: string; quantity: number; status: string };

export async function logout() {
  "use server";

  const cookieStore = await cookies();
  cookieStore.delete("coffee_token");
  redirect("/login");
}

export default async function OrdersPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("coffee_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const response = await fetch(process.env.COFFEE_API_URL + "/orders", {
    headers: { Authorization: "Bearer " + token },
    cache: "no-store",
  }).catch(() => null);

  if (response && response.status === 401) {
    redirect("/login");
  }

  let orders: Order[] | null = null;
  if (response && response.ok) {
    const data: unknown = await response.json().catch(() => null);
    if (Array.isArray(data)) {
      orders = data as Order[];
    }
  }

  return (
    <main>
      <h1>Pedidos</h1>
      <form action={logout}>
        <button type="submit">Cerrar sesión</button>
      </form>
      {orders === null ? (
        <p>No se pudieron consultar los pedidos.</p>
      ) : orders.length === 0 ? (
        <p>Todavía no hay pedidos.</p>
      ) : (
        <section>
          {orders.map((order) => (
            <article key={order.id}>
              <h3>{order.item}</h3>
              <p>Cantidad: {order.quantity}</p>
              <p>Estado: {order.status}</p>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
`;

const ordersFetchSpec = `import { renderToStaticMarkup } from "react-dom/server";
import { __resetSession, __readCookie, __seedCookie } from "../../shims/session";
import OrdersPage, { logout } from "./page";

const fetchMock = jest.fn();

async function redirectPath(fn: () => Promise<unknown>): Promise<string> {
  try {
    await fn();
  } catch (error) {
    const err = error as { name?: string; path?: string };
    if (err && err.name === "RedirectError") {
      return String(err.path);
    }
    throw error;
  }
  throw new Error("Se esperaba un redirect y no ocurrió");
}

async function renderPage(): Promise<string> {
  const element = await OrdersPage();
  return renderToStaticMarkup(element);
}

beforeEach(() => {
  __resetSession();
  fetchMock.mockReset();
  (globalThis as unknown as { fetch: unknown }).fetch = fetchMock;
  process.env.COFFEE_API_URL = "https://api.test/api";
});

describe("OrdersPage con sesión", () => {
  it("sin cookie redirige a /login y no llama a la API", async () => {
    const path = await redirectPath(() => OrdersPage());
    expect(path).toBe("/login");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("si la API responde 401 vuelve a /login", async () => {
    __seedCookie("coffee_token", "abc");
    fetchMock.mockResolvedValue({ ok: false, status: 401 });

    const path = await redirectPath(() => OrdersPage());
    expect(path).toBe("/login");
  });

  it("muestra los pedidos y envía el Bearer solo en el header", async () => {
    __seedCookie("coffee_token", "abc");
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [{ id: 1, item: "Latte", quantity: 1, status: "pending" }],
    });

    const html = await renderPage();

    expect(html).toContain("Latte");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("https://api.test/api/orders");
    const headers = new Headers(init.headers);
    expect(headers.get("authorization")).toBe("Bearer abc");
    expect(headers.get("cookie")).toBeNull();
    expect(init.cache).toBe("no-store");
    expect(init.method === undefined || init.method === "GET").toBe(true);
  });

  it("muestra el estado vacío", async () => {
    __seedCookie("coffee_token", "abc");
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => [] });

    const html = await renderPage();

    expect(html).toContain("Todavía no hay pedidos.");
    expect(html).not.toContain("No se pudieron consultar los pedidos.");
  });

  it("muestra el error cuando fetch falla", async () => {
    __seedCookie("coffee_token", "abc");
    fetchMock.mockRejectedValue(new Error("sin red"));

    const html = await renderPage();

    expect(html).toContain("No se pudieron consultar los pedidos.");
    expect(html).not.toContain("Todavía no hay pedidos.");
  });

  it("muestra el error cuando la API responde 500", async () => {
    __seedCookie("coffee_token", "abc");
    fetchMock.mockResolvedValue({ ok: false, status: 500 });

    const html = await renderPage();

    expect(html).toContain("No se pudieron consultar los pedidos.");
  });

  it("incluye el botón para cerrar sesión", async () => {
    __seedCookie("coffee_token", "abc");
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => [] });

    const html = await renderPage();

    expect(html).toContain("Cerrar sesión");
  });
});

describe("logout", () => {
  it("borra la cookie y redirige a /login", async () => {
    __seedCookie("coffee_token", "abc");
    expect(__readCookie("coffee_token")).toBeDefined();

    const path = await redirectPath(() => logout());

    expect(path).toBe("/login");
    expect(__readCookie("coffee_token")).toBeUndefined();
  });
});
`;

/* ------------------------------------------------------------------ */
/* Ejercicio 6: nx-register                                            */
/* ------------------------------------------------------------------ */

const registerStarter = `import { redirect } from "next/navigation";

export async function register(formData: FormData) {
  "use server";

  // TODO: lee email y password con formData.get(...)
  // TODO: haz POST JSON a process.env.COFFEE_API_URL + "/auth/register"
  //       con el header Content-Type: application/json
  //       y usa .catch(() => null) para tolerar errores de red
  // TODO: si el status es exactamente 201, redirect("/login?registered=1")
  //       (registrar NO es iniciar sesión: no guardes ninguna cookie)
  // TODO: en cualquier otro caso, redirect("/register?error=exists")
  throw new Error("TODO: implementa register");
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main>
      <h1>Crear cuenta</h1>
      {params.error === "exists" && <p>Ese correo ya está registrado.</p>}
      <form action={register}>
        <label>
          Correo
          <input type="email" name="email" required />
        </label>
        <label>
          Contraseña
          <input type="password" name="password" required />
        </label>
        <button type="submit">Registrarme</button>
      </form>
    </main>
  );
}
`;

const registerSolution = `import { redirect } from "next/navigation";

export async function register(formData: FormData) {
  "use server";

  const email = formData.get("email");
  const password = formData.get("password");

  const response = await fetch(process.env.COFFEE_API_URL + "/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  }).catch(() => null);

  if (response && response.status === 201) {
    redirect("/login?registered=1");
  }

  redirect("/register?error=exists");
}

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <main>
      <h1>Crear cuenta</h1>
      {params.error === "exists" && <p>Ese correo ya está registrado.</p>}
      <form action={register}>
        <label>
          Correo
          <input type="email" name="email" required />
        </label>
        <label>
          Contraseña
          <input type="password" name="password" required />
        </label>
        <button type="submit">Registrarme</button>
      </form>
    </main>
  );
}
`;

const registerSpec = `import { renderToStaticMarkup } from "react-dom/server";
import { __resetSession, __readCookie } from "../../shims/session";
import RegisterPage, { register } from "./page";

const fetchMock = jest.fn();

function makeForm(email: string, password: string): FormData {
  const form = new FormData();
  form.set("email", email);
  form.set("password", password);
  return form;
}

async function redirectPath(fn: () => Promise<unknown>): Promise<string> {
  try {
    await fn();
  } catch (error) {
    const err = error as { name?: string; path?: string };
    if (err && err.name === "RedirectError") {
      return String(err.path);
    }
    throw error;
  }
  throw new Error("Se esperaba un redirect y no ocurrió");
}

beforeEach(() => {
  __resetSession();
  fetchMock.mockReset();
  (globalThis as unknown as { fetch: unknown }).fetch = fetchMock;
  process.env.COFFEE_API_URL = "https://api.test/api";
});

describe("Server Action register", () => {
  it("con 201 redirige a /login?registered=1 y no guarda cookie", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ id: 1, email: "ana@test.com" }),
    });

    const path = await redirectPath(() =>
      register(makeForm("ana@test.com", "secreto123"))
    );

    expect(path).toBe("/login?registered=1");
    expect(__readCookie("coffee_token")).toBeUndefined();
  });

  it("con 409 redirige a /register?error=exists", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 409 });

    const path = await redirectPath(() =>
      register(makeForm("ana@test.com", "secreto123"))
    );

    expect(path).toBe("/register?error=exists");
    expect(__readCookie("coffee_token")).toBeUndefined();
  });

  it("si la red falla redirige a /register?error=exists", async () => {
    fetchMock.mockRejectedValue(new Error("sin red"));

    const path = await redirectPath(() =>
      register(makeForm("ana@test.com", "secreto123"))
    );

    expect(path).toBe("/register?error=exists");
  });

  it("envía un POST JSON a /auth/register", async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 201, json: async () => ({}) });

    await redirectPath(() => register(makeForm("ana@test.com", "secreto123")));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url).endsWith("/auth/register")).toBe(true);
    expect(String(url).startsWith("https://api.test/api")).toBe(true);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({
      email: "ana@test.com",
      password: "secreto123",
    });
    expect(new Headers(init.headers).get("content-type")).toBe("application/json");
  });
});

describe("RegisterPage", () => {
  it("muestra el título y el formulario", async () => {
    const element = await RegisterPage({ searchParams: Promise.resolve({}) });
    const html = renderToStaticMarkup(element);
    expect(html).toContain("Crear cuenta");
    expect(html).toContain('name="email"');
    expect(html).toContain('name="password"');
    expect(html).not.toContain("Ese correo ya está registrado.");
  });

  it("muestra el error cuando el correo ya existe", async () => {
    const element = await RegisterPage({
      searchParams: Promise.resolve({ error: "exists" }),
    });
    const html = renderToStaticMarkup(element);
    expect(html).toContain("Ese correo ya está registrado.");
  });
});
`;

/* ------------------------------------------------------------------ */
/* Temas                                                               */
/* ------------------------------------------------------------------ */

export const uiTopics: Topic[] = [
  {
    id: "next-componentes",
    order: 1,
    title: "Componentes, rutas y listas",
    tagline: "La interfaz de Coffee Orders, todavía sin API",
    description:
      "Páginas, un encabezado compartido, tarjetas con props y un resumen calculado desde datos temporales.",
    exercises: [
      {
        id: "nx-home",
        topicId: "next-componentes",
        order: 1,
        title: "La página de inicio",
        difficulty: "easy",
        minutes: 15,
        summary:
          "Completa src/app/page.tsx para que sea la ruta /. Todavía no hay peticiones HTTP.",
        objectives: [
          "Crear un componente de página en el App Router",
          "Escribir JSX con un título y párrafos",
          "Exportar el componente con export default",
        ],
        hints: [
          'El h1 debe ser exactamente "Coffee Orders Start".',
          "No uses document.querySelector: en Next.js la página es un componente que devuelve JSX.",
          "Una página del App Router siempre se exporta con export default.",
        ],
        files: [ts("src/app/page.tsx", homeStarter)],
        solutionFiles: [ts("src/app/page.tsx", homeSolution)],
        tests: [ts("src/app/page.spec.ts", homeSpec)],
      },
      {
        id: "nx-header",
        topicId: "next-componentes",
        order: 2,
        title: "Encabezado compartido y dos rutas",
        difficulty: "easy",
        minutes: 20,
        summary:
          "AppHeader con Link a /, /orders y /otraPagina. El layout lo muestra una sola vez.",
        objectives: [
          "Navegar entre rutas con next/link",
          "Usar un layout que envuelve a children",
          "No copiar el encabezado en cada página",
        ],
        hints: [
          'import Link from "next/link" y usa <Link href="...">.',
          'El layout importa AppHeader desde "../components/app-header" (export default).',
          "Renderiza <AppHeader /> y luego {children} dentro del body.",
        ],
        files: [
          ts("src/components/app-header.tsx", headerStarter),
          ts("src/app/layout.tsx", layoutStarter),
        ],
        solutionFiles: [
          ts("src/components/app-header.tsx", headerSolution),
          ts("src/app/layout.tsx", layoutSolution),
        ],
        tests: [ts("src/app/layout.spec.ts", layoutSpec)],
      },
      {
        id: "nx-summary",
        topicId: "next-componentes",
        order: 3,
        title: "Tarjetas y resumen de pedidos",
        difficulty: "medium",
        minutes: 30,
        summary:
          "OrderCard recibe el pedido por props. OrdersSummary recibe total, pending y ready. OrdersPage calcula esos números con length y filter a partir de sampleOrders. Con los datos de práctica: 3 pedidos, 2 pendientes y 1 listo.",
        objectives: [
          "Pasar datos a un componente con props",
          "Recorrer una lista con map y key",
          "Separar los datos de la presentación",
        ],
        hints: [
          "No importes sampleOrders dentro de OrdersSummary: debe usar solo sus props.",
          'El estado "ready" muestra "Listo" y "pending" muestra "Pendiente".',
          "Usa key={order.id} al recorrer la lista con map.",
        ],
        files: [
          ts("src/types/order-summary.ts", orderSummaryType, true),
          ts("src/data/sample-orders.ts", sampleOrdersData, true),
          ts("src/components/order-card.tsx", orderCardStarter),
          ts("src/components/orders-summary.tsx", ordersSummaryStarter),
          ts("src/app/orders/page.tsx", summaryPageStarter),
        ],
        solutionFiles: [
          ts("src/components/order-card.tsx", orderCardSolution),
          ts("src/components/orders-summary.tsx", ordersSummarySolution),
          ts("src/app/orders/page.tsx", summaryPageSolution),
        ],
        tests: [
          ts("src/components/order-card.spec.ts", orderCardSpec),
          ts("src/components/orders-summary.spec.ts", ordersSummarySpec),
          ts("src/app/orders-page.spec.ts", ordersPageSpec),
        ],
      },
    ],
  },
  {
    id: "next-api",
    order: 2,
    title: "Conectar el frontend con la API",
    tagline: "Login, cookie y pedidos reales",
    description:
      "Server Actions, cookie httpOnly coffee_token y fetch desde el servidor de Next.js hacia NestJS. El navegador no arma el Bearer.",
    exercises: [
      {
        id: "nx-login",
        topicId: "next-api",
        order: 1,
        title: "Iniciar sesión y guardar el token",
        difficulty: "medium",
        minutes: 30,
        summary:
          'Completa la Server Action login. POST JSON a ${process.env.COFFEE_API_URL}/auth/login. Si ok y data.access_token es string, guarda la cookie coffee_token (httpOnly, sameSite lax, path /, maxAge 15*60) y redirect("/orders"). Si falla, redirect("/login?error=1") y no guardes cookie.',
        objectives: [
          '"use server" dentro de la función',
          "Leer los campos de un FormData",
          "Guardar una cookie httpOnly desde el servidor",
          "Redirigir con redirect",
        ],
        hints: [
          'Lee los campos con formData.get("email") y formData.get("password").',
          "No pegues el JWT en el código: viene en la respuesta de la API.",
          "Usa fetch(...).catch(() => null) para tratar un error de red como un fallo más.",
          "redirect lanza una excepción: no lo pongas dentro de un try/catch.",
        ],
        files: [ts("src/app/login/page.tsx", loginStarter)],
        solutionFiles: [ts("src/app/login/page.tsx", loginSolution)],
        tests: [ts("src/app/login/login.spec.ts", loginSpec)],
      },
      {
        id: "nx-orders-fetch",
        topicId: "next-api",
        order: 2,
        title: "Mostrar pedidos con la sesión",
        difficulty: "medium",
        minutes: 30,
        summary:
          'OrdersPage lee coffee_token. Sin cookie, redirect /login. Con cookie, GET ${COFFEE_API_URL}/orders con Authorization Bearer y cache no-store. 401 también vuelve a /login. Lista vacía: "Todavía no hay pedidos." Error: "No se pudieron consultar los pedidos." logout borra la cookie y redirect /login.',
        objectives: [
          "Leer una cookie en el servidor",
          "Enviar el Bearer solo desde el servidor hacia NestJS",
          "Mostrar los estados vacío y de error",
        ],
        hints: [
          'Lee el token con cookieStore.get("coffee_token")?.value.',
          "No reenvíes la cookie a la API: envía el header Authorization.",
          'Usa cache: "no-store" para que la lista no se quede guardada.',
        ],
        files: [ts("src/app/orders/page.tsx", ordersFetchStarter)],
        solutionFiles: [ts("src/app/orders/page.tsx", ordersFetchSolution)],
        tests: [ts("src/app/orders/orders.spec.ts", ordersFetchSpec)],
      },
      {
        id: "nx-register",
        topicId: "next-api",
        order: 3,
        title: "Crear una cuenta",
        difficulty: "medium",
        minutes: 25,
        summary:
          "register envía POST ${COFFEE_API_URL}/auth/register con email y password. 201 redirige a /login?registered=1 y NO guarda cookie. Cualquier otra respuesta redirige a /register?error=exists.",
        objectives: [
          "Entender que registrar no es iniciar sesión",
          "Saber que el token no viene en la respuesta de register",
        ],
        hints: [
          "Usa los mismos campos email y password que en el login.",
          "No llames a cookies().set: el usuario aún debe iniciar sesión.",
        ],
        files: [ts("src/app/register/page.tsx", registerStarter)],
        solutionFiles: [ts("src/app/register/page.tsx", registerSolution)],
        tests: [ts("src/app/register/register.spec.ts", registerSpec)],
      },
    ],
  },
];
