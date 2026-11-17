import type { Topic } from "@/lib/types";

const coffeeApi = `import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function requireCoffeeToken(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get("coffee_token")?.value;

  if (!token) {
    redirect("/login");
  }

  return token;
}

export async function coffeeFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response | null> {
  const token = await requireCoffeeToken();
  const headers = new Headers(init.headers);
  headers.set("Authorization", "Bearer " + token);

  let response: Response;

  try {
    response = await fetch(
      (process.env.COFFEE_API_URL ?? "") + path,
      {
        ...init,
        headers,
        cache: "no-store",
      },
    );
  } catch {
    return null;
  }

  if (response.status === 401) {
    redirect("/login");
  }

  return response;
}
`;

export const boardTopics: Topic[] = [
  {
    id: "next-tablero",
    order: 3,
    title: "Filtros y actualización del tablero",
    tagline: "La URL pide el filtro a NestJS",
    description:
      "searchParams elige el endpoint, un componente de cliente refresca la ruta y una Server Action crea un pedido.",
    exercises: [
      {
        id: "nx-filters",
        topicId: "next-tablero",
        order: 1,
        title: "Filtrar pedidos desde la URL",
        difficulty: "medium",
        minutes: 25,
        summary:
          "Completa ordersEndpoint para elegir la consulta a partir de searchParams y muestra enlaces para filtrar el tablero.",
        objectives: [
          "Esperar searchParams antes de leer el estado",
          "Aceptar solo pending y ready como filtros",
          "Usar Link para conservar el filtro en la URL",
        ],
        hints: [
          "Comprueba Array.isArray(status) antes de comparar el valor.",
          "Solo pending y ready usan /orders/search; cualquier otro valor usa /orders.",
          "La página es async porque searchParams es una Promise.",
        ],
        files: [
          {
            path: "src/lib/orders-endpoint.ts",
            language: "typescript",
            content: `export function ordersEndpoint(
  status: string | string[] | undefined,
): string {
  // TODO: devuelve la ruta filtrada solo para "pending" y "ready"
  return "/orders";
}
`,
          },
          {
            path: "src/app/orders/page.tsx",
            language: "typescript",
            content: `import Link from "next/link";
import { ordersEndpoint } from "../../lib/orders-endpoint";

type OrdersPageProps = {
  searchParams: Promise<{
    status?: string | string[];
  }>;
};

export default async function OrdersPage({
  searchParams,
}: OrdersPageProps) {
  // TODO: espera searchParams y conserva status aunque sea un arreglo
  const status = undefined;

  return (
    <main>
      <h1>Pedidos</h1>
      <nav aria-label="Filtrar pedidos">
        <Link href="/orders">Todos</Link>
        <Link href="/orders?status=pending">Pendientes</Link>
        <Link href="/orders?status=ready">Listos</Link>
      </nav>
      <p>Consulta: {ordersEndpoint(status)}</p>
    </main>
  );
}
`,
          },
        ],
        solutionFiles: [
          {
            path: "src/lib/orders-endpoint.ts",
            language: "typescript",
            content: `export function ordersEndpoint(
  status: string | string[] | undefined,
): string {
  if (status === "pending" || status === "ready") {
    return "/orders/search?status=" + status + "&limit=20";
  }

  return "/orders";
}
`,
          },
          {
            path: "src/app/orders/page.tsx",
            language: "typescript",
            content: `import Link from "next/link";
import { ordersEndpoint } from "../../lib/orders-endpoint";

type OrdersPageProps = {
  searchParams: Promise<{
    status?: string | string[];
  }>;
};

export default async function OrdersPage({
  searchParams,
}: OrdersPageProps) {
  const { status } = await searchParams;

  return (
    <main>
      <h1>Pedidos</h1>
      <nav aria-label="Filtrar pedidos">
        <Link href="/orders">Todos</Link>
        <Link href="/orders?status=pending">Pendientes</Link>
        <Link href="/orders?status=ready">Listos</Link>
      </nav>
      <p>Consulta: {ordersEndpoint(status)}</p>
    </main>
  );
}
`,
          },
        ],
        tests: [
          {
            path: "src/lib/orders-endpoint.spec.ts",
            language: "typescript",
            content: `import { renderToStaticMarkup } from "react-dom/server";
import OrdersPage from "../app/orders/page";
import { ordersEndpoint } from "./orders-endpoint";

describe("ordersEndpoint", () => {
  it("construye las rutas de los filtros permitidos", () => {
    expect(ordersEndpoint("pending")).toBe(
      "/orders/search?status=pending&limit=20",
    );
    expect(ordersEndpoint("ready")).toBe(
      "/orders/search?status=ready&limit=20",
    );
  });

  it("ignora estados desconocidos y arreglos", () => {
    expect(ordersEndpoint(undefined)).toBe("/orders");
    expect(ordersEndpoint("otro")).toBe("/orders");
    expect(ordersEndpoint(["pending"])).toBe("/orders");
  });

  it("lee searchParams y conserva los enlaces del tablero", async () => {
    const page = await OrdersPage({
      searchParams: Promise.resolve({ status: "pending" }),
    });
    const html = renderToStaticMarkup(page);

    expect(html).toContain(
      "Consulta: /orders/search?status=pending&amp;limit=20",
    );
    expect(html).toContain('href="/orders?status=ready"');
  });
});
`,
          },
        ],
      },
      {
        id: "nx-refresh",
        topicId: "next-tablero",
        order: 2,
        title: "Actualizar sin cambiar de página",
        difficulty: "medium",
        minutes: 25,
        summary:
          "Crea RefreshOrders como componente de cliente con actualización manual y automática cuando la pestaña está visible.",
        objectives: [
          "Usar useRouter para refrescar la ruta actual",
          "Controlar el auto refresco con estado local",
          "Crear y limpiar un intervalo dentro de useEffect",
        ],
        hints: [
          "El estado autoRefresh empieza en false.",
          "Devuelve clearInterval(intervalId) desde el efecto.",
          "Consulta document.visibilityState dentro del callback, no al crear el intervalo.",
        ],
        files: [
          {
            path: "src/components/refresh-orders/refresh-orders.tsx",
            language: "typescript",
            content: `"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RefreshOrders() {
  const router = useRouter();
  const [autoRefresh, setAutoRefresh] = useState(false);

  // TODO: crea un efecto con un intervalo de 25000 ms cuando autoRefresh
  // esté activo. Refresca solo si la pestaña está visible y limpia el intervalo.

  return (
    <section>
      <button type="button">
        Actualizar
      </button>
      <label>
        <input
          type="checkbox"
          checked={autoRefresh}
          onChange={(event) => setAutoRefresh(event.target.checked)}
        />
        Actualización automática
      </label>
    </section>
  );
}
`,
          },
        ],
        solutionFiles: [
          {
            path: "src/components/refresh-orders/refresh-orders.tsx",
            language: "typescript",
            content: `"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function RefreshOrders() {
  const router = useRouter();
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    if (!autoRefresh) {
      return;
    }

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    }, 25000);

    return () => window.clearInterval(intervalId);
  }, [autoRefresh, router]);

  return (
    <section>
      <button type="button" onClick={() => router.refresh()}>
        Actualizar
      </button>
      <label>
        <input
          type="checkbox"
          checked={autoRefresh}
          onChange={(event) => setAutoRefresh(event.target.checked)}
        />
        Actualización automática
      </label>
    </section>
  );
}
`,
          },
        ],
        tests: [
          {
            path:
              "src/components/refresh-orders/refresh-orders.spec.ts",
            language: "typescript",
            content: `/** @jest-environment jsdom */

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  __refreshCount,
  __resetSession,
} from "../../shims/session";
import RefreshOrders from "./refresh-orders";

describe("RefreshOrders", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    __resetSession();
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    act(() => {
      root.render(React.createElement(RefreshOrders));
    });
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    jest.restoreAllMocks();
  });

  it("empieza sin actualización automática", () => {
    const button = container.querySelector("button");
    const checkbox = container.querySelector(
      'input[type="checkbox"]',
    ) as HTMLInputElement | null;

    expect(button?.textContent).toContain("Actualizar");
    expect(checkbox?.checked).toBe(false);
  });

  it("refresca al pulsar el botón", () => {
    const button = container.querySelector("button");

    act(() => button?.dispatchEvent(new MouseEvent("click", {
      bubbles: true,
    })));

    expect(__refreshCount()).toBe(1);
  });

  it("crea el intervalo y refresca cuando la pestaña está visible", () => {
    let intervalCallback: (() => void) | undefined;
    const intervalSpy = jest
      .spyOn(window, "setInterval")
      .mockImplementation(((callback: TimerHandler, delay?: number) => {
        intervalCallback = callback as () => void;
        return 17;
      }) as typeof window.setInterval);
    const checkbox = container.querySelector(
      'input[type="checkbox"]',
    ) as HTMLInputElement;

    act(() => checkbox.dispatchEvent(new MouseEvent("click", {
      bubbles: true,
    })));

    expect(intervalSpy).toHaveBeenCalledWith(
      expect.any(Function),
      25000,
    );

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
    act(() => intervalCallback?.());

    expect(__refreshCount()).toBe(1);
  });
});
`,
          },
        ],
      },
      {
        id: "nx-create-order",
        topicId: "next-tablero",
        order: 3,
        title: "Crear un pedido desde el formulario",
        difficulty: "medium",
        minutes: 30,
        summary:
          "Implementa una Server Action que lee FormData, autentica con la cookie y traduce la respuesta de la API a una redirección.",
        objectives: [
          "Leer la cookie dentro de la Server Action",
          "Convertir quantity y customerId a números",
          "Enviar JSON sin permitir que el formulario elija status",
        ],
        hints: [
          "Llama cookies() antes de intentar fetch.",
          "Construye el body campo por campo; no serialices todo FormData.",
          "redirect lanza y termina la ejecución de la acción.",
        ],
        files: [
          {
            path: "src/app/orders/new/page.tsx",
            language: "typescript",
            content: `import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function createOrder(formData: FormData) {
  "use server";

  // TODO: lee coffee_token antes del fetch
  // TODO: envía item, quantity y customerId como JSON, sin status
  // TODO: redirige según el status de la respuesta
  void formData;
  void cookies;
  redirect("/orders/new?error=api");
}

type NewOrderPageProps = {
  searchParams: Promise<{ error?: string | string[] }>;
};

export default async function NewOrderPage({
  searchParams,
}: NewOrderPageProps) {
  const { error } = await searchParams;
  const messages: Record<string, string> = {
    invalid: "Revisa los datos del pedido.",
    customer: "No se encontró el cliente.",
    api: "No se pudo crear el pedido.",
  };
  const message = typeof error === "string" ? messages[error] : undefined;

  return (
    <main>
      <h1>Nuevo pedido</h1>
      {message ? <p role="alert">{message}</p> : null}
      <form action={createOrder}>
        <label>
          Producto
          <input name="item" />
        </label>
        <label>
          Cantidad
          <input name="quantity" type="number" />
        </label>
        <label>
          Cliente
          <input name="customerId" type="number" />
        </label>
        <button type="submit">Crear pedido</button>
      </form>
    </main>
  );
}
`,
          },
        ],
        solutionFiles: [
          {
            path: "src/app/orders/new/page.tsx",
            language: "typescript",
            content: `import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function createOrder(formData: FormData) {
  "use server";

  const cookieStore = await cookies();
  const token = cookieStore.get("coffee_token")?.value;

  if (!token) {
    redirect("/login");
  }

  const response = await fetch(
    (process.env.COFFEE_API_URL ?? "") + "/orders",
    {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        item: String(formData.get("item") ?? ""),
        quantity: Number(formData.get("quantity")),
        customerId: Number(formData.get("customerId")),
      }),
    },
  );

  if (response.status === 401) {
    redirect("/login");
  }

  if (response.status === 400) {
    redirect("/orders/new?error=invalid");
  }

  if (response.status === 404) {
    redirect("/orders/new?error=customer");
  }

  if (response.status === 201) {
    redirect("/orders");
  }

  redirect("/orders/new?error=api");
}

type NewOrderPageProps = {
  searchParams: Promise<{ error?: string | string[] }>;
};

export default async function NewOrderPage({
  searchParams,
}: NewOrderPageProps) {
  const { error } = await searchParams;
  const messages: Record<string, string> = {
    invalid: "Revisa los datos del pedido.",
    customer: "No se encontró el cliente.",
    api: "No se pudo crear el pedido.",
  };
  const message = typeof error === "string" ? messages[error] : undefined;

  return (
    <main>
      <h1>Nuevo pedido</h1>
      {message ? <p role="alert">{message}</p> : null}
      <form action={createOrder}>
        <label>
          Producto
          <input name="item" />
        </label>
        <label>
          Cantidad
          <input name="quantity" type="number" />
        </label>
        <label>
          Cliente
          <input name="customerId" type="number" />
        </label>
        <button type="submit">Crear pedido</button>
      </form>
    </main>
  );
}
`,
          },
        ],
        tests: [
          {
            path: "src/app/orders/new/page.spec.ts",
            language: "typescript",
            content: `import {
  __resetSession,
  __seedCookie,
} from "../../../shims/session";
import { createOrder } from "./page";

function orderForm() {
  const formData = new FormData();
  formData.set("item", "Mocha");
  formData.set("quantity", "2");
  formData.set("customerId", "4");
  formData.set("status", "ready");
  return formData;
}

async function redirectedPath(action: Promise<unknown>) {
  try {
    await action;
  } catch (error) {
    return (error as { path?: string }).path;
  }
  return undefined;
}

describe("createOrder", () => {
  beforeEach(() => {
    __resetSession();
    process.env.COFFEE_API_URL = "https://api.test/api";
    global.fetch = jest.fn();
  });

  it("redirige al login antes de fetch cuando falta la cookie", async () => {
    expect(await redirectedPath(createOrder(orderForm()))).toBe("/login");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("crea el pedido autenticado sin enviar status", async () => {
    __seedCookie("coffee_token", "token-secreto");
    (global.fetch as jest.Mock).mockResolvedValue(
      new Response(null, { status: 201 }),
    );

    expect(await redirectedPath(createOrder(orderForm()))).toBe("/orders");
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.test/api/orders",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer token-secreto",
        }),
      }),
    );
    const init = (global.fetch as jest.Mock).mock.calls[0][1] as RequestInit;
    const body = JSON.parse(String(init.body));
    expect(body).toEqual({
      item: "Mocha",
      quantity: 2,
      customerId: 4,
    });
    expect(body).not.toHaveProperty("status");
  });

  it.each([
    [400, "/orders/new?error=invalid"],
    [404, "/orders/new?error=customer"],
    [500, "/orders/new?error=api"],
    [401, "/login"],
  ])("traduce el status %i", async (status, path) => {
    __seedCookie("coffee_token", "token");
    (global.fetch as jest.Mock).mockResolvedValue(
      new Response(null, { status }),
    );

    expect(await redirectedPath(createOrder(orderForm()))).toBe(path);
  });
});
`,
          },
        ],
      },
    ],
  },
  {
    id: "next-sesion",
    order: 4,
    title: "Sesión compartida, detalle y rol",
    tagline: "Un helper, el id real y el permiso de crear",
    description:
      "coffeeFetch reutiliza la cookie y el 401. El alta abre /orders/[id]. El rol de práctica sale de GET /auth/me comparado con COFFEE_DEMO_MANAGER_EMAIL.",
    exercises: [
      {
        id: "nx-coffee-fetch",
        topicId: "next-sesion",
        order: 1,
        title: "Helper de peticiones privadas",
        difficulty: "medium",
        minutes: 25,
        summary:
          "Centraliza la cookie, el encabezado Bearer, cache no-store y la redirección por 401 en un helper exclusivo del servidor.",
        objectives: [
          "Impedir que el token viaje por props",
          "Reutilizar la autenticación entre páginas y acciones",
          "Distinguir un fallo de red de una respuesta HTTP",
        ],
        hints: [
          "cookies() es asíncrono en esta versión de Next.js.",
          "Captura solo el rechazo de fetch; redirect también lanza.",
          "Comprueba el 401 después del bloque try/catch.",
        ],
        files: [
          {
            path: "src/lib/coffee-api.ts",
            language: "typescript",
            content: `import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function requireCoffeeToken(): Promise<string> {
  // TODO: lee coffee_token y redirige a /login cuando falte
  void cookies;
  void redirect;
  throw new Error("TODO");
}

export async function coffeeFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response | null> {
  // TODO: agrega Bearer, usa cache no-store y maneja 401 y fallos de red
  void path;
  void init;
  throw new Error("TODO");
}
`,
          },
        ],
        solutionFiles: [
          {
            path: "src/lib/coffee-api.ts",
            language: "typescript",
            content: coffeeApi,
          },
        ],
        tests: [
          {
            path: "src/lib/coffee-api.spec.ts",
            language: "typescript",
            content: `import {
  __resetSession,
  __seedCookie,
} from "../shims/session";
import {
  coffeeFetch,
  requireCoffeeToken,
} from "./coffee-api";

async function redirectedPath(action: Promise<unknown>) {
  try {
    await action;
  } catch (error) {
    return (error as { path?: string }).path;
  }
  return undefined;
}

describe("coffee-api", () => {
  beforeEach(() => {
    __resetSession();
    process.env.COFFEE_API_URL = "https://api.test/api";
    global.fetch = jest.fn();
  });

  it("exige la cookie de sesión", async () => {
    expect(await redirectedPath(requireCoffeeToken())).toBe("/login");

    __seedCookie("coffee_token", "abc123");
    await expect(requireCoffeeToken()).resolves.toBe("abc123");
  });

  it("envía el token al endpoint privado sin cache", async () => {
    __seedCookie("coffee_token", "abc123");
    const response = new Response("[]", { status: 200 });
    (global.fetch as jest.Mock).mockResolvedValue(response);

    await expect(coffeeFetch("/orders")).resolves.toBe(response);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.test/api/orders",
      expect.objectContaining({ cache: "no-store" }),
    );
    const init = (global.fetch as jest.Mock).mock.calls[0][1] as RequestInit;
    expect(new Headers(init.headers).get("Authorization")).toBe(
      "Bearer abc123",
    );
  });

  it("redirige un 401 al login", async () => {
    __seedCookie("coffee_token", "abc123");
    (global.fetch as jest.Mock).mockResolvedValue(
      new Response(null, { status: 401 }),
    );

    expect(await redirectedPath(coffeeFetch("/orders"))).toBe("/login");
  });

  it("devuelve null si falla la red", async () => {
    __seedCookie("coffee_token", "abc123");
    (global.fetch as jest.Mock).mockRejectedValue(new Error("sin red"));

    await expect(coffeeFetch("/orders")).resolves.toBeNull();
  });
});
`,
          },
        ],
      },
      {
        id: "nx-order-detail",
        topicId: "next-sesion",
        order: 2,
        title: "Detalle y el id que devuelve el POST",
        difficulty: "medium",
        minutes: 35,
        summary:
          "Valida el segmento dinámico, muestra la estimación y abre el detalle usando el id real devuelto por el alta.",
        objectives: [
          "Validar un segmento dinámico sin aceptar formatos ambiguos",
          "Convertir 404 de la API en notFound",
          "Usar el id de la respuesta 201 en lugar de uno fijo",
        ],
        hints: [
          "Además de Number.isInteger, compara id con String(orderId).",
          "Lee el JSON de la respuesta 201 antes de redirigir.",
          "Un id ausente, textual o menor que uno usa el error receipt.",
        ],
        files: [
          {
            path: "src/lib/coffee-api.ts",
            language: "typescript",
            content: coffeeApi,
            readOnly: true,
          },
          {
            path: "src/app/orders/[id]/page.tsx",
            language: "typescript",
            content: `import { notFound } from "next/navigation";
import { coffeeFetch } from "../../../lib/coffee-api";

type OrderDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrderDetailPage({
  params,
}: OrderDetailPageProps) {
  const { id } = await params;

  // TODO: valida que id sea el string canónico de un entero positivo
  // TODO: consulta /orders/:id/estimate y convierte 404 en notFound()
  void id;
  void coffeeFetch;
  notFound();
}
`,
          },
          {
            path: "src/app/orders/new/create-order.ts",
            language: "typescript",
            content: `import { redirect } from "next/navigation";
import { coffeeFetch } from "../../../lib/coffee-api";

export async function createOrder(formData: FormData) {
  "use server";

  // TODO: publica el pedido con coffeeFetch
  // TODO: usa el id numérico de la respuesta 201 para abrir el detalle
  void formData;
  void coffeeFetch;
  redirect("/orders/new?error=api");
}
`,
          },
        ],
        solutionFiles: [
          {
            path: "src/app/orders/[id]/page.tsx",
            language: "typescript",
            content: `import { notFound } from "next/navigation";
import { coffeeFetch } from "../../../lib/coffee-api";

type OrderDetailPageProps = {
  params: Promise<{ id: string }>;
};

type Estimate = {
  orderId: number;
  status: "pending" | "ready";
  estimatedMinutes: number;
};

export default async function OrderDetailPage({
  params,
}: OrderDetailPageProps) {
  const { id } = await params;
  const orderId = Number(id);

  if (
    !Number.isInteger(orderId) ||
    orderId < 1 ||
    String(orderId) !== id
  ) {
    notFound();
  }

  const response = await coffeeFetch(
    "/orders/" + orderId + "/estimate",
  );

  if (response?.status === 404) {
    notFound();
  }

  if (!response?.ok) {
    return <p role="alert">No se pudo cargar el pedido.</p>;
  }

  const estimate = (await response.json()) as Estimate;

  return (
    <main>
      <h1>Pedido {estimate.orderId}</h1>
      <p>Estado: {estimate.status === "ready" ? "Listo" : "Pendiente"}</p>
      <p>Tiempo estimado: {estimate.estimatedMinutes} minutos</p>
    </main>
  );
}
`,
          },
          {
            path: "src/app/orders/new/create-order.ts",
            language: "typescript",
            content: `import { redirect } from "next/navigation";
import { coffeeFetch } from "../../../lib/coffee-api";

export async function createOrder(formData: FormData) {
  "use server";

  const response = await coffeeFetch("/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      item: String(formData.get("item") ?? "").trim(),
      quantity: Number(formData.get("quantity")),
      customerId: Number(formData.get("customerId")),
    }),
  });

  if (!response) {
    redirect("/orders/new?error=api");
  }

  if (response.status === 400) {
    redirect("/orders/new?error=invalid");
  }

  if (response.status === 404) {
    redirect("/orders/new?error=customer");
  }

  if (response.status !== 201) {
    redirect("/orders/new?error=api");
  }

  let receipt: { id?: unknown };

  try {
    receipt = (await response.json()) as { id?: unknown };
  } catch {
    redirect("/orders/new?error=receipt");
  }

  if (
    typeof receipt.id !== "number" ||
    !Number.isInteger(receipt.id) ||
    receipt.id < 1
  ) {
    redirect("/orders/new?error=receipt");
  }

  redirect("/orders/" + receipt.id);
}
`,
          },
        ],
        tests: [
          {
            path: "src/app/orders/[id]/page.spec.ts",
            language: "typescript",
            content: `import { renderToStaticMarkup } from "react-dom/server";
import {
  __resetSession,
  __seedCookie,
} from "../../../shims/session";
import OrderDetailPage from "./page";

async function thrownName(action: Promise<unknown>) {
  try {
    await action;
  } catch (error) {
    return (error as Error).name;
  }
  return undefined;
}

describe("OrderDetailPage", () => {
  beforeEach(() => {
    __resetSession();
    __seedCookie("coffee_token", "token");
    process.env.COFFEE_API_URL = "https://api.test/api";
    global.fetch = jest.fn();
  });

  it.each(["0", "1.5", "01"])("rechaza el id %s", async (id) => {
    expect(
      await thrownName(OrderDetailPage({
        params: Promise.resolve({ id }),
      })),
    ).toBe("NotFoundError");
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("convierte el 404 de la API en notFound", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      new Response(null, { status: 404 }),
    );

    expect(
      await thrownName(OrderDetailPage({
        params: Promise.resolve({ id: "4" }),
      })),
    ).toBe("NotFoundError");
  });

  it("muestra el estado y el tiempo estimado", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      Response.json(
        { orderId: 4, status: "ready", estimatedMinutes: 12 },
        { status: 200 },
      ),
    );

    const page = await OrderDetailPage({
      params: Promise.resolve({ id: "4" }),
    });
    const html = renderToStaticMarkup(page);

    expect(html).toContain("Listo");
    expect(html).toContain("Tiempo estimado: 12 minutos");
  });
});
`,
          },
          {
            path: "src/app/orders/new/create-order.spec.ts",
            language: "typescript",
            content: `import {
  __resetSession,
  __seedCookie,
} from "../../../shims/session";
import { createOrder } from "./create-order";

function orderForm() {
  const formData = new FormData();
  formData.set("item", "  Mocha  ");
  formData.set("quantity", "2");
  formData.set("customerId", "4");
  return formData;
}

async function redirectedPath(action: Promise<unknown>) {
  try {
    await action;
  } catch (error) {
    return (error as { path?: string }).path;
  }
  return undefined;
}

describe("createOrder con recibo", () => {
  beforeEach(() => {
    __resetSession();
    __seedCookie("coffee_token", "token");
    process.env.COFFEE_API_URL = "https://api.test/api";
    global.fetch = jest.fn();
  });

  it("redirige al id numérico devuelto por la API", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      Response.json({ id: 42 }, { status: 201 }),
    );

    expect(await redirectedPath(createOrder(orderForm()))).toBe(
      "/orders/42",
    );
    const calledUrl = (global.fetch as jest.Mock).mock.calls[0][0];
    expect(calledUrl).toBe("https://api.test/api/orders");
    expect(calledUrl).not.toContain("/orders/7");
  });

  it("rechaza un id textual en el recibo", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      Response.json({ id: "42" }, { status: 201 }),
    );

    expect(await redirectedPath(createOrder(orderForm()))).toBe(
      "/orders/new?error=receipt",
    );
  });
});
`,
          },
        ],
      },
      {
        id: "nx-roles",
        topicId: "next-sesion",
        order: 3,
        title: "Permiso para crear según el rol",
        difficulty: "medium",
        minutes: 30,
        summary:
          "Obtén el rol de práctica desde /auth/me y protege las operaciones de manager con una comparación normalizada.",
        objectives: [
          "Derivar un rol sin exponer la cookie",
          "Normalizar email y configuración antes de comparar",
          "Redirigir a un usuario sin permiso",
        ],
        hints: [
          "Comprueba response.ok antes de leer el perfil.",
          "Aplica trim().toLowerCase() a ambos correos.",
          "requireDemoManager puede reutilizar getDemoRole.",
        ],
        files: [
          {
            path: "src/lib/coffee-api.ts",
            language: "typescript",
            content: coffeeApi,
            readOnly: true,
          },
          {
            path: "src/lib/demo-role.ts",
            language: "typescript",
            content: `import { redirect } from "next/navigation";
import { coffeeFetch } from "./coffee-api";

export type DemoRole = "manager" | "viewer";

export async function getDemoRole(): Promise<DemoRole | null> {
  // TODO: consulta /auth/me y compara su email con
  // COFFEE_DEMO_MANAGER_EMAIL después de normalizar ambos
  void coffeeFetch;
  return null;
}

export async function requireDemoManager(): Promise<void> {
  // TODO: redirige a /orders?notice=forbidden si el rol no es manager
  void redirect;
}
`,
          },
        ],
        solutionFiles: [
          {
            path: "src/lib/demo-role.ts",
            language: "typescript",
            content: `import { redirect } from "next/navigation";
import { coffeeFetch } from "./coffee-api";

export type DemoRole = "manager" | "viewer";

export async function getDemoRole(): Promise<DemoRole | null> {
  const response = await coffeeFetch("/auth/me");

  if (!response?.ok) {
    return null;
  }

  let profile: { email?: unknown };

  try {
    profile = (await response.json()) as { email?: unknown };
  } catch {
    return null;
  }

  if (typeof profile.email !== "string") {
    return null;
  }

  const email = profile.email.trim().toLowerCase();
  const managerEmail = (
    process.env.COFFEE_DEMO_MANAGER_EMAIL ?? ""
  ).trim().toLowerCase();

  if (!email) {
    return null;
  }

  return email === managerEmail ? "manager" : "viewer";
}

export async function requireDemoManager(): Promise<void> {
  const role = await getDemoRole();

  if (role !== "manager") {
    redirect("/orders?notice=forbidden");
  }
}
`,
          },
        ],
        tests: [
          {
            path: "src/lib/demo-role.spec.ts",
            language: "typescript",
            content: `import {
  __resetSession,
  __seedCookie,
} from "../shims/session";
import {
  getDemoRole,
  requireDemoManager,
} from "./demo-role";

async function redirectedPath(action: Promise<unknown>) {
  try {
    await action;
  } catch (error) {
    return (error as { path?: string }).path;
  }
  return undefined;
}

describe("roles de práctica", () => {
  beforeEach(() => {
    __resetSession();
    __seedCookie("coffee_token", "token");
    process.env.COFFEE_API_URL = "https://api.test/api";
    process.env.COFFEE_DEMO_MANAGER_EMAIL = " manager@example.com ";
    global.fetch = jest.fn();
  });

  it("reconoce al manager sin importar mayúsculas", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      Response.json({ email: "Manager@Example.com" }),
    );

    await expect(getDemoRole()).resolves.toBe("manager");
  });

  it("asigna viewer a otro email", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      Response.json({ email: "cliente@example.com" }),
    );

    await expect(getDemoRole()).resolves.toBe("viewer");
  });

  it("devuelve null sin email o con respuesta fallida", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      Response.json({ email: "" }),
    );
    await expect(getDemoRole()).resolves.toBeNull();

    (global.fetch as jest.Mock).mockResolvedValueOnce(
      new Response(null, { status: 500 }),
    );
    await expect(getDemoRole()).resolves.toBeNull();
  });

  it("redirige al viewer", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      Response.json({ email: "cliente@example.com" }),
    );

    expect(await redirectedPath(requireDemoManager())).toBe(
      "/orders?notice=forbidden",
    );
  });

  it("permite continuar al manager", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      Response.json({ email: "manager@example.com" }),
    );

    await expect(requireDemoManager()).resolves.toBeUndefined();
  });
});
`,
          },
        ],
      },
    ],
  },
];
