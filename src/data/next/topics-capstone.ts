import type { ExerciseFile, Topic } from "@/lib/types";

function ts(path: string, content: string, readOnly?: boolean): ExerciseFile {
  return readOnly
    ? { path, language: "typescript", content, readOnly: true }
    : { path, language: "typescript", content };
}

/* -------------------------------------------------------------------------- */
/*                     TOPIC A · Preparcial: impresión                         */
/* -------------------------------------------------------------------------- */

const printApiStarter = `import "server-only";
import { cookies } from "next/headers";

// La cookie de sesión se llama print_token.
export async function requirePrintToken(): Promise<string> {
  const store = await cookies();
  // TODO: si la cookie no existe, redirige a /login con redirect() de next/navigation.
  return store.get("print_token")?.value ?? "";
}

export async function printFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  // TODO 1: obtén el token con requirePrintToken().
  // TODO 2: llama a process.env.PRINT_API_URL + path con cache "no-store"
  //         y el header Authorization: "Bearer <token>".
  // TODO 3: si la respuesta es 401, redirige a /login.
  return fetch(path, init);
}
`;

const printApiSolution = `import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function requirePrintToken(): Promise<string> {
  const store = await cookies();
  const token = store.get("print_token")?.value;
  if (!token) {
    redirect("/login");
  }
  return token;
}

export async function printFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = await requirePrintToken();
  const response = await fetch(process.env.PRINT_API_URL + path, {
    ...init,
    headers: {
      ...(init.headers as Record<string, string> | undefined),
      Authorization: "Bearer " + token,
    },
    cache: "no-store",
  });

  if (response.status === 401) {
    redirect("/login");
  }
  return response;
}
`;

const printQueryStarter = `export function printRequestsPath(
  status: string | string[] | undefined,
): string {
  if (status === undefined) {
    return "/api/print-requests";
  }
  // TODO: solo el string "pending" agrega ?status=pending.
  // Un arreglo (["pending"]) o cualquier otro valor devuelve /api/print-requests.
  return "/api/print-requests";
}
`;

const printQuerySolution = `export function printRequestsPath(
  status: string | string[] | undefined,
): string {
  if (status === "pending") {
    return "/api/print-requests?status=pending";
  }
  return "/api/print-requests";
}
`;

const printActionsStarter = `import { printFetch } from "../../lib/print-api";

export async function createPrintRequest(formData: FormData) {
  "use server";
  const title = String(formData.get("title") ?? "");

  // TODO 1: lee pages y printerId con Number(...).
  // TODO 2: POST JSON a /api/print-requests con { title, pages, printerId }
  //         (sin id ni status) usando printFetch.
  // TODO 3: si el status HTTP no es 201, return (sin redirect).
  // TODO 4: si el json trae un id entero >= 1, redirect("/print-requests/" + id).
  void printFetch;
  throw new Error("TODO: crear la solicitud " + title);
}
`;

const printActionsSolution = `import { redirect } from "next/navigation";
import { printFetch } from "../../lib/print-api";

export async function createPrintRequest(formData: FormData) {
  "use server";
  const title = String(formData.get("title") ?? "");
  const pages = Number(formData.get("pages"));
  const printerId = Number(formData.get("printerId"));

  const response = await printFetch("/api/print-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, pages, printerId }),
  });

  if (response.status !== 201) {
    return;
  }

  const created: { id?: unknown } = await response.json();
  if (
    typeof created.id !== "number" ||
    !Number.isInteger(created.id) ||
    created.id < 1
  ) {
    return;
  }

  redirect("/print-requests/" + created.id);
}
`;

const printListStarter = `import { printFetch } from "../../lib/print-api";
import { createPrintRequest } from "./actions";

type PrintRequest = {
  id: number;
  title: string;
  pages: number;
  status: "pending" | "printed";
  printer: { name: string };
};

export default async function PrintRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  await searchParams;
  // TODO: lee status de searchParams y arma el path con printRequestsPath(status).
  const response = await printFetch("/api/print-requests");
  const requests: PrintRequest[] = response.ok ? await response.json() : [];

  return (
    <main>
      <h1>Solicitudes de impresión</h1>
      <nav>
        <a href="/print-requests">Todas</a>
        <a href="/print-requests?status=pending">Pendientes</a>
      </nav>

      <form action={createPrintRequest}>
        <input name="title" placeholder="Título" required />
        <input name="pages" type="number" min={1} required />
        <input name="printerId" type="number" min={1} required />
        <button type="submit">Solicitar</button>
      </form>

      <ul>
        {requests.map((request) => (
          <li key={request.id}>
            <a href={"/print-requests/" + request.id}>{request.title}</a>
          </li>
        ))}
      </ul>
    </main>
  );
}
`;

const printListSolution = `import { printFetch } from "../../lib/print-api";
import { printRequestsPath } from "../../lib/print-query";
import { createPrintRequest } from "./actions";

type PrintRequest = {
  id: number;
  title: string;
  pages: number;
  status: "pending" | "printed";
  printer: { name: string };
};

export default async function PrintRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  const { status } = await searchParams;
  const response = await printFetch(printRequestsPath(status));
  const requests: PrintRequest[] = response.ok ? await response.json() : [];

  return (
    <main>
      <h1>Solicitudes de impresión</h1>
      <nav>
        <a href="/print-requests">Todas</a>
        <a href="/print-requests?status=pending">Pendientes</a>
      </nav>

      <form action={createPrintRequest}>
        <input name="title" placeholder="Título" required />
        <input name="pages" type="number" min={1} required />
        <input name="printerId" type="number" min={1} required />
        <button type="submit">Solicitar</button>
      </form>

      <ul>
        {requests.map((request) => (
          <li key={request.id}>
            <a href={"/print-requests/" + request.id}>{request.title}</a>
          </li>
        ))}
      </ul>
    </main>
  );
}
`;

const printDetailStarter = `type PrintRequest = {
  id: number;
  title: string;
  pages: number;
  status: "pending" | "printed";
  printer: { name: string };
};

export default async function PrintRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // TODO: usa printFetch("/api/print-requests/" + id) (de ../../../lib/print-api)
  //       y muestra id, título, páginas, printer.name y estado.
  const request: PrintRequest | null = null;

  return (
    <main>
      <h1>Comprobante pendiente de completar ({id})</h1>
      {request ? <p>TODO</p> : null}
    </main>
  );
}
`;

const printDetailSolution = `import { notFound } from "next/navigation";
import { printFetch } from "../../../lib/print-api";

type PrintRequest = {
  id: number;
  title: string;
  pages: number;
  status: "pending" | "printed";
  printer: { name: string };
};

export default async function PrintRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const response = await printFetch("/api/print-requests/" + id);
  if (!response.ok) {
    notFound();
  }
  const request: PrintRequest = await response.json();

  return (
    <main>
      <h1>Comprobante de impresión</h1>
      <dl>
        <dt>Id</dt>
        <dd>{request.id}</dd>
        <dt>Título</dt>
        <dd>{request.title}</dd>
        <dt>Páginas</dt>
        <dd>{request.pages}</dd>
        <dt>Impresora</dt>
        <dd>{request.printer.name}</dd>
        <dt>Estado</dt>
        <dd>{request.status}</dd>
      </dl>
      <a href="/print-requests">Volver</a>
    </main>
  );
}
`;

const printQuerySpec = `import { printRequestsPath } from "./print-query";

describe("printRequestsPath", () => {
  it("sin status devuelve el listado completo", () => {
    expect(printRequestsPath(undefined)).toBe("/api/print-requests");
  });

  it("un status distinto de pending no filtra", () => {
    expect(printRequestsPath("printed")).toBe("/api/print-requests");
  });

  it("un arreglo no se trata como pending", () => {
    expect(printRequestsPath(["pending"])).toBe("/api/print-requests");
  });

  it("pending agrega ?status=pending", () => {
    expect(printRequestsPath("pending")).toBe(
      "/api/print-requests?status=pending",
    );
  });
});
`;

const printApiSpec = `import { RedirectError, __resetSession, __seedCookie } from "../shims/session";
import { printFetch, requirePrintToken } from "./print-api";

async function caught(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
    return null;
  } catch (error) {
    return error;
  }
}

describe("print-api", () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    __resetSession();
    process.env.PRINT_API_URL = "http://print.test";
    fetchMock = jest.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => [],
    });
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it("requirePrintToken redirige a /login sin cookie", async () => {
    const error = await caught(requirePrintToken());
    expect(error).toBeInstanceOf(RedirectError);
    expect((error as RedirectError).path).toBe("/login");
  });

  it("requirePrintToken devuelve el valor de print_token", async () => {
    __seedCookie("print_token", "tok-1");
    await expect(requirePrintToken()).resolves.toBe("tok-1");
  });

  it("printFetch usa PRINT_API_URL, Bearer y no-store", async () => {
    __seedCookie("print_token", "tok-1");
    await printFetch("/api/print-requests");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://print.test/api/print-requests");
    expect(init.cache).toBe("no-store");
    expect(init.headers).toMatchObject({ Authorization: "Bearer tok-1" });
  });

  it("printFetch redirige a /login ante un 401", async () => {
    __seedCookie("print_token", "tok-1");
    fetchMock.mockResolvedValue({ status: 401, ok: false, json: async () => ({}) });

    const error = await caught(printFetch("/api/print-requests"));
    expect(error).toBeInstanceOf(RedirectError);
    expect((error as RedirectError).path).toBe("/login");
  });
});
`;

const printActionsSpec = `import { RedirectError, __resetSession, __seedCookie } from "../../shims/session";
import { createPrintRequest } from "./actions";

async function caught(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
    return null;
  } catch (error) {
    return error;
  }
}

function form(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) {
    data.append(key, value);
  }
  return data;
}

describe("createPrintRequest", () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    __resetSession();
    process.env.PRINT_API_URL = "http://print.test";
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it("201 con id real redirige al comprobante", async () => {
    __seedCookie("print_token", "tok-1");
    fetchMock.mockResolvedValue({
      status: 201,
      ok: true,
      json: async () => ({ id: 9, title: "T", pages: 1, printer: { name: "A" } }),
    });

    const error = await caught(
      createPrintRequest(form({ title: "T", pages: "1", printerId: "2" })),
    );
    expect(error).toBeInstanceOf(RedirectError);
    expect((error as RedirectError).path).toBe("/print-requests/9");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://print.test/api/print-requests");
    expect(init.method).toBe("POST");
    const body = JSON.parse(String(init.body));
    expect(body).toEqual({ title: "T", pages: 1, printerId: 2 });
    expect(typeof body.pages).toBe("number");
    expect(typeof body.printerId).toBe("number");
    expect(body).not.toHaveProperty("status");
    expect(body).not.toHaveProperty("id");
  });

  it("409 no redirige", async () => {
    __seedCookie("print_token", "tok-1");
    fetchMock.mockResolvedValue({
      status: 409,
      ok: false,
      json: async () => ({ message: "Conflict" }),
    });

    try {
      await createPrintRequest(form({ title: "T", pages: "1", printerId: "2" }));
    } catch (error) {
      if (error instanceof RedirectError) {
        throw new Error("No debía redirigir, pero fue a " + error.path);
      }
      throw error;
    }
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("201 sin id numérico no redirige", async () => {
    __seedCookie("print_token", "tok-1");
    fetchMock.mockResolvedValue({
      status: 201,
      ok: true,
      json: async () => ({ id: "9" }),
    });

    const error = await caught(
      createPrintRequest(form({ title: "T", pages: "1", printerId: "2" })),
    );
    expect(error).toBeNull();
  });

  it("sin cookie redirige a /login y no llama a la API", async () => {
    const error = await caught(
      createPrintRequest(form({ title: "T", pages: "1", printerId: "2" })),
    );
    expect(error).toBeInstanceOf(RedirectError);
    expect((error as RedirectError).path).toBe("/login");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
`;

const printPagesSpec = `import { renderToStaticMarkup } from "react-dom/server";
import { RedirectError, __resetSession, __seedCookie } from "../../shims/session";
import PrintRequestDetailPage from "./[id]/page";
import PrintRequestsPage from "./page";

async function caught(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
    return null;
  } catch (error) {
    return error;
  }
}

describe("páginas de solicitudes de impresión", () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    __resetSession();
    process.env.PRINT_API_URL = "http://print.test";
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it("el listado con status pending pide el path filtrado", async () => {
    __seedCookie("print_token", "tok-1");
    fetchMock.mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => [
        { id: 1, title: "Apuntes", pages: 2, status: "pending", printer: { name: "HP" } },
      ],
    });

    const element = await PrintRequestsPage({
      searchParams: Promise.resolve({ status: "pending" }),
    });
    const html = renderToStaticMarkup(element);

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url.endsWith("/api/print-requests?status=pending")).toBe(true);
    expect(html).toContain("Apuntes");
    expect(html).toContain('href="/print-requests"');
    expect(html).toContain('href="/print-requests?status=pending"');
  });

  it("el listado sin status no filtra", async () => {
    __seedCookie("print_token", "tok-1");
    fetchMock.mockResolvedValue({ status: 200, ok: true, json: async () => [] });

    await PrintRequestsPage({ searchParams: Promise.resolve({}) });

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url.endsWith("/api/print-requests")).toBe(true);
  });

  it("el comprobante muestra los datos del id real", async () => {
    __seedCookie("print_token", "tok-1");
    fetchMock.mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({
        id: 9,
        title: "Guía",
        pages: 3,
        status: "pending",
        printer: { name: "HP" },
      }),
    });

    const element = await PrintRequestDetailPage({
      params: Promise.resolve({ id: "9" }),
    });
    const html = renderToStaticMarkup(element);

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url.endsWith("/api/print-requests/9")).toBe(true);
    expect(html).toContain("Guía");
    expect(html).toContain("HP");
    expect(html).toContain("9");
    expect(html).toContain("pending");
  });

  it("el comprobante sin cookie redirige a /login", async () => {
    const error = await caught(
      PrintRequestDetailPage({ params: Promise.resolve({ id: "9" }) }),
    );
    expect(error).toBeInstanceOf(RedirectError);
    expect((error as RedirectError).path).toBe("/login");
  });
});
`;

const printerEntity = `import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("printers")
export class PrinterEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ type: "varchar" })
  status!: "available" | "out_of_service";
}
`;

const printRequestEntity = `import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { PrinterEntity } from "./printer.entity";

@Entity("print_requests")
export class PrintRequestEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column({ type: "int" })
  pages!: number;

  @Column({ type: "varchar", default: "pending" })
  status!: "pending" | "printed";

  @ManyToOne(() => PrinterEntity, { nullable: false })
  @JoinColumn({ name: "printer_id" })
  printer!: PrinterEntity;
}
`;

const printDtoStarter = `// TODO: importa IsIn e IsOptional desde class-validator.
export class FilterPrintRequestsQueryDto {
  // TODO: status es opcional y solo acepta "pending" o "printed".
  status?: "pending" | "printed";
}
`;

const printDtoSolution = `import { IsIn, IsOptional } from "class-validator";

export class FilterPrintRequestsQueryDto {
  @IsOptional()
  @IsIn(["pending", "printed"])
  status?: "pending" | "printed";
}
`;

const printServiceStarter = `import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PrintRequestEntity } from "./entities/print-request.entity";
import { PrinterEntity } from "./entities/printer.entity";
import { FilterPrintRequestsQueryDto } from "./filter-print-requests-query.dto";

@Injectable()
export class PrintRequestsService {
  constructor(
    @InjectRepository(PrintRequestEntity)
    private readonly requests: Repository<PrintRequestEntity>,
    @InjectRepository(PrinterEntity)
    private readonly printers: Repository<PrinterEntity>,
  ) {}

  async findAll(query: FilterPrintRequestsQueryDto): Promise<PrintRequestEntity[]> {
    // TODO: el filtro va en repository.find (where), con relations printer
    // y order id ASC. No filtres un arreglo en memoria.
    const all = await this.requests.find();
    return query.status ? all.filter((r) => r.status === query.status) : all;
  }

  async create(dto: {
    title: string;
    pages: number;
    printerId: number;
  }): Promise<PrintRequestEntity> {
    const printer = await this.printers.findOne({ where: { id: dto.printerId } });
    // TODO 1: si no existe la impresora, NotFoundException.
    // TODO 2: si printer.status es "out_of_service", ConflictException (sin save).
    // TODO 3: guarda la solicitud con status "pending".
    return this.requests.save(
      this.requests.create({
        title: dto.title,
        pages: dto.pages,
        printer: printer ?? undefined,
      }),
    );
  }
}
`;

const printServiceSolution = `import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PrintRequestEntity } from "./entities/print-request.entity";
import { PrinterEntity } from "./entities/printer.entity";
import { FilterPrintRequestsQueryDto } from "./filter-print-requests-query.dto";

@Injectable()
export class PrintRequestsService {
  constructor(
    @InjectRepository(PrintRequestEntity)
    private readonly requests: Repository<PrintRequestEntity>,
    @InjectRepository(PrinterEntity)
    private readonly printers: Repository<PrinterEntity>,
  ) {}

  async findAll(query: FilterPrintRequestsQueryDto): Promise<PrintRequestEntity[]> {
    return this.requests.find({
      where: query.status ? { status: query.status } : {},
      relations: { printer: true },
      order: { id: "ASC" },
    });
  }

  async create(dto: {
    title: string;
    pages: number;
    printerId: number;
  }): Promise<PrintRequestEntity> {
    const printer = await this.printers.findOne({ where: { id: dto.printerId } });
    if (!printer) {
      throw new NotFoundException();
    }
    if (printer.status === "out_of_service") {
      throw new ConflictException();
    }
    return this.requests.save(
      this.requests.create({
        title: dto.title,
        pages: dto.pages,
        status: "pending",
        printer,
      }),
    );
  }
}
`;

const printDtoSpec = `import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { FilterPrintRequestsQueryDto } from "./filter-print-requests-query.dto";

async function errorsFor(plain: object) {
  return validate(plainToInstance(FilterPrintRequestsQueryDto, plain));
}

describe("FilterPrintRequestsQueryDto", () => {
  it("sin status es válido", async () => {
    expect(await errorsFor({})).toHaveLength(0);
  });

  it("status pending es válido", async () => {
    expect(await errorsFor({ status: "pending" })).toHaveLength(0);
  });

  it("status printed es válido", async () => {
    expect(await errorsFor({ status: "printed" })).toHaveLength(0);
  });

  it("otro status es inválido", async () => {
    const errors = await errorsFor({ status: "otro" });
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe("status");
  });
});
`;

const printServiceSpec = `import { ConflictException, NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { PrintRequestEntity } from "./entities/print-request.entity";
import { PrinterEntity } from "./entities/printer.entity";
import { PrintRequestsService } from "./print-requests.service";

describe("PrintRequestsService", () => {
  let service: PrintRequestsService;

  const requestsRepository = {
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const printersRepository = { findOne: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        PrintRequestsService,
        {
          provide: getRepositoryToken(PrintRequestEntity),
          useValue: requestsRepository,
        },
        {
          provide: getRepositoryToken(PrinterEntity),
          useValue: printersRepository,
        },
      ],
    }).compile();

    service = moduleRef.get(PrintRequestsService);
  });

  describe("findAll", () => {
    it("filtra pending en repository.find con printer y orden id ASC", async () => {
      const rows = [{ id: 1, status: "pending" }];
      requestsRepository.find.mockResolvedValue(rows);

      const result = await service.findAll({ status: "pending" });

      expect(requestsRepository.find).toHaveBeenCalledWith({
        where: { status: "pending" },
        relations: { printer: true },
        order: { id: "ASC" },
      });
      expect(result).toBe(rows);
    });

    it("sin status usa where vacío y no filtra en memoria", async () => {
      const rows = [
        { id: 1, status: "pending" },
        { id: 2, status: "printed" },
      ];
      requestsRepository.find.mockResolvedValue(rows);

      const result = await service.findAll({});

      expect(requestsRepository.find).toHaveBeenCalledWith({
        where: {},
        relations: { printer: true },
        order: { id: "ASC" },
      });
      expect(result).toEqual(rows);
    });
  });

  describe("create", () => {
    const dto = { title: "Guía", pages: 3, printerId: 2 };

    it("impresora fuera de servicio: ConflictException y sin save", async () => {
      printersRepository.findOne.mockResolvedValue({
        id: 2,
        name: "HP",
        status: "out_of_service",
      });

      await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
      expect(printersRepository.findOne).toHaveBeenCalledWith({ where: { id: 2 } });
      expect(requestsRepository.save).not.toHaveBeenCalled();
    });

    it("impresora inexistente: NotFoundException y sin save", async () => {
      printersRepository.findOne.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toBeInstanceOf(NotFoundException);
      expect(requestsRepository.save).not.toHaveBeenCalled();
    });

    it("impresora disponible: guarda la solicitud como pending", async () => {
      const printer = { id: 2, name: "HP", status: "available" };
      printersRepository.findOne.mockResolvedValue(printer);
      requestsRepository.create.mockImplementation((data) => data);
      requestsRepository.save.mockImplementation(async (data) => ({ ...data, id: 7 }));

      const result = await service.create(dto);

      expect(requestsRepository.create).toHaveBeenCalledWith({
        title: "Guía",
        pages: 3,
        status: "pending",
        printer,
      });
      expect(requestsRepository.save).toHaveBeenCalledTimes(1);
      expect(requestsRepository.save.mock.calls[0][0].status).toBe("pending");
      expect(result).toMatchObject({ id: 7, status: "pending", printer });
    });
  });
});
`;

/* -------------------------------------------------------------------------- */
/*                   TOPIC B · Práctica: reservas de sala                      */
/* -------------------------------------------------------------------------- */

const labApiStarter = `import "server-only";
import { cookies } from "next/headers";

// La cookie de sesión se llama lab_token.
export async function requireLabToken(): Promise<string> {
  const store = await cookies();
  // TODO: si la cookie no existe, redirige a /login con redirect() de next/navigation.
  return store.get("lab_token")?.value ?? "";
}

export async function labFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  // TODO 1: obtén el token con requireLabToken().
  // TODO 2: llama a process.env.LAB_API_URL + path con cache "no-store"
  //         y el header Authorization: "Bearer <token>".
  // TODO 3: si la respuesta es 401, redirige a /login.
  return fetch(path, init);
}
`;

const labApiSolution = `import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function requireLabToken(): Promise<string> {
  const store = await cookies();
  const token = store.get("lab_token")?.value;
  if (!token) {
    redirect("/login");
  }
  return token;
}

export async function labFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = await requireLabToken();
  const response = await fetch(process.env.LAB_API_URL + path, {
    ...init,
    headers: {
      ...(init.headers as Record<string, string> | undefined),
      Authorization: "Bearer " + token,
    },
    cache: "no-store",
  });

  if (response.status === 401) {
    redirect("/login");
  }
  return response;
}
`;

const roomQueryStarter = `export function roomBookingsPath(
  status: string | string[] | undefined,
): string {
  if (status === undefined) {
    return "/api/room-bookings";
  }
  // TODO: solo el string "pending" agrega ?status=pending.
  return "/api/room-bookings";
}
`;

const roomQuerySolution = `export function roomBookingsPath(
  status: string | string[] | undefined,
): string {
  if (status === "pending") {
    return "/api/room-bookings?status=pending";
  }
  return "/api/room-bookings";
}
`;

const roomActionsStarter = `import { labFetch } from "../../lib/lab-api";

export async function createRoomBooking(formData: FormData) {
  "use server";
  const purpose = String(formData.get("purpose") ?? "");

  // TODO 1: lee hours y roomId con Number(...).
  // TODO 2: POST JSON a /api/room-bookings con { purpose, hours, roomId }
  //         (sin id ni status) usando labFetch.
  // TODO 3: si el status HTTP no es 201, return (sin redirect).
  // TODO 4: si el json trae un id entero >= 1, redirect("/room-bookings/" + id).
  void labFetch;
  throw new Error("TODO: crear la reserva " + purpose);
}
`;

const roomActionsSolution = `import { redirect } from "next/navigation";
import { labFetch } from "../../lib/lab-api";

export async function createRoomBooking(formData: FormData) {
  "use server";
  const purpose = String(formData.get("purpose") ?? "");
  const hours = Number(formData.get("hours"));
  const roomId = Number(formData.get("roomId"));

  const response = await labFetch("/api/room-bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ purpose, hours, roomId }),
  });

  if (response.status !== 201) {
    return;
  }

  const created: { id?: unknown } = await response.json();
  if (
    typeof created.id !== "number" ||
    !Number.isInteger(created.id) ||
    created.id < 1
  ) {
    return;
  }

  redirect("/room-bookings/" + created.id);
}
`;

const roomListStarter = `import { labFetch } from "../../lib/lab-api";
import { createRoomBooking } from "./actions";

type RoomBooking = {
  id: number;
  purpose: string;
  hours: number;
  status: "pending" | "confirmed";
  room: { name: string };
};

export default async function RoomBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  await searchParams;
  // TODO: lee status de searchParams y arma el path con roomBookingsPath(status).
  const response = await labFetch("/api/room-bookings");
  const bookings: RoomBooking[] = response.ok ? await response.json() : [];

  return (
    <main>
      <h1>Reservas de sala</h1>
      <nav>
        <a href="/room-bookings">Todas</a>
        <a href="/room-bookings?status=pending">Pendientes</a>
      </nav>

      <form action={createRoomBooking}>
        <input name="purpose" placeholder="Motivo" required />
        <input name="hours" type="number" min={1} required />
        <input name="roomId" type="number" min={1} required />
        <button type="submit">Reservar</button>
      </form>

      <ul>
        {bookings.map((booking) => (
          <li key={booking.id}>
            <a href={"/room-bookings/" + booking.id}>{booking.purpose}</a>
          </li>
        ))}
      </ul>
    </main>
  );
}
`;

const roomListSolution = `import { labFetch } from "../../lib/lab-api";
import { roomBookingsPath } from "../../lib/room-query";
import { createRoomBooking } from "./actions";

type RoomBooking = {
  id: number;
  purpose: string;
  hours: number;
  status: "pending" | "confirmed";
  room: { name: string };
};

export default async function RoomBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  const { status } = await searchParams;
  const response = await labFetch(roomBookingsPath(status));
  const bookings: RoomBooking[] = response.ok ? await response.json() : [];

  return (
    <main>
      <h1>Reservas de sala</h1>
      <nav>
        <a href="/room-bookings">Todas</a>
        <a href="/room-bookings?status=pending">Pendientes</a>
      </nav>

      <form action={createRoomBooking}>
        <input name="purpose" placeholder="Motivo" required />
        <input name="hours" type="number" min={1} required />
        <input name="roomId" type="number" min={1} required />
        <button type="submit">Reservar</button>
      </form>

      <ul>
        {bookings.map((booking) => (
          <li key={booking.id}>
            <a href={"/room-bookings/" + booking.id}>{booking.purpose}</a>
          </li>
        ))}
      </ul>
    </main>
  );
}
`;

const roomDetailStarter = `type RoomBooking = {
  id: number;
  purpose: string;
  hours: number;
  status: "pending" | "confirmed";
  room: { name: string };
};

export default async function RoomBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // TODO: usa labFetch("/api/room-bookings/" + id) (de ../../../lib/lab-api)
  //       y muestra id, motivo, horas, room.name y estado.
  const booking: RoomBooking | null = null;

  return (
    <main>
      <h1>Comprobante pendiente de completar ({id})</h1>
      {booking ? <p>TODO</p> : null}
    </main>
  );
}
`;

const roomDetailSolution = `import { notFound } from "next/navigation";
import { labFetch } from "../../../lib/lab-api";

type RoomBooking = {
  id: number;
  purpose: string;
  hours: number;
  status: "pending" | "confirmed";
  room: { name: string };
};

export default async function RoomBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const response = await labFetch("/api/room-bookings/" + id);
  if (!response.ok) {
    notFound();
  }
  const booking: RoomBooking = await response.json();

  return (
    <main>
      <h1>Comprobante de reserva</h1>
      <dl>
        <dt>Id</dt>
        <dd>{booking.id}</dd>
        <dt>Motivo</dt>
        <dd>{booking.purpose}</dd>
        <dt>Horas</dt>
        <dd>{booking.hours}</dd>
        <dt>Sala</dt>
        <dd>{booking.room.name}</dd>
        <dt>Estado</dt>
        <dd>{booking.status}</dd>
      </dl>
      <a href="/room-bookings">Volver</a>
    </main>
  );
}
`;

const roomQuerySpec = `import { roomBookingsPath } from "./room-query";

describe("roomBookingsPath", () => {
  it("sin status devuelve el listado completo", () => {
    expect(roomBookingsPath(undefined)).toBe("/api/room-bookings");
  });

  it("un status distinto de pending no filtra", () => {
    expect(roomBookingsPath("confirmed")).toBe("/api/room-bookings");
  });

  it("un arreglo no se trata como pending", () => {
    expect(roomBookingsPath(["pending"])).toBe("/api/room-bookings");
  });

  it("pending agrega ?status=pending", () => {
    expect(roomBookingsPath("pending")).toBe("/api/room-bookings?status=pending");
  });
});
`;

const labApiSpec = `import { RedirectError, __resetSession, __seedCookie } from "../shims/session";
import { labFetch, requireLabToken } from "./lab-api";

async function caught(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
    return null;
  } catch (error) {
    return error;
  }
}

describe("lab-api", () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    __resetSession();
    process.env.LAB_API_URL = "http://lab.test";
    fetchMock = jest.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => [],
    });
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it("requireLabToken redirige a /login sin cookie", async () => {
    const error = await caught(requireLabToken());
    expect(error).toBeInstanceOf(RedirectError);
    expect((error as RedirectError).path).toBe("/login");
  });

  it("requireLabToken devuelve el valor de lab_token", async () => {
    __seedCookie("lab_token", "lab-1");
    await expect(requireLabToken()).resolves.toBe("lab-1");
  });

  it("labFetch usa LAB_API_URL, Bearer y no-store", async () => {
    __seedCookie("lab_token", "lab-1");
    await labFetch("/api/room-bookings");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://lab.test/api/room-bookings");
    expect(init.cache).toBe("no-store");
    expect(init.headers).toMatchObject({ Authorization: "Bearer lab-1" });
  });

  it("labFetch redirige a /login ante un 401", async () => {
    __seedCookie("lab_token", "lab-1");
    fetchMock.mockResolvedValue({ status: 401, ok: false, json: async () => ({}) });

    const error = await caught(labFetch("/api/room-bookings"));
    expect(error).toBeInstanceOf(RedirectError);
    expect((error as RedirectError).path).toBe("/login");
  });
});
`;

const roomActionsSpec = `import { RedirectError, __resetSession, __seedCookie } from "../../shims/session";
import { createRoomBooking } from "./actions";

async function caught(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
    return null;
  } catch (error) {
    return error;
  }
}

function form(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) {
    data.append(key, value);
  }
  return data;
}

describe("createRoomBooking", () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    __resetSession();
    process.env.LAB_API_URL = "http://lab.test";
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it("201 con id real redirige al comprobante", async () => {
    __seedCookie("lab_token", "lab-1");
    fetchMock.mockResolvedValue({
      status: 201,
      ok: true,
      json: async () => ({ id: 15, purpose: "Parcial", hours: 2, room: { name: "Sala B" } }),
    });

    const error = await caught(
      createRoomBooking(form({ purpose: "Parcial", hours: "2", roomId: "4" })),
    );
    expect(error).toBeInstanceOf(RedirectError);
    expect((error as RedirectError).path).toBe("/room-bookings/15");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("http://lab.test/api/room-bookings");
    expect(init.method).toBe("POST");
    const body = JSON.parse(String(init.body));
    expect(body).toEqual({ purpose: "Parcial", hours: 2, roomId: 4 });
    expect(typeof body.hours).toBe("number");
    expect(typeof body.roomId).toBe("number");
    expect(body).not.toHaveProperty("status");
    expect(body).not.toHaveProperty("id");
  });

  it("409 no redirige", async () => {
    __seedCookie("lab_token", "lab-1");
    fetchMock.mockResolvedValue({
      status: 409,
      ok: false,
      json: async () => ({ message: "Conflict" }),
    });

    try {
      await createRoomBooking(form({ purpose: "Parcial", hours: "2", roomId: "4" }));
    } catch (error) {
      if (error instanceof RedirectError) {
        throw new Error("No debía redirigir, pero fue a " + error.path);
      }
      throw error;
    }
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("201 sin id numérico no redirige", async () => {
    __seedCookie("lab_token", "lab-1");
    fetchMock.mockResolvedValue({
      status: 201,
      ok: true,
      json: async () => ({ id: 0 }),
    });

    const error = await caught(
      createRoomBooking(form({ purpose: "Parcial", hours: "2", roomId: "4" })),
    );
    expect(error).toBeNull();
  });

  it("sin cookie redirige a /login y no llama a la API", async () => {
    const error = await caught(
      createRoomBooking(form({ purpose: "Parcial", hours: "2", roomId: "4" })),
    );
    expect(error).toBeInstanceOf(RedirectError);
    expect((error as RedirectError).path).toBe("/login");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
`;

const roomPagesSpec = `import { renderToStaticMarkup } from "react-dom/server";
import { RedirectError, __resetSession, __seedCookie } from "../../shims/session";
import RoomBookingDetailPage from "./[id]/page";
import RoomBookingsPage from "./page";

async function caught(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
    return null;
  } catch (error) {
    return error;
  }
}

describe("páginas de reservas de sala", () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    __resetSession();
    process.env.LAB_API_URL = "http://lab.test";
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it("el listado con status pending pide el path filtrado", async () => {
    __seedCookie("lab_token", "lab-1");
    fetchMock.mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => [
        { id: 3, purpose: "Tutoría", hours: 1, status: "pending", room: { name: "Sala A" } },
      ],
    });

    const element = await RoomBookingsPage({
      searchParams: Promise.resolve({ status: "pending" }),
    });
    const html = renderToStaticMarkup(element);

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url.endsWith("/api/room-bookings?status=pending")).toBe(true);
    expect(html).toContain("Tutoría");
    expect(html).toContain('href="/room-bookings"');
    expect(html).toContain('href="/room-bookings?status=pending"');
  });

  it("el listado sin status no filtra", async () => {
    __seedCookie("lab_token", "lab-1");
    fetchMock.mockResolvedValue({ status: 200, ok: true, json: async () => [] });

    await RoomBookingsPage({ searchParams: Promise.resolve({}) });

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url.endsWith("/api/room-bookings")).toBe(true);
  });

  it("el comprobante muestra los datos del id real", async () => {
    __seedCookie("lab_token", "lab-1");
    fetchMock.mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({
        id: 15,
        purpose: "Parcial",
        hours: 2,
        status: "pending",
        room: { name: "Sala B" },
      }),
    });

    const element = await RoomBookingDetailPage({
      params: Promise.resolve({ id: "15" }),
    });
    const html = renderToStaticMarkup(element);

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url.endsWith("/api/room-bookings/15")).toBe(true);
    expect(html).toContain("Parcial");
    expect(html).toContain("Sala B");
    expect(html).toContain("15");
    expect(html).toContain("pending");
  });

  it("el comprobante sin cookie redirige a /login", async () => {
    const error = await caught(
      RoomBookingDetailPage({ params: Promise.resolve({ id: "15" }) }),
    );
    expect(error).toBeInstanceOf(RedirectError);
    expect((error as RedirectError).path).toBe("/login");
  });
});
`;

const roomEntity = `import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("rooms")
export class RoomEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ type: "varchar" })
  status!: "open" | "closed";
}
`;

const roomBookingEntity = `import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { RoomEntity } from "./room.entity";

@Entity("room_bookings")
export class RoomBookingEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  purpose!: string;

  @Column({ type: "int" })
  hours!: number;

  @Column({ type: "varchar", default: "pending" })
  status!: "pending" | "confirmed";

  @ManyToOne(() => RoomEntity, { nullable: false })
  @JoinColumn({ name: "room_id" })
  room!: RoomEntity;
}
`;

const roomDtoStarter = `// TODO: importa IsIn e IsOptional desde class-validator.
export class FilterRoomBookingsQueryDto {
  // TODO: status es opcional y solo acepta "pending" o "confirmed".
  status?: "pending" | "confirmed";
}
`;

const roomDtoSolution = `import { IsIn, IsOptional } from "class-validator";

export class FilterRoomBookingsQueryDto {
  @IsOptional()
  @IsIn(["pending", "confirmed"])
  status?: "pending" | "confirmed";
}
`;

const roomServiceStarter = `import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { RoomBookingEntity } from "./entities/room-booking.entity";
import { RoomEntity } from "./entities/room.entity";
import { FilterRoomBookingsQueryDto } from "./filter-room-bookings-query.dto";

@Injectable()
export class RoomBookingsService {
  constructor(
    @InjectRepository(RoomBookingEntity)
    private readonly bookings: Repository<RoomBookingEntity>,
    @InjectRepository(RoomEntity)
    private readonly rooms: Repository<RoomEntity>,
  ) {}

  async findAll(query: FilterRoomBookingsQueryDto): Promise<RoomBookingEntity[]> {
    // TODO: el filtro va en repository.find (where), con relations room
    // y order id ASC. No filtres un arreglo en memoria.
    const all = await this.bookings.find();
    return query.status ? all.filter((b) => b.status === query.status) : all;
  }

  async create(dto: {
    purpose: string;
    hours: number;
    roomId: number;
  }): Promise<RoomBookingEntity> {
    const room = await this.rooms.findOne({ where: { id: dto.roomId } });
    // TODO 1: si no existe la sala, NotFoundException.
    // TODO 2: si room.status es "closed", ConflictException (sin save).
    // TODO 3: guarda la reserva con status "pending".
    return this.bookings.save(
      this.bookings.create({
        purpose: dto.purpose,
        hours: dto.hours,
        room: room ?? undefined,
      }),
    );
  }
}
`;

const roomServiceSolution = `import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { RoomBookingEntity } from "./entities/room-booking.entity";
import { RoomEntity } from "./entities/room.entity";
import { FilterRoomBookingsQueryDto } from "./filter-room-bookings-query.dto";

@Injectable()
export class RoomBookingsService {
  constructor(
    @InjectRepository(RoomBookingEntity)
    private readonly bookings: Repository<RoomBookingEntity>,
    @InjectRepository(RoomEntity)
    private readonly rooms: Repository<RoomEntity>,
  ) {}

  async findAll(query: FilterRoomBookingsQueryDto): Promise<RoomBookingEntity[]> {
    return this.bookings.find({
      where: query.status ? { status: query.status } : {},
      relations: { room: true },
      order: { id: "ASC" },
    });
  }

  async create(dto: {
    purpose: string;
    hours: number;
    roomId: number;
  }): Promise<RoomBookingEntity> {
    const room = await this.rooms.findOne({ where: { id: dto.roomId } });
    if (!room) {
      throw new NotFoundException();
    }
    if (room.status === "closed") {
      throw new ConflictException();
    }
    return this.bookings.save(
      this.bookings.create({
        purpose: dto.purpose,
        hours: dto.hours,
        status: "pending",
        room,
      }),
    );
  }
}
`;

const roomDtoSpec = `import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { FilterRoomBookingsQueryDto } from "./filter-room-bookings-query.dto";

async function errorsFor(plain: object) {
  return validate(plainToInstance(FilterRoomBookingsQueryDto, plain));
}

describe("FilterRoomBookingsQueryDto", () => {
  it("sin status es válido", async () => {
    expect(await errorsFor({})).toHaveLength(0);
  });

  it("status pending es válido", async () => {
    expect(await errorsFor({ status: "pending" })).toHaveLength(0);
  });

  it("status confirmed es válido", async () => {
    expect(await errorsFor({ status: "confirmed" })).toHaveLength(0);
  });

  it("otro status es inválido", async () => {
    const errors = await errorsFor({ status: "otro" });
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe("status");
  });
});
`;

const roomServiceSpec = `import { ConflictException, NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { RoomBookingEntity } from "./entities/room-booking.entity";
import { RoomEntity } from "./entities/room.entity";
import { RoomBookingsService } from "./room-bookings.service";

describe("RoomBookingsService", () => {
  let service: RoomBookingsService;

  const bookingsRepository = {
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const roomsRepository = { findOne: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        RoomBookingsService,
        {
          provide: getRepositoryToken(RoomBookingEntity),
          useValue: bookingsRepository,
        },
        {
          provide: getRepositoryToken(RoomEntity),
          useValue: roomsRepository,
        },
      ],
    }).compile();

    service = moduleRef.get(RoomBookingsService);
  });

  describe("findAll", () => {
    it("filtra pending en repository.find con room y orden id ASC", async () => {
      const rows = [{ id: 1, status: "pending" }];
      bookingsRepository.find.mockResolvedValue(rows);

      const result = await service.findAll({ status: "pending" });

      expect(bookingsRepository.find).toHaveBeenCalledWith({
        where: { status: "pending" },
        relations: { room: true },
        order: { id: "ASC" },
      });
      expect(result).toBe(rows);
    });

    it("sin status usa where vacío y no filtra en memoria", async () => {
      const rows = [
        { id: 1, status: "pending" },
        { id: 2, status: "confirmed" },
      ];
      bookingsRepository.find.mockResolvedValue(rows);

      const result = await service.findAll({});

      expect(bookingsRepository.find).toHaveBeenCalledWith({
        where: {},
        relations: { room: true },
        order: { id: "ASC" },
      });
      expect(result).toEqual(rows);
    });
  });

  describe("create", () => {
    const dto = { purpose: "Parcial", hours: 2, roomId: 4 };

    it("sala cerrada: ConflictException y sin save", async () => {
      roomsRepository.findOne.mockResolvedValue({
        id: 4,
        name: "Sala B",
        status: "closed",
      });

      await expect(service.create(dto)).rejects.toBeInstanceOf(ConflictException);
      expect(roomsRepository.findOne).toHaveBeenCalledWith({ where: { id: 4 } });
      expect(bookingsRepository.save).not.toHaveBeenCalled();
    });

    it("sala inexistente: NotFoundException y sin save", async () => {
      roomsRepository.findOne.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toBeInstanceOf(NotFoundException);
      expect(bookingsRepository.save).not.toHaveBeenCalled();
    });

    it("sala abierta: guarda la reserva como pending", async () => {
      const room = { id: 4, name: "Sala B", status: "open" };
      roomsRepository.findOne.mockResolvedValue(room);
      bookingsRepository.create.mockImplementation((data) => data);
      bookingsRepository.save.mockImplementation(async (data) => ({ ...data, id: 15 }));

      const result = await service.create(dto);

      expect(bookingsRepository.create).toHaveBeenCalledWith({
        purpose: "Parcial",
        hours: 2,
        status: "pending",
        room,
      });
      expect(bookingsRepository.save).toHaveBeenCalledTimes(1);
      expect(bookingsRepository.save.mock.calls[0][0].status).toBe("pending");
      expect(result).toMatchObject({ id: 15, status: "pending", room });
    });
  });
});
`;

/* -------------------------------------------------------------------------- */
/*                                   Topics                                    */
/* -------------------------------------------------------------------------- */

export const capstoneTopics: Topic[] = [
  {
    id: "next-impresion",
    order: 5,
    title: "Preparcial: solicitudes de impresión",
    tagline: "Next.js pide, NestJS filtra y rechaza impresoras fuera de servicio",
    description:
      "Completa el helper de sesión, el listado filtrado, el alta con el id real y, en NestJS, el filtro status del repositorio y el 409 si la impresora no está disponible.",
    exercises: [
      {
        id: "print-frontend",
        topicId: "next-impresion",
        order: 1,
        title: "Listado, alta y comprobante",
        difficulty: "medium",
        minutes: 40,
        summary:
          "La cookie se llama print_token. requirePrintToken redirige a /login si falta. printFetch envía Authorization Bearer a PRINT_API_URL + path con cache no-store y, ante un 401, redirige a /login. printRequestsPath solo agrega ?status=pending cuando status es exactamente \"pending\". createPrintRequest envía { title, pages, printerId } (números con Number) por POST, sin id ni status, y solo redirige a /print-requests/<id> si la respuesta es 201 con un id entero >= 1; en cualquier otro caso hace return. El comprobante lee params como Promise y muestra id, título, páginas, impresora y estado.",
        objectives: [
          "Leer la cookie print_token con cookies() y redirigir a /login si falta.",
          "Centralizar fetch con Bearer, PRINT_API_URL, cache no-store y manejo de 401.",
          "Construir el path del listado aceptando solo status=pending.",
          "Enviar el alta como JSON con números reales y sin id ni status.",
          "Redirigir solo con 201 y un id válido; no redirigir ante un 409.",
          "Renderizar el comprobante con await params y el id real.",
        ],
        hints: [
          "redirect() lanza una excepción: no lo pongas dentro de un try/catch que la trague.",
          "searchParams.status puede ser string, string[] o undefined; compara con === \"pending\".",
          "Number(formData.get(\"pages\")) convierte el string del formulario a número.",
          "Revisa response.status === 201 antes de leer el json para redirigir.",
          "En Next 15+ params y searchParams son Promises: haz await antes de usarlos.",
        ],
        files: [
          ts("src/lib/print-api.ts", printApiStarter),
          ts("src/lib/print-query.ts", printQueryStarter),
          ts("src/app/print-requests/actions.ts", printActionsStarter),
          ts("src/app/print-requests/page.tsx", printListStarter),
          ts("src/app/print-requests/[id]/page.tsx", printDetailStarter),
        ],
        solutionFiles: [
          ts("src/lib/print-api.ts", printApiSolution),
          ts("src/lib/print-query.ts", printQuerySolution),
          ts("src/app/print-requests/actions.ts", printActionsSolution),
          ts("src/app/print-requests/page.tsx", printListSolution),
          ts("src/app/print-requests/[id]/page.tsx", printDetailSolution),
        ],
        tests: [
          ts("src/lib/print-query.spec.ts", printQuerySpec),
          ts("src/lib/print-api.spec.ts", printApiSpec),
          ts("src/app/print-requests/actions.spec.ts", printActionsSpec),
          ts("src/app/print-requests/pages.spec.ts", printPagesSpec),
        ],
      },
      {
        id: "print-backend",
        topicId: "next-impresion",
        order: 2,
        title: "Filtro status y impresora fuera de servicio",
        difficulty: "medium",
        minutes: 40,
        summary:
          "El GET acepta un status opcional pending o printed; cualquier otro valor no pasa el DTO (IsOptional + IsIn). findAll aplica el filtro en repository.find, no en un arreglo en memoria, incluye la relación printer y ordena por id ASC. create busca la impresora: si no existe lanza NotFoundException; si está out_of_service lanza ConflictException sin llamar a save; si está available guarda la solicitud como pending y la devuelve.",
        objectives: [
          "Validar el query status con IsOptional e IsIn de class-validator.",
          "Filtrar en la base con where, relations y order de repository.find.",
          "Responder 404 cuando la impresora no existe.",
          "Responder 409 cuando la impresora está fuera de servicio, sin guardar.",
          "Guardar la nueva solicitud siempre con status pending.",
        ],
        hints: [
          "where: query.status ? { status: query.status } : {} evita filtrar en memoria.",
          "relations: { printer: true } y order: { id: \"ASC\" } van en el mismo objeto de find.",
          "Lanza la excepción antes de llamar a create/save para no persistir nada.",
          "ConflictException y NotFoundException se importan desde @nestjs/common.",
        ],
        files: [
          ts("src/print-requests/entities/printer.entity.ts", printerEntity, true),
          ts(
            "src/print-requests/entities/print-request.entity.ts",
            printRequestEntity,
            true,
          ),
          ts("src/print-requests/filter-print-requests-query.dto.ts", printDtoStarter),
          ts("src/print-requests/print-requests.service.ts", printServiceStarter),
        ],
        solutionFiles: [
          ts("src/print-requests/filter-print-requests-query.dto.ts", printDtoSolution),
          ts("src/print-requests/print-requests.service.ts", printServiceSolution),
        ],
        tests: [
          ts("src/print-requests/filter-print-requests-query.dto.spec.ts", printDtoSpec),
          ts("src/print-requests/print-requests.service.spec.ts", printServiceSpec),
        ],
      },
    ],
  },
  {
    id: "next-salas",
    order: 6,
    title: "Práctica similar: reservas de sala",
    tagline: "El mismo flujo, otro recurso",
    description:
      "Variante del preparcial. Una reserva se asigna a una sala. Si la sala está cerrada, NestJS responde 409 y no guarda. El frontend reutiliza la sesión, filtra pendientes y abre el comprobante del id real.",
    exercises: [
      {
        id: "rooms-frontend",
        topicId: "next-salas",
        order: 1,
        title: "Reservas: listado, alta y comprobante",
        difficulty: "medium",
        minutes: 35,
        summary:
          "Igual que impresión, con otros nombres. La cookie se llama lab_token y la API vive en LAB_API_URL. requireLabToken y labFetch redirigen a /login sin cookie o ante un 401. roomBookingsPath solo agrega ?status=pending cuando status es \"pending\". createRoomBooking envía { purpose, hours, roomId } por POST a /api/room-bookings y redirige a /room-bookings/<id> solo con 201 y un id entero >= 1; si no, return. El comprobante muestra motivo, horas, sala y estado.",
        objectives: [
          "Reutilizar el patrón de sesión con la cookie lab_token.",
          "Llamar a LAB_API_URL con Bearer, cache no-store y manejo de 401.",
          "Filtrar el listado de reservas pendientes desde searchParams.",
          "Crear la reserva con números reales y redirigir al id devuelto.",
          "No redirigir cuando la API responde 409 por sala cerrada.",
        ],
        hints: [
          "Copia la estructura del ejercicio de impresión y cambia nombres, rutas y variables de entorno.",
          "hours y roomId llegan como string desde el formulario: usa Number(...).",
          "Un 409 no es error para la acción: simplemente haz return.",
          "El comprobante usa labFetch(\"/api/room-bookings/\" + id).",
        ],
        files: [
          ts("src/lib/lab-api.ts", labApiStarter),
          ts("src/lib/room-query.ts", roomQueryStarter),
          ts("src/app/room-bookings/actions.ts", roomActionsStarter),
          ts("src/app/room-bookings/page.tsx", roomListStarter),
          ts("src/app/room-bookings/[id]/page.tsx", roomDetailStarter),
        ],
        solutionFiles: [
          ts("src/lib/lab-api.ts", labApiSolution),
          ts("src/lib/room-query.ts", roomQuerySolution),
          ts("src/app/room-bookings/actions.ts", roomActionsSolution),
          ts("src/app/room-bookings/page.tsx", roomListSolution),
          ts("src/app/room-bookings/[id]/page.tsx", roomDetailSolution),
        ],
        tests: [
          ts("src/lib/room-query.spec.ts", roomQuerySpec),
          ts("src/lib/lab-api.spec.ts", labApiSpec),
          ts("src/app/room-bookings/actions.spec.ts", roomActionsSpec),
          ts("src/app/room-bookings/pages.spec.ts", roomPagesSpec),
        ],
      },
      {
        id: "rooms-backend",
        topicId: "next-salas",
        order: 2,
        title: "Filtro de reservas y sala cerrada",
        difficulty: "medium",
        minutes: 35,
        summary:
          "status es opcional y solo acepta pending o confirmed; otro valor falla la validación. findAll filtra en repository.find con la relación room y orden id ASC. create: si la sala no existe lanza NotFoundException; si room.status es \"closed\" lanza ConflictException y no llama a save; si está \"open\" guarda la reserva como pending.",
        objectives: [
          "Validar status con IsOptional e IsIn([\"pending\", \"confirmed\"]).",
          "Filtrar reservas en la base con where, relations room y order id ASC.",
          "Responder 404 si la sala no existe.",
          "Responder 409 si la sala está cerrada, sin guardar.",
          "Guardar la reserva con status pending cuando la sala está abierta.",
        ],
        hints: [
          "La forma del servicio es la misma que en impresión: cambia printer por room.",
          "Compara room.status === \"closed\" antes de crear la entidad.",
          "No uses .filter sobre el resultado de find: el where hace el trabajo.",
        ],
        files: [
          ts("src/room-bookings/entities/room.entity.ts", roomEntity, true),
          ts("src/room-bookings/entities/room-booking.entity.ts", roomBookingEntity, true),
          ts("src/room-bookings/filter-room-bookings-query.dto.ts", roomDtoStarter),
          ts("src/room-bookings/room-bookings.service.ts", roomServiceStarter),
        ],
        solutionFiles: [
          ts("src/room-bookings/filter-room-bookings-query.dto.ts", roomDtoSolution),
          ts("src/room-bookings/room-bookings.service.ts", roomServiceSolution),
        ],
        tests: [
          ts("src/room-bookings/filter-room-bookings-query.dto.spec.ts", roomDtoSpec),
          ts("src/room-bookings/room-bookings.service.spec.ts", roomServiceSpec),
        ],
      },
    ],
  },
];
