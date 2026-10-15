import type { ExerciseFile } from "@/lib/types";

function spec(path: string, content: string): ExerciseFile[] {
  return [{ path, language: "typescript", content }];
}

/**
 * Tests ocultos por ejercicio. Se escriben en el WebContainer al
 * ejecutar y no forman parte de los archivos que edita el alumno.
 */
export const hiddenTests: Record<string, ExerciseFile[]> = {
  "entidades-1": spec(
    "src/customers/entities/customer.entity.spec.ts",
    `import { getMetadataArgsStorage } from "typeorm";
import { CustomerEntity } from "./customer.entity";

describe("CustomerEntity", () => {
  const storage = getMetadataArgsStorage();

  it("declara id como clave primaria generada", () => {
    const generated = storage.generations.filter(
      (column) => column.target === CustomerEntity && column.propertyName === "id",
    );
    expect(generated.length).toBeGreaterThan(0);
  });

  it("limita name a 80 caracteres", () => {
    const column = storage.columns.find(
      (item) => item.target === CustomerEntity && item.propertyName === "name",
    );
    expect(column?.options.length).toBe(80);
  });

  it("marca email como único", () => {
    const column = storage.columns.find(
      (item) => item.target === CustomerEntity && item.propertyName === "email",
    );
    expect(column?.options.unique).toBe(true);
  });
});
`,
  ),

  "entidades-2": spec(
    "src/orders/entities/order.entity.spec.ts",
    `import { getMetadataArgsStorage } from "typeorm";
import { OrderEntity } from "./order.entity";

describe("OrderEntity", () => {
  const storage = getMetadataArgsStorage();

  it("relaciona cada pedido con un cliente en many-to-one", () => {
    const relation = storage.relations.find(
      (item) => item.target === OrderEntity && item.propertyName === "customer",
    );
    expect(relation?.relationType).toBe("many-to-one");
    expect(relation?.options.nullable).toBe(false);
  });

  it("nombra la clave foránea customer_id", () => {
    const join = storage.joinColumns.find(
      (item) => item.target === OrderEntity && item.propertyName === "customer",
    );
    expect(join?.name).toBe("customer_id");
  });
});
`,
  ),

  "entidades-3": spec(
    "src/customers/customers.service.spec.ts",
    `import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { getMetadataArgsStorage } from "typeorm";
import { CustomersService } from "./customers.service";
import { CustomerEntity } from "./entities/customer.entity";

describe("CustomerEntity y CustomersService", () => {
  it("declara orders como one-to-many inverso de order.customer", () => {
    const relation = getMetadataArgsStorage().relations.find(
      (item) => item.target === CustomerEntity && item.propertyName === "orders",
    );
    expect(relation?.relationType).toBe("one-to-many");

    const probe = { customer: "inverse" };
    const inverse = relation?.inverseSideProperty;
    expect(typeof inverse).toBe("function");
    expect((inverse as (entity: { customer: string }) => string)(probe)).toBe(
      "inverse",
    );
  });

  it("findOneWithOrders pide la relación orders", async () => {
    const repository = { findOne: jest.fn().mockResolvedValue(null) };
    const moduleRef = await Test.createTestingModule({
      providers: [
        CustomersService,
        { provide: getRepositoryToken(CustomerEntity), useValue: repository },
      ],
    }).compile();

    const service = moduleRef.get(CustomersService);
    await service.findOneWithOrders(4);

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { id: 4 },
      relations: { orders: true },
    });
  });
});
`,
  ),

  "repositorios-1": spec(
    "src/orders/orders.service.spec.ts",
    `import { NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { CustomerEntity } from "../customers/entities/customer.entity";
import { OrderEntity } from "./entities/order.entity";
import { OrdersService } from "./orders.service";

describe("OrdersService.create", () => {
  let service: OrdersService;

  const ordersRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };
  const customersRepository = { findOneBy: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(OrderEntity), useValue: ordersRepository },
        {
          provide: getRepositoryToken(CustomerEntity),
          useValue: customersRepository,
        },
      ],
    }).compile();

    service = moduleRef.get(OrdersService);
  });

  it("lanza NotFoundException si el cliente no existe", async () => {
    customersRepository.findOneBy.mockResolvedValue(null);

    await expect(
      service.create({ item: "Latte", quantity: 1, customerId: 9 }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(ordersRepository.save).not.toHaveBeenCalled();
  });

  it("crea el pedido en pending y lo guarda", async () => {
    const customer = { id: 1, name: "Laura" } as CustomerEntity;
    const built = {
      item: "Latte",
      quantity: 2,
      status: "pending",
      customer,
    } as OrderEntity;
    customersRepository.findOneBy.mockResolvedValue(customer);
    ordersRepository.create.mockReturnValue(built);
    ordersRepository.save.mockResolvedValue({ ...built, id: 4 });

    const result = await service.create({
      item: "Latte",
      quantity: 2,
      customerId: 1,
    });

    expect(customersRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
    expect(ordersRepository.create).toHaveBeenCalledWith({
      item: "Latte",
      quantity: 2,
      status: "pending",
      customer,
    });
    expect(ordersRepository.save).toHaveBeenCalledWith(built);
    expect(result).toEqual({ ...built, id: 4 });
  });
});
`,
  ),

  "repositorios-2": spec(
    "src/orders/orders.service.spec.ts",
    `import { NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { CustomerEntity } from "../customers/entities/customer.entity";
import { OrderEntity } from "./entities/order.entity";
import { OrdersService } from "./orders.service";

describe("OrdersService", () => {
  let service: OrdersService;

  const repositoryMock = { find: jest.fn(), findOne: jest.fn() };
  const customersRepositoryMock = { findOneBy: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(OrderEntity), useValue: repositoryMock },
        {
          provide: getRepositoryToken(CustomerEntity),
          useValue: customersRepositoryMock,
        },
      ],
    }).compile();

    service = moduleRef.get(OrdersService);
  });

  it("findAll incluye la relación customer y ordena por id ascendente", async () => {
    const orders = [{ id: 1, item: "Latte" }] as OrderEntity[];
    repositoryMock.find.mockResolvedValue(orders);

    const result = await service.findAll();

    expect(repositoryMock.find).toHaveBeenCalledWith({
      relations: { customer: true },
      order: { id: "ASC" },
    });
    expect(result).toEqual(orders);
  });

  it("findOne devuelve el pedido con su customer", async () => {
    const order = { id: 7, item: "Cappuccino" } as OrderEntity;
    repositoryMock.findOne.mockResolvedValue(order);

    const result = await service.findOne(7);

    expect(repositoryMock.findOne).toHaveBeenCalledWith({
      where: { id: 7 },
      relations: { customer: true },
    });
    expect(result).toEqual(order);
  });

  it("findOne lanza NotFoundException cuando el pedido no existe", async () => {
    repositoryMock.findOne.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
`,
  ),

  "repositorios-3": spec(
    "src/orders/orders.service.spec.ts",
    `import { NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { CustomerEntity } from "../customers/entities/customer.entity";
import { OrderEntity } from "./entities/order.entity";
import { OrdersService } from "./orders.service";

describe("OrdersService update y remove", () => {
  let service: OrdersService;

  const repositoryMock = {
    findOne: jest.fn(),
    merge: jest.fn((order, dto) => Object.assign(order, dto)),
    save: jest.fn(async (order) => order),
    remove: jest.fn(async (order) => order),
  };
  const customersRepositoryMock = { findOneBy: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(OrderEntity), useValue: repositoryMock },
        {
          provide: getRepositoryToken(CustomerEntity),
          useValue: customersRepositoryMock,
        },
      ],
    }).compile();

    service = moduleRef.get(OrdersService);
  });

  it("update aplica merge y guarda", async () => {
    repositoryMock.findOne.mockResolvedValue({
      id: 3,
      item: "Latte",
      quantity: 1,
      status: "pending",
    });

    const result = await service.update(3, { item: "Mocha" });

    expect(repositoryMock.merge).toHaveBeenCalledWith(
      expect.objectContaining({ id: 3 }),
      { item: "Mocha" },
    );
    expect(repositoryMock.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 3, item: "Mocha" }),
    );
    expect(result.item).toBe("Mocha");
  });

  it("remove elimina la entidad cargada", async () => {
    const order = { id: 3, item: "Latte" };
    repositoryMock.findOne.mockResolvedValue(order);

    await service.remove(3);

    expect(repositoryMock.remove).toHaveBeenCalledWith(order);
  });

  it("update y remove conservan el 404", async () => {
    repositoryMock.findOne.mockResolvedValue(null);

    await expect(service.update(9, { item: "Mocha" })).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.remove(9)).rejects.toBeInstanceOf(NotFoundException);
    expect(repositoryMock.save).not.toHaveBeenCalled();
    expect(repositoryMock.remove).not.toHaveBeenCalled();
  });
});
`,
  ),

  "servicios-1": spec(
    "src/orders/order-preparation-estimate.service.spec.ts",
    `import { NotFoundException } from "@nestjs/common";
import { MODULE_METADATA } from "@nestjs/common/constants";
import { Test } from "@nestjs/testing";
import { OrderPreparationEstimateService } from "./order-preparation-estimate.service";
import { OrdersModule } from "./orders.module";
import { OrdersService } from "./orders.service";

describe("OrderPreparationEstimateService", () => {
  const ordersService = { findOne: jest.fn() };
  let service: OrderPreparationEstimateService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        OrderPreparationEstimateService,
        { provide: OrdersService, useValue: ordersService },
      ],
    }).compile();

    service = moduleRef.get(OrderPreparationEstimateService);
  });

  it("está registrado en OrdersModule", () => {
    const providers = Reflect.getMetadata(MODULE_METADATA.PROVIDERS, OrdersModule);
    expect(providers).toContain(OrderPreparationEstimateService);
  });

  it("estima 3 + quantity * 2 minutos cuando el pedido está pending", async () => {
    ordersService.findOne.mockResolvedValue({
      id: 8,
      status: "pending",
      quantity: 2,
    });

    await expect(service.estimate(8)).resolves.toEqual({
      orderId: 8,
      status: "pending",
      estimatedMinutes: 7,
    });
    expect(ordersService.findOne).toHaveBeenCalledWith(8);
  });

  it("estima 0 minutos cuando el pedido ya está ready", async () => {
    ordersService.findOne.mockResolvedValue({
      id: 2,
      status: "ready",
      quantity: 4,
    });

    await expect(service.estimate(2)).resolves.toEqual({
      orderId: 2,
      status: "ready",
      estimatedMinutes: 0,
    });
  });

  it("propaga el 404 de findOne", async () => {
    ordersService.findOne.mockRejectedValue(new NotFoundException("missing"));

    await expect(service.estimate(99)).rejects.toBeInstanceOf(NotFoundException);
  });
});
`,
  ),

  "servicios-2": spec(
    "src/orders/order-rules.service.spec.ts",
    `import {
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { OrderEntity } from "./entities/order.entity";
import { OrderRulesService } from "./order-rules.service";
import { OrdersService } from "./orders.service";

describe("reglas y markAsReady", () => {
  const rules = new OrderRulesService();

  it("rechaza cantidad cero y un pedido que no está pending", () => {
    expect(() =>
      rules.ensureCanBeMarkedAsReady({
        quantity: 0,
        status: "pending",
      } as OrderEntity),
    ).toThrow(BadRequestException);

    expect(() =>
      rules.ensureCanBeMarkedAsReady({
        quantity: 2,
        status: "ready",
      } as OrderEntity),
    ).toThrow(ConflictException);
  });

  it("permite un pedido pending con cantidad positiva", () => {
    expect(() =>
      rules.ensureCanBeMarkedAsReady({
        quantity: 1,
        status: "pending",
      } as OrderEntity),
    ).not.toThrow();
  });

  it("markAsReady valida, cambia el estado y guarda", async () => {
    const repository = {
      findOne: jest.fn().mockResolvedValue({
        id: 4,
        quantity: 2,
        status: "pending",
      }),
      save: jest.fn(async (order) => order),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        OrdersService,
        OrderRulesService,
        { provide: getRepositoryToken(OrderEntity), useValue: repository },
      ],
    }).compile();

    const service = moduleRef.get(OrdersService);
    const result = await service.markAsReady(4);

    expect(result.status).toBe("ready");
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 4, status: "ready" }),
    );
  });

  it("no guarda cuando la regla rechaza el cambio", async () => {
    const repository = {
      findOne: jest.fn().mockResolvedValue({
        id: 5,
        quantity: 1,
        status: "ready",
      }),
      save: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        OrdersService,
        OrderRulesService,
        { provide: getRepositoryToken(OrderEntity), useValue: repository },
      ],
    }).compile();

    const service = moduleRef.get(OrdersService);

    await expect(service.markAsReady(5)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(repository.save).not.toHaveBeenCalled();
  });
});
`,
  ),

  "servicios-3": spec(
    "src/orders/orders.service.spec.ts",
    `import { RequestMethod } from "@nestjs/common";
import { METHOD_METADATA, PATH_METADATA } from "@nestjs/common/constants";
import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";
import { OrderEntity } from "./entities/order.entity";

function routesOf(controller: Function) {
  return Object.getOwnPropertyNames(controller.prototype)
    .filter((name) => name !== "constructor")
    .map((name) => ({
      name,
      path: Reflect.getMetadata(PATH_METADATA, controller.prototype[name]) as
        | string
        | undefined,
      method: Reflect.getMetadata(
        METHOD_METADATA,
        controller.prototype[name],
      ) as number | undefined,
    }));
}

describe("cola de pendientes", () => {
  const repository = { find: jest.fn(), countBy: jest.fn() };

  let service: OrdersService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(OrderEntity), useValue: repository },
      ],
    }).compile();
    service = moduleRef.get(OrdersService);
  });

  it("findRecentPending filtra, incluye el cliente y toma 5", async () => {
    repository.find.mockResolvedValue([]);

    await service.findRecentPending();

    expect(repository.find).toHaveBeenCalledWith({
      where: { status: "pending" },
      relations: { customer: true },
      order: { id: "DESC" },
      take: 5,
    });
  });

  it("countPending usa countBy", async () => {
    repository.countBy.mockResolvedValue(6);

    await expect(service.countPending()).resolves.toBe(6);
    expect(repository.countBy).toHaveBeenCalledWith({ status: "pending" });
  });

  it("expone GET pending y GET pending/count antes de :id", async () => {
    const routes = routesOf(OrdersController);
    const pending = routes.find((route) => route.path === "pending");
    const count = routes.find((route) => route.path === "pending/count");
    const byId = routes.find((route) => route.path === ":id");

    expect(pending?.method).toBe(RequestMethod.GET);
    expect(count?.method).toBe(RequestMethod.GET);
    expect(routes.indexOf(pending!)).toBeLessThan(routes.indexOf(byId!));
    expect(routes.indexOf(count!)).toBeLessThan(routes.indexOf(byId!));

    const ordersService = {
      findRecentPending: jest.fn().mockResolvedValue([{ id: 1 }]),
      countPending: jest.fn().mockResolvedValue(3),
    };
    const controller = new OrdersController(ordersService as OrdersService);

    await (controller as unknown as Record<string, () => Promise<unknown>>)[
      pending!.name
    ]();
    const total = await (
      controller as unknown as Record<string, () => Promise<unknown>>
    )[count!.name]();

    expect(ordersService.findRecentPending).toHaveBeenCalled();
    expect(ordersService.countPending).toHaveBeenCalled();
    expect(total).toEqual({ total: 3 });
  });
});
`,
  ),

  "pipes-1": spec(
    "src/orders/create-order.dto.spec.ts",
    `import { ParseIntPipe } from "@nestjs/common";
import { ROUTE_ARGS_METADATA } from "@nestjs/common/constants";
import { validate } from "class-validator";
import { OrdersController } from "./orders.controller";
import { CreateOrderDto } from "./create-order.dto";

describe("CreateOrderDto y ParseIntPipe", () => {
  it("rechaza un body inválido y acepta uno válido", async () => {
    const invalid = new CreateOrderDto();
    invalid.item = "";
    invalid.quantity = 0;
    invalid.customerId = -1;

    const invalidErrors = await validate(invalid);
    expect(invalidErrors.map((error) => error.property).sort()).toEqual([
      "customerId",
      "item",
      "quantity",
    ]);

    const valid = new CreateOrderDto();
    valid.item = "Latte";
    valid.quantity = 2;
    valid.customerId = 1;
    expect(await validate(valid)).toHaveLength(0);
  });

  it("limita item a 80 caracteres y quantity a 20", async () => {
    const dto = new CreateOrderDto();
    dto.item = "a".repeat(81);
    dto.quantity = 21;
    dto.customerId = 1;

    const errors = await validate(dto);
    expect(errors.map((error) => error.property).sort()).toEqual([
      "item",
      "quantity",
    ]);
  });

  it("aplica ParseIntPipe al parámetro id", () => {
    const metadata = Reflect.getMetadata(
      ROUTE_ARGS_METADATA,
      OrdersController.prototype.findOne,
    ) as Record<string, { pipes?: unknown[] }>;
    const pipes = Object.values(metadata ?? {}).flatMap(
      (arg) => arg.pipes ?? [],
    );

    expect(
      pipes.some(
        (pipe) => pipe === ParseIntPipe || pipe instanceof ParseIntPipe,
      ),
    ).toBe(true);
  });
});
`,
  ),

  "pipes-2": spec(
    "src/orders/orders.controller.spec.ts",
    `import { ValidationPipe } from "@nestjs/common";
import { ROUTE_ARGS_METADATA } from "@nestjs/common/constants";
import { OrdersController } from "./orders.controller";

describe("ValidationPipe del body", () => {
  it("transforma, filtra y rechaza propiedades extra", () => {
    const metadata = Reflect.getMetadata(
      ROUTE_ARGS_METADATA,
      OrdersController.prototype.create,
    ) as Record<string, { pipes?: unknown[] }>;
    const pipes = Object.values(metadata ?? {}).flatMap(
      (arg) => arg.pipes ?? [],
    );
    const pipe = pipes.find((item) => item instanceof ValidationPipe) as
      | ValidationPipe
      | undefined;

    expect(pipe).toBeInstanceOf(ValidationPipe);
    expect(pipe?.isTransformEnabled).toBe(true);
    expect(pipe?.validatorOptions).toEqual(
      expect.objectContaining({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
  });
});
`,
  ),

  "pipes-3": spec(
    "src/orders/filter-orders-query.dto.spec.ts",
    `import { RequestMethod } from "@nestjs/common";
import { METHOD_METADATA, PATH_METADATA } from "@nestjs/common/constants";
import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { FilterOrdersQueryDto } from "./filter-orders-query.dto";
import { OrderEntity } from "./entities/order.entity";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";

describe("FilterOrdersQueryDto", () => {
  it("convierte limit y solo acepta pending o ready", async () => {
    const parsed = plainToInstance(FilterOrdersQueryDto, {
      status: "pending",
      limit: "3",
    });
    expect(parsed.limit).toBe(3);
    expect(await validate(parsed)).toHaveLength(0);

    const invalid = plainToInstance(FilterOrdersQueryDto, {
      status: "shipped",
      limit: "0",
    });
    const errors = await validate(invalid);
    expect(errors.map((error) => error.property).sort()).toEqual([
      "limit",
      "status",
    ]);
  });

  it("findFiltered usa status, relación, orden y take", async () => {
    const repository = { find: jest.fn().mockResolvedValue([]) };
    const moduleRef = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(OrderEntity), useValue: repository },
      ],
    }).compile();
    const service = moduleRef.get(OrdersService);

    await service.findFiltered({ status: "pending", limit: 3 });
    expect(repository.find).toHaveBeenCalledWith({
      where: { status: "pending" },
      relations: { customer: true },
      order: { id: "ASC" },
      take: 3,
    });

    await service.findFiltered({ limit: 5 });
    const withoutStatus = repository.find.mock.calls[1][0];
    expect(withoutStatus.relations).toEqual({ customer: true });
    expect(withoutStatus.order).toEqual({ id: "ASC" });
    expect(withoutStatus.take).toBe(5);
    expect(withoutStatus.where ?? {}).toEqual({});
  });

  it("declara GET search antes de GET :id", () => {
    const routes = Object.getOwnPropertyNames(OrdersController.prototype)
      .filter((name) => name !== "constructor")
      .map((name) => ({
        path: Reflect.getMetadata(
          PATH_METADATA,
          OrdersController.prototype[name],
        ) as string | undefined,
        method: Reflect.getMetadata(
          METHOD_METADATA,
          OrdersController.prototype[name],
        ) as number | undefined,
      }));

    const search = routes.findIndex((route) => route.path === "search");
    const byId = routes.findIndex((route) => route.path === ":id");
    expect(routes[search]?.method).toBe(RequestMethod.GET);
    expect(search).toBeGreaterThanOrEqual(0);
    expect(search).toBeLessThan(byId);
  });
});
`,
  ),

  "pruebas-1": spec(
    "src/orders/student-spec.hidden.spec.ts",
    `import { readFileSync } from "fs";
import { join } from "path";

function studentCode() {
  return readFileSync(join(process.cwd(), "src/orders/orders.service.spec.ts"), "utf8")
    .replace(/\\/\\*[\\s\\S]*?\\*\\//g, "")
    .replace(/\\/\\/.*$/gm, "");
}

describe("spec del alumno: findAll y findOne", () => {
  const code = studentCode();

  it("registra el repository y configura respuestas", () => {
    expect(code).toMatch(/getRepositoryToken\\(\\s*OrderEntity\\s*\\)/);
    expect(code).toMatch(/mockResolvedValue/);
  });

  it("comprueba findAll y findOne(7) con la relación customer", () => {
    expect(code).toMatch(/\\.findAll\\s*\\(/);
    expect(code).toMatch(/\\.findOne\\s*\\(\\s*7\\s*\\)/);
    expect(code).toMatch(/relations\\s*:\\s*\\{\\s*customer\\s*:\\s*true\\s*\\}/);
    expect(code).toMatch(/toHaveBeenCalled/);
  });
});
`,
  ),

  "pruebas-2": spec(
    "src/orders/student-spec.hidden.spec.ts",
    `import { readFileSync } from "fs";
import { join } from "path";

function studentCode() {
  return readFileSync(join(process.cwd(), "src/orders/orders.service.spec.ts"), "utf8")
    .replace(/\\/\\*[\\s\\S]*?\\*\\//g, "")
    .replace(/\\/\\/.*$/gm, "");
}

describe("spec del alumno: 404 y create", () => {
  const code = studentCode();

  it("cubre el 404 de findOne y de un cliente inexistente", () => {
    expect(code).toMatch(/mockResolvedValue\\(\\s*null\\s*\\)/);
    expect(code).toMatch(/rejects/);
    expect(code).toMatch(/NotFoundException/);
    expect(code).toMatch(/9999/);
  });

  it("cubre create con mockReturnValue y save con mockResolvedValue", () => {
    expect(code).toMatch(/findOneBy/);
    expect(code).toMatch(/mockReturnValue/);
    expect(code).toMatch(/mockResolvedValue/);
    expect(code).toMatch(/\\.create\\s*\\(/);
    expect(code).toMatch(/\\.save\\s*\\(/);
  });
});
`,
  ),

  "pruebas-3": spec(
    "src/orders/student-spec.hidden.spec.ts",
    `import { readFileSync } from "fs";
import { join } from "path";

function studentCode() {
  return readFileSync(join(process.cwd(), "src/orders/orders.service.spec.ts"), "utf8")
    .replace(/\\/\\*[\\s\\S]*?\\*\\//g, "")
    .replace(/\\/\\/.*$/gm, "");
}

describe("spec del alumno: markAsReady", () => {
  const code = studentCode();

  it("ejecuta markAsReady en el caso feliz y cuando la regla falla", () => {
    expect(code).toMatch(/markAsReady\\s*\\(\\s*4\\s*\\)/);
    expect(code).toMatch(/markAsReady\\s*\\(\\s*5\\s*\\)/);
    expect(code).toMatch(/mockResolvedValue/);
    expect(code).toMatch(/ensureCanBeMarkedAsReady/);
    expect(code).toMatch(/not\\.toHaveBeenCalled\\(\\)/);
    expect(code).toMatch(/ConflictException/);
  });
});
`,
  ),

  "taller-1": spec(
    "src/screenings/entities/screening.entity.spec.ts",
    `import { getMetadataArgsStorage } from "typeorm";
import { ScreeningEntity } from "./screening.entity";

describe("ScreeningEntity", () => {
  const storage = getMetadataArgsStorage();

  it("guarda la película y los asientos ocupados", () => {
    const movie = storage.columns.find(
      (column) => column.target === ScreeningEntity && column.propertyName === "movie",
    );
    const seats = storage.columns.find(
      (column) =>
        column.target === ScreeningEntity && column.propertyName === "seatsTaken",
    );
    expect(movie?.options.length).toBe(120);
    expect(seats?.options.type).toBe("int");
  });

  it("pertenece a una sala con clave room_id", () => {
    const relation = storage.relations.find(
      (item) => item.target === ScreeningEntity && item.propertyName === "room",
    );
    const join = storage.joinColumns.find(
      (item) => item.target === ScreeningEntity && item.propertyName === "room",
    );
    expect(relation?.relationType).toBe("many-to-one");
    expect(relation?.options.nullable).toBe(false);
    expect(join?.name).toBe("room_id");
  });
});
`,
  ),

  "taller-2": spec(
    "src/screenings/bookings.service.spec.ts",
    `import { ConflictException, NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { BookingsService } from "./bookings.service";
import { ScreeningEntity } from "./entities/screening.entity";

describe("BookingsService", () => {
  let service: BookingsService;
  const repository = { findOne: jest.fn(), save: jest.fn(async (row) => row) };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: getRepositoryToken(ScreeningEntity), useValue: repository },
      ],
    }).compile();
    service = moduleRef.get(BookingsService);
  });

  it("suma los asientos y guarda cuando hay cupo", async () => {
    repository.findOne.mockResolvedValue({
      id: 3,
      movie: "Dune",
      seatsTaken: 10,
      room: { capacity: 40 },
    });

    const result = await service.book({ screeningId: 3, seats: 2 });

    expect(repository.findOne).toHaveBeenCalledWith({
      where: { id: 3 },
      relations: { room: true },
    });
    expect(result.seatsTaken).toBe(12);
    expect(repository.save).toHaveBeenCalled();
  });

  it("rechaza la reserva si supera la capacidad", async () => {
    repository.findOne.mockResolvedValue({
      id: 3,
      seatsTaken: 39,
      room: { capacity: 40 },
    });

    await expect(service.book({ screeningId: 3, seats: 2 })).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(repository.save).not.toHaveBeenCalled();
  });

  it("lanza NotFoundException si la función no existe", async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.book({ screeningId: 9, seats: 1 })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
`,
  ),
};
