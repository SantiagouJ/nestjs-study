import type { ExerciseFile } from "@/lib/types";

function ts(path: string, content: string): ExerciseFile {
  return { path, language: "typescript", content };
}

/** Código completo de los archivos que edita el alumno, sin TODOs. */
export const solutions: Record<string, ExerciseFile[]> = {
  "entidades-1": [
    ts(
      "src/customers/entities/customer.entity.ts",
      `import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("customers")
export class CustomerEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 80 })
  name!: string;

  @Column({ unique: true })
  email!: string;
}
`,
    ),
  ],

  "entidades-2": [
    ts(
      "src/orders/entities/order.entity.ts",
      `import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { CustomerEntity } from "../../customers/entities/customer.entity";

@Entity("orders")
export class OrderEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  item!: string;

  @Column({ type: "int" })
  quantity!: number;

  @Column({ default: "pending" })
  status!: "pending" | "ready";

  @ManyToOne(() => CustomerEntity, (customer) => customer.orders, {
    nullable: false,
  })
  @JoinColumn({ name: "customer_id" })
  customer!: CustomerEntity;
}
`,
    ),
  ],

  "entidades-3": [
    ts(
      "src/customers/entities/customer.entity.ts",
      `import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { OrderEntity } from "../../orders/entities/order.entity";

@Entity("customers")
export class CustomerEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 80 })
  name!: string;

  @Column({ unique: true })
  email!: string;

  @OneToMany(() => OrderEntity, (order) => order.customer)
  orders!: OrderEntity[];
}
`,
    ),
    ts(
      "src/customers/customers.service.ts",
      `import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CustomerEntity } from "./entities/customer.entity";

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(CustomerEntity)
    private readonly customersRepository: Repository<CustomerEntity>,
  ) {}

  async findOneWithOrders(id: number): Promise<CustomerEntity | null> {
    return this.customersRepository.findOne({
      where: { id },
      relations: { orders: true },
    });
  }
}
`,
    ),
  ],

  "repositorios-1": [
    ts(
      "src/orders/orders.service.ts",
      `import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateOrderDto } from "./create-order.dto";
import { CustomerEntity } from "../customers/entities/customer.entity";
import { OrderEntity } from "./entities/order.entity";

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly ordersRepository: Repository<OrderEntity>,

    @InjectRepository(CustomerEntity)
    private readonly customersRepository: Repository<CustomerEntity>,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<OrderEntity> {
    const customer = await this.customersRepository.findOneBy({
      id: createOrderDto.customerId,
    });

    if (!customer) {
      throw new NotFoundException(
        \`Customer with id \${createOrderDto.customerId} was not found\`,
      );
    }

    const order = this.ordersRepository.create({
      item: createOrderDto.item,
      quantity: createOrderDto.quantity,
      status: "pending",
      customer,
    });

    return this.ordersRepository.save(order);
  }
}
`,
    ),
  ],

  "repositorios-2": [
    ts(
      "src/orders/orders.service.ts",
      `import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CustomerEntity } from "../customers/entities/customer.entity";
import { OrderEntity } from "./entities/order.entity";

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly ordersRepository: Repository<OrderEntity>,

    @InjectRepository(CustomerEntity)
    private readonly customersRepository: Repository<CustomerEntity>,
  ) {}

  async findAll(): Promise<OrderEntity[]> {
    return this.ordersRepository.find({
      relations: { customer: true },
      order: { id: "ASC" },
    });
  }

  async findOne(id: number): Promise<OrderEntity> {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: { customer: true },
    });

    if (!order) {
      throw new NotFoundException(\`Order with id \${id} was not found\`);
    }

    return order;
  }
}
`,
    ),
  ],

  "repositorios-3": [
    ts(
      "src/orders/orders.service.ts",
      `import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UpdateOrderDto } from "./update-order.dto";
import { CustomerEntity } from "../customers/entities/customer.entity";
import { OrderEntity } from "./entities/order.entity";

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly ordersRepository: Repository<OrderEntity>,

    @InjectRepository(CustomerEntity)
    private readonly customersRepository: Repository<CustomerEntity>,
  ) {}

  async findOne(id: number): Promise<OrderEntity> {
    const order = await this.ordersRepository.findOne({
      where: { id },
      relations: { customer: true },
    });

    if (!order) {
      throw new NotFoundException(\`Order with id \${id} was not found\`);
    }

    return order;
  }

  async update(id: number, updateOrderDto: UpdateOrderDto): Promise<OrderEntity> {
    const order = await this.findOne(id);
    this.ordersRepository.merge(order, updateOrderDto);
    return this.ordersRepository.save(order);
  }

  async remove(id: number): Promise<OrderEntity> {
    const order = await this.findOne(id);
    return this.ordersRepository.remove(order);
  }
}
`,
    ),
  ],

  "servicios-1": [
    ts(
      "src/orders/order-preparation-estimate.service.ts",
      `import { Injectable } from "@nestjs/common";
import { OrdersService } from "./orders.service";

@Injectable()
export class OrderPreparationEstimateService {
  constructor(private readonly ordersService: OrdersService) {}

  async estimate(id: number) {
    const order = await this.ordersService.findOne(id);
    const estimatedMinutes =
      order.status === "ready" ? 0 : 3 + order.quantity * 2;

    return {
      orderId: order.id,
      status: order.status,
      estimatedMinutes,
    };
  }
}
`,
    ),
    ts(
      "src/orders/orders.module.ts",
      `import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CustomerEntity } from "../customers/entities/customer.entity";
import { OrderEntity } from "./entities/order.entity";
import { OrdersController } from "./orders.controller";
import { OrderRulesService } from "./order-rules.service";
import { OrdersService } from "./orders.service";
import { OrderPreparationEstimateService } from "./order-preparation-estimate.service";

@Module({
  imports: [TypeOrmModule.forFeature([CustomerEntity, OrderEntity])],
  controllers: [OrdersController],
  providers: [OrdersService, OrderRulesService, OrderPreparationEstimateService],
})
export class OrdersModule {}
`,
    ),
  ],

  "servicios-2": [
    ts(
      "src/orders/order-rules.service.ts",
      `import {
  BadRequestException,
  ConflictException,
  Injectable,
} from "@nestjs/common";
import { OrderEntity } from "./entities/order.entity";

@Injectable()
export class OrderRulesService {
  ensureCanBeMarkedAsReady(order: OrderEntity): void {
    if (order.quantity <= 0) {
      throw new BadRequestException("An order must have at least one item");
    }

    if (order.status !== "pending") {
      throw new ConflictException("Only pending orders can be marked as ready");
    }
  }
}
`,
    ),
    ts(
      "src/orders/orders.service.ts",
      `import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { OrderRulesService } from "./order-rules.service";
import { OrderEntity } from "./entities/order.entity";

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly ordersRepository: Repository<OrderEntity>,

    private readonly orderRulesService: OrderRulesService,
  ) {}

  async findOne(id: number): Promise<OrderEntity> {
    const order = await this.ordersRepository.findOne({
      where: { id },
    });

    if (!order) {
      throw new Error(\`Order with id \${id} was not found\`);
    }

    return order;
  }

  async markAsReady(id: number): Promise<OrderEntity> {
    const order = await this.findOne(id);
    this.orderRulesService.ensureCanBeMarkedAsReady(order);
    order.status = "ready";
    return this.ordersRepository.save(order);
  }
}
`,
    ),
  ],

  "servicios-3": [
    ts(
      "src/orders/orders.service.ts",
      `import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { OrderEntity } from "./entities/order.entity";

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly ordersRepository: Repository<OrderEntity>,
  ) {}

  async findRecentPending(): Promise<OrderEntity[]> {
    return this.ordersRepository.find({
      where: { status: "pending" },
      relations: { customer: true },
      order: { id: "DESC" },
      take: 5,
    });
  }

  async countPending(): Promise<number> {
    return this.ordersRepository.countBy({ status: "pending" });
  }
}
`,
    ),
    ts(
      "src/orders/orders.controller.ts",
      `import { Controller, Get } from "@nestjs/common";
import { OrdersService } from "./orders.service";

@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get("pending")
  findRecentPending() {
    return this.ordersService.findRecentPending();
  }

  @Get("pending/count")
  async countPending() {
    const total = await this.ordersService.countPending();
    return { total };
  }

  @Get(":id")
  findOne() {
    return null;
  }
}
`,
    ),
  ],

  "pipes-1": [
    ts(
      "src/orders/create-order.dto.ts",
      `import {
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  item!: string;

  @IsInt()
  @Min(1)
  @Max(20)
  quantity!: number;

  @IsInt()
  @Min(1)
  customerId!: number;
}
`,
    ),
    ts(
      "src/orders/orders.controller.ts",
      `import { Body, Controller, Get, Param, ParseIntPipe, Post } from "@nestjs/common";
import { CreateOrderDto } from "./create-order.dto";
import { OrdersService } from "./orders.service";

@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.ordersService.findOne(id);
  }
}
`,
    ),
  ],

  "pipes-2": [
    ts(
      "src/orders/orders.controller.ts",
      `import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  ValidationPipe,
} from "@nestjs/common";
import { CreateOrderDto } from "./create-order.dto";
import { OrdersService } from "./orders.service";

@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(
    @Body(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    createOrderDto: CreateOrderDto,
  ) {
    return this.ordersService.create(createOrderDto);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.ordersService.findOne(id);
  }
}
`,
    ),
  ],

  "pipes-3": [
    ts(
      "src/orders/filter-orders-query.dto.ts",
      `import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, Max, Min } from "class-validator";

export class FilterOrdersQueryDto {
  @IsOptional()
  @IsIn(["pending", "ready"])
  status?: "pending" | "ready";

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit: number = 5;
}
`,
    ),
    ts(
      "src/orders/orders.controller.ts",
      `import { Controller, Get, Query, ValidationPipe } from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { FilterOrdersQueryDto } from "./filter-orders-query.dto";

const requestValidationPipe = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
});

@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get("search")
  search(@Query(requestValidationPipe) query: FilterOrdersQueryDto) {
    return this.ordersService.findFiltered(query);
  }

  @Get(":id")
  findOne() {
    return null;
  }
}
`,
    ),
    ts(
      "src/orders/orders.service.ts",
      `import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { FilterOrdersQueryDto } from "./filter-orders-query.dto";
import { OrderEntity } from "./entities/order.entity";

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly ordersRepository: Repository<OrderEntity>,
  ) {}

  async findFiltered(query: FilterOrdersQueryDto) {
    return this.ordersRepository.find({
      where: query.status ? { status: query.status } : {},
      relations: { customer: true },
      order: { id: "ASC" },
      take: query.limit,
    });
  }
}
`,
    ),
  ],

  "pruebas-1": [
    ts(
      "src/orders/orders.service.spec.ts",
      `import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { CustomerEntity } from "../customers/entities/customer.entity";
import { OrderEntity } from "./entities/order.entity";
import { OrdersService } from "./orders.service";

describe("OrdersService", () => {
  let service: OrdersService;

  const repositoryMock = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(OrderEntity), useValue: repositoryMock },
        {
          provide: getRepositoryToken(CustomerEntity),
          useValue: { findOneBy: jest.fn() },
        },
      ],
    }).compile();

    service = moduleRef.get(OrdersService);
  });

  it("is defined", () => {
    expect(service).toBeDefined();
  });

  it("returns all orders", async () => {
    const orders = [{ id: 1, item: "Latte" }] as OrderEntity[];
    repositoryMock.find.mockResolvedValue(orders);

    const result = await service.findAll();

    expect(result).toEqual(orders);
    expect(repositoryMock.find).toHaveBeenCalled();
  });

  it("returns an order when the id exists", async () => {
    const order = { id: 7, item: "Cappuccino" } as OrderEntity;
    repositoryMock.findOne.mockResolvedValue(order);

    const result = await service.findOne(7);

    expect(result).toEqual(order);
    expect(repositoryMock.findOne).toHaveBeenCalledWith({
      where: { id: 7 },
      relations: { customer: true },
    });
  });
});
`,
    ),
  ],

  "pruebas-2": [
    ts(
      "src/orders/orders.service.spec.ts",
      `import { NotFoundException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { CustomerEntity } from "../customers/entities/customer.entity";
import { OrderEntity } from "./entities/order.entity";
import { OrdersService } from "./orders.service";

describe("OrdersService — casos de error y creación", () => {
  let service: OrdersService;

  const repositoryMock = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const customersRepositoryMock = {
    findOneBy: jest.fn(),
  };

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

  it("throws NotFoundException when the order does not exist", async () => {
    repositoryMock.findOne.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toBeInstanceOf(NotFoundException);
  });

  it("creates and saves an order", async () => {
    const customer = { id: 1, name: "Laura" } as CustomerEntity;
    const data = { item: "Latte", quantity: 2, customerId: 1 };
    const order = { id: 4, ...data, status: "pending" } as OrderEntity;
    const savedOrder = { ...order, id: 4 } as OrderEntity;

    customersRepositoryMock.findOneBy.mockResolvedValue(customer);
    repositoryMock.create.mockReturnValue(order);
    repositoryMock.save.mockResolvedValue(savedOrder);

    const result = await service.create(data);

    expect(repositoryMock.create).toHaveBeenCalled();
    expect(repositoryMock.save).toHaveBeenCalledWith(order);
    expect(result).toBe(savedOrder);
  });

  it("throws NotFoundException when the customer does not exist", async () => {
    customersRepositoryMock.findOneBy.mockResolvedValue(null);

    await expect(
      service.create({ item: "Latte", quantity: 1, customerId: 9999 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
`,
    ),
  ],

  "pruebas-3": [
    ts(
      "src/orders/orders.service.spec.ts",
      `import { ConflictException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { OrderRulesService } from "./order-rules.service";
import { OrderEntity } from "./entities/order.entity";
import { OrdersService } from "./orders.service";

describe("OrdersService — markAsReady", () => {
  let service: OrdersService;

  const repositoryMock = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const orderRulesServiceMock = {
    ensureCanBeMarkedAsReady: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(OrderEntity), useValue: repositoryMock },
        { provide: OrderRulesService, useValue: orderRulesServiceMock },
      ],
    }).compile();

    service = moduleRef.get(OrdersService);
  });

  it("marks a pending order as ready and saves it", async () => {
    const order = {
      id: 4,
      item: "Latte",
      quantity: 2,
      status: "pending",
    } as OrderEntity;
    const savedOrder = { ...order, status: "ready" } as OrderEntity;

    repositoryMock.findOne.mockResolvedValue(order);
    repositoryMock.save.mockResolvedValue(savedOrder);

    const result = await service.markAsReady(4);

    expect(orderRulesServiceMock.ensureCanBeMarkedAsReady).toHaveBeenCalledWith(order);
    expect(repositoryMock.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: "ready" }),
    );
    expect(result).toBe(savedOrder);
  });

  it("does not save when the business rule rejects the change", async () => {
    const order = {
      id: 5,
      item: "Mocha",
      quantity: 1,
      status: "ready",
    } as OrderEntity;

    repositoryMock.findOne.mockResolvedValue(order);
    orderRulesServiceMock.ensureCanBeMarkedAsReady.mockImplementation(() => {
      throw new ConflictException("Only pending orders can be marked as ready");
    });

    await expect(service.markAsReady(5)).rejects.toBeInstanceOf(ConflictException);
    expect(repositoryMock.save).not.toHaveBeenCalled();
  });
});
`,
    ),
  ],

  "taller-1": [
    ts(
      "src/screenings/entities/screening.entity.ts",
      `import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { RoomEntity } from "../../rooms/entities/room.entity";

@Entity("screenings")
export class ScreeningEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 120 })
  movie!: string;

  @Column({ type: "int" })
  seatsTaken!: number;

  @ManyToOne(() => RoomEntity, { nullable: false })
  @JoinColumn({ name: "room_id" })
  room!: RoomEntity;
}
`,
    ),
  ],

  "taller-2": [
    ts(
      "src/screenings/bookings.service.ts",
      `import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BookSeatsDto } from "./book-seats.dto";
import { ScreeningEntity } from "./entities/screening.entity";

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(ScreeningEntity)
    private readonly screeningsRepository: Repository<ScreeningEntity>,
  ) {}

  async book(bookSeatsDto: BookSeatsDto): Promise<ScreeningEntity> {
    const screening = await this.screeningsRepository.findOne({
      where: { id: bookSeatsDto.screeningId },
      relations: { room: true },
    });

    if (!screening) {
      throw new NotFoundException(
        \`Screening with id \${bookSeatsDto.screeningId} was not found\`,
      );
    }

    const next = screening.seatsTaken + bookSeatsDto.seats;
    if (next > screening.room.capacity) {
      throw new ConflictException("Not enough seats");
    }

    screening.seatsTaken = next;
    return this.screeningsRepository.save(screening);
  }
}
`,
    ),
  ],
};
