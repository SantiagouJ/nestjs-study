import type { Exercise } from "@/lib/types";

export interface ProjectFile {
  path: string;
  content: string;
}

/* ------------------------------------------------------------------ */
/* Archivos base: configuración del proyecto (compartida por todos)    */
/* ------------------------------------------------------------------ */

const packageJson = `{
  "name": "nestjs-study",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "test": "jest"
  },
  "dependencies": {
    "@nestjs/common": "^11.0.0",
    "@nestjs/core": "^11.0.0",
    "@nestjs/platform-express": "^11.0.0",
    "@nestjs/typeorm": "^11.0.0",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.1",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.2",
    "sql.js": "^1.12.0",
    "typeorm": "^0.3.24"
  },
  "devDependencies": {
    "@nestjs/cli": "^11.0.0",
    "@nestjs/testing": "^11.0.0",
    "@types/express": "^5.0.3",
    "@types/jest": "^29.5.14",
    "@types/node": "^22.10.0",
    "@types/sql.js": "^1.4.9",
    "jest": "^29.7.0",
    "ts-jest": "^29.4.0",
    "typescript": "^5.7.3"
  }
}
`;

const tsconfigJson = `{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "strictBindCallApply": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true
  }
}
`;

const tsconfigBuildJson = `{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "test", "dist", "**/*spec.ts"]
}
`;

const nestCliJson = `{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
`;

const jestConfigJs = `/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.spec.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
  transform: {
    "^.+\\\\.tsx?$": ["ts-jest", { isolatedModules: true }],
  },
};
`;

const mainTs = `import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");
  await app.listen(process.env.PORT ?? 3000);
  console.log(
    "API disponible en http://localhost:" + (process.env.PORT ?? 3000) + "/api",
  );
}
bootstrap();
`;

/** Identifica la instalación. Cambia cuando cambia el package.json del contenedor. */
export function dependencyCacheKey(): string {
  let hash = 5381;
  for (let index = 0; index < packageJson.length; index++) {
    hash = ((hash << 5) + hash) ^ packageJson.charCodeAt(index);
  }
  return (hash >>> 0).toString(16);
}

export const baseFiles: ProjectFile[] = [
  { path: "package.json", content: packageJson },
  { path: "tsconfig.json", content: tsconfigJson },
  { path: "tsconfig.build.json", content: tsconfigBuildJson },
  { path: "nest-cli.json", content: nestCliJson },
  { path: "jest.config.js", content: jestConfigJs },
  { path: "src/main.ts", content: mainTs },
];

/* ------------------------------------------------------------------ */
/* Banco: versiones completas de cada archivo del coffee-orders-api    */
/* ------------------------------------------------------------------ */

const customerEntity: ProjectFile = {
  path: "src/customers/entities/customer.entity.ts",
  content: `import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
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
};

const orderEntity: ProjectFile = {
  path: "src/orders/entities/order.entity.ts",
  content: `import {
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
};

const createOrderDto: ProjectFile = {
  path: "src/orders/create-order.dto.ts",
  content: `export class CreateOrderDto {
  item!: string;
  quantity!: number;
  customerId!: number;
}
`,
};

const updateOrderDto: ProjectFile = {
  path: "src/orders/update-order.dto.ts",
  content: `export class UpdateOrderDto {
  item?: string;
  quantity?: number;
  status?: "pending" | "ready";
}
`,
};

const filterOrdersQueryDto: ProjectFile = {
  path: "src/orders/filter-orders-query.dto.ts",
  content: `import { Type } from "class-transformer";
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
};

const customersService: ProjectFile = {
  path: "src/customers/customers.service.ts",
  content: `import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CustomerEntity } from "./entities/customer.entity";

@Injectable()
export class CustomersService implements OnModuleInit {
  constructor(
    @InjectRepository(CustomerEntity)
    private readonly customersRepository: Repository<CustomerEntity>,
  ) {}

  async onModuleInit() {
    const total = await this.customersRepository.count();

    if (total === 0) {
      await this.customersRepository.save(
        this.customersRepository.create([
          { name: "Laura Gómez", email: "laura@example.com" },
          { name: "Mateo Ruiz", email: "mateo@example.com" },
        ]),
      );
    }
  }

  async findAll(): Promise<CustomerEntity[]> {
    return this.customersRepository.find();
  }

  async findOne(id: number): Promise<CustomerEntity | null> {
    return this.customersRepository.findOne({ where: { id } });
  }
}
`,
};

const customersModule: ProjectFile = {
  path: "src/customers/customers.module.ts",
  content: `import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CustomerEntity } from "./entities/customer.entity";
import { CustomersService } from "./customers.service";

@Module({
  imports: [TypeOrmModule.forFeature([CustomerEntity])],
  providers: [CustomersService],
})
export class CustomersModule {}
`,
};

/** Servicio completo: CRUD básico (etapa repositorios / pipes). */
const ordersServiceBasic: ProjectFile = {
  path: "src/orders/orders.service.ts",
  content: `import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateOrderDto } from "./create-order.dto";
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

  async create(createOrderDto: CreateOrderDto): Promise<OrderEntity> {
    const customer = await this.customersRepository.findOneBy({
      id: createOrderDto.customerId,
    });

    if (!customer) {
      throw new NotFoundException(
        "Customer with id " + createOrderDto.customerId + " was not found",
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
      throw new NotFoundException("Order with id " + id + " was not found");
    }

    return order;
  }

  async update(
    id: number,
    updateOrderDto: UpdateOrderDto,
  ): Promise<OrderEntity> {
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
};

/** findOne + markAsReady (etapa rules / pruebas-3). */
const ordersServiceRules: ProjectFile = {
  path: "src/orders/orders.service.ts",
  content: `import { Injectable, NotFoundException } from "@nestjs/common";
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
      relations: { customer: true },
    });

    if (!order) {
      throw new NotFoundException("Order with id " + id + " was not found");
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
};

/** CRUD + markAsReady (punto de partida de servicios-1). */
const ordersServiceEstimate: ProjectFile = {
  path: "src/orders/orders.service.ts",
  content: `import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateOrderDto } from "./create-order.dto";
import { UpdateOrderDto } from "./update-order.dto";
import { CustomerEntity } from "../customers/entities/customer.entity";
import { OrderEntity } from "./entities/order.entity";
import { OrderRulesService } from "./order-rules.service";

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly ordersRepository: Repository<OrderEntity>,

    @InjectRepository(CustomerEntity)
    private readonly customersRepository: Repository<CustomerEntity>,

    private readonly orderRulesService: OrderRulesService,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<OrderEntity> {
    const customer = await this.customersRepository.findOneBy({
      id: createOrderDto.customerId,
    });

    if (!customer) {
      throw new NotFoundException(
        "Customer with id " + createOrderDto.customerId + " was not found",
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
      throw new NotFoundException("Order with id " + id + " was not found");
    }

    return order;
  }

  async update(
    id: number,
    updateOrderDto: UpdateOrderDto,
  ): Promise<OrderEntity> {
    const order = await this.findOne(id);

    this.ordersRepository.merge(order, updateOrderDto);

    return this.ordersRepository.save(order);
  }

  async remove(id: number): Promise<OrderEntity> {
    const order = await this.findOne(id);

    return this.ordersRepository.remove(order);
  }

  async markAsReady(id: number): Promise<OrderEntity> {
    const order = await this.findOne(id);

    this.orderRulesService.ensureCanBeMarkedAsReady(order);

    order.status = "ready";

    return this.ordersRepository.save(order);
  }
}
`,
};

const orderRulesService: ProjectFile = {
  path: "src/orders/order-rules.service.ts",
  content: `import {
  BadRequestException,
  ConflictException,
  Injectable,
} from "@nestjs/common";
import { OrderEntity } from "./entities/order.entity";

@Injectable()
export class OrderRulesService {
  ensureCanBeMarkedAsReady(order: OrderEntity): void {
    if (order.quantity <= 0) {
      throw new BadRequestException(
        "An order must have at least one item",
      );
    }

    if (order.status !== "pending") {
      throw new ConflictException(
        "Only pending orders can be marked as ready",
      );
    }
  }
}
`,
};

/* ------------------------------------------------------------------ */
/* Módulos y controladores por etapa                                   */
/* ------------------------------------------------------------------ */

const appModuleFull: ProjectFile = {
  path: "src/app.module.ts",
  content: `import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CustomersModule } from "./customers/customers.module";
import { OrdersModule } from "./orders/orders.module";

@Module({
  imports: [
    TypeOrmModule.forRoot({ type: "sqljs", synchronize: true }),
    CustomersModule,
    OrdersModule,
  ],
})
export class AppModule {}
`,
};

const appModuleCustomersOnly: ProjectFile = {
  path: "src/app.module.ts",
  content: `import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CustomersModule } from "./customers/customers.module";

@Module({
  imports: [
    TypeOrmModule.forRoot({ type: "sqljs", synchronize: true }),
    CustomersModule,
  ],
})
export class AppModule {}
`,
};

const ordersModuleEntitiesOnly: ProjectFile = {
  path: "src/orders/orders.module.ts",
  content: `import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CustomerEntity } from "../customers/entities/customer.entity";
import { OrderEntity } from "./entities/order.entity";

@Module({
  imports: [TypeOrmModule.forFeature([CustomerEntity, OrderEntity])],
})
export class OrdersModule {}
`,
};

const ordersModuleBasic: ProjectFile = {
  path: "src/orders/orders.module.ts",
  content: `import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CustomerEntity } from "../customers/entities/customer.entity";
import { OrderEntity } from "./entities/order.entity";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";

@Module({
  imports: [TypeOrmModule.forFeature([CustomerEntity, OrderEntity])],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
`,
};

const ordersModuleRules: ProjectFile = {
  path: "src/orders/orders.module.ts",
  content: `import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CustomerEntity } from "../customers/entities/customer.entity";
import { OrderEntity } from "./entities/order.entity";
import { OrdersController } from "./orders.controller";
import { OrderRulesService } from "./order-rules.service";
import { OrdersService } from "./orders.service";

@Module({
  imports: [TypeOrmModule.forFeature([CustomerEntity, OrderEntity])],
  controllers: [OrdersController],
  providers: [OrdersService, OrderRulesService],
})
export class OrdersModule {}
`,
};

const ordersControllerPostOnly: ProjectFile = {
  path: "src/orders/orders.controller.ts",
  content: `import { Body, Controller, Post } from "@nestjs/common";
import { CreateOrderDto } from "./create-order.dto";
import { OrdersService } from "./orders.service";

@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }
}
`,
};

const ordersControllerReadOnly: ProjectFile = {
  path: "src/orders/orders.controller.ts",
  content: `import { Controller, Get, Param } from "@nestjs/common";
import { OrdersService } from "./orders.service";

@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findAll() {
    return this.ordersService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.ordersService.findOne(Number(id));
  }
}
`,
};

const ordersControllerUpdateDelete: ProjectFile = {
  path: "src/orders/orders.controller.ts",
  content: `import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
} from "@nestjs/common";
import { UpdateOrderDto } from "./update-order.dto";
import { OrdersService } from "./orders.service";

@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.ordersService.findOne(Number(id));
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    return this.ordersService.update(Number(id), updateOrderDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.ordersService.remove(Number(id));
  }
}
`,
};

/** CRUD + estimación (el endpoint /:id/estimate falla hasta registrar el servicio). */
const ordersControllerCrudEstimate: ProjectFile = {
  path: "src/orders/orders.controller.ts",
  content: `import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { CreateOrderDto } from "./create-order.dto";
import { OrderPreparationEstimateService } from "./order-preparation-estimate.service";
import { UpdateOrderDto } from "./update-order.dto";
import { OrdersService } from "./orders.service";

@Controller("orders")
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly orderPreparationEstimateService: OrderPreparationEstimateService,
  ) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.ordersService.findOne(Number(id));
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    return this.ordersService.update(Number(id), updateOrderDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.ordersService.remove(Number(id));
  }

  @Get(":id/estimate")
  estimate(@Param("id") id: string) {
    return this.orderPreparationEstimateService.estimate(Number(id));
  }
}
`,
};

const ordersControllerRules: ProjectFile = {
  path: "src/orders/orders.controller.ts",
  content: `import { Controller, Get, Param, Patch } from "@nestjs/common";
import { OrdersService } from "./orders.service";

@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.ordersService.findOne(Number(id));
  }

  @Patch(":id/ready")
  markAsReady(@Param("id") id: string) {
    return this.ordersService.markAsReady(Number(id));
  }
}
`,
};

const roomEntity: ProjectFile = {
  path: "src/rooms/entities/room.entity.ts",
  content: `import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("rooms")
export class RoomEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ type: "int" })
  capacity!: number;
}
`,
};

const screeningEntity: ProjectFile = {
  path: "src/screenings/entities/screening.entity.ts",
  content: `import {
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
};

const bookSeatsDto: ProjectFile = {
  path: "src/screenings/book-seats.dto.ts",
  content: `export class BookSeatsDto {
  screeningId!: number;
  seats!: number;
}
`,
};

const screeningsModule: ProjectFile = {
  path: "src/screenings/screenings.module.ts",
  content: `import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RoomEntity } from "../rooms/entities/room.entity";
import { BookingsService } from "./bookings.service";
import { ScreeningEntity } from "./entities/screening.entity";

@Module({
  imports: [TypeOrmModule.forFeature([ScreeningEntity, RoomEntity])],
  providers: [BookingsService],
})
export class ScreeningsModule {}
`,
};

const cinemaAppModule: ProjectFile = {
  path: "src/app.module.ts",
  content: `import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ScreeningsModule } from "./screenings/screenings.module";

@Module({
  imports: [
    TypeOrmModule.forRoot({ type: "sqljs", synchronize: true }),
    ScreeningsModule,
  ],
})
export class AppModule {}
`,
};

/* ------------------------------------------------------------------ */
/* Contexto por ejercicio: archivos completos que el ejercicio no      */
/* incluye (los archivos del ejercicio se escriben después y ganan).   */
/* ------------------------------------------------------------------ */

const contexts: Record<string, ProjectFile[]> = {
  // --- Entidades y relaciones ---
  "entidades-1": [appModuleCustomersOnly],
  "entidades-2": [
    customerEntity,
    ordersModuleEntitiesOnly,
    appModuleFull,
  ],
  "entidades-3": [customersModule, appModuleCustomersOnly],

  // --- Repositorios y CRUD ---
  "repositorios-1": [
    customerEntity,
    orderEntity,
    ordersModuleBasic,
    ordersControllerPostOnly,
    customersModule,
    customersService,
    appModuleFull,
  ],
  "repositorios-2": [
    customerEntity,
    orderEntity,
    ordersModuleBasic,
    ordersControllerReadOnly,
    customersModule,
    customersService,
    appModuleFull,
  ],
  "repositorios-3": [
    customerEntity,
    orderEntity,
    ordersModuleBasic,
    ordersControllerUpdateDelete,
    customersModule,
    customersService,
    appModuleFull,
  ],

  // --- Servicios e inyección de dependencias ---
  "servicios-1": [
    customerEntity,
    orderEntity,
    createOrderDto,
    updateOrderDto,
    ordersServiceEstimate,
    orderRulesService,
    ordersControllerCrudEstimate,
    customersModule,
    customersService,
    appModuleFull,
  ],
  "servicios-2": [
    customerEntity,
    orderEntity,
    ordersModuleRules,
    ordersControllerRules,
    customersModule,
    customersService,
    appModuleFull,
  ],
  "servicios-3": [
    customerEntity,
    orderEntity,
    ordersModuleBasic,
    customersModule,
    customersService,
    appModuleFull,
  ],

  // --- Controladores, pipes y validación ---
  "pipes-1": [
    customerEntity,
    orderEntity,
    updateOrderDto,
    ordersServiceBasic,
    ordersModuleBasic,
    customersModule,
    customersService,
    appModuleFull,
  ],
  "pipes-2": [
    customerEntity,
    orderEntity,
    updateOrderDto,
    ordersServiceBasic,
    ordersModuleBasic,
    customersModule,
    customersService,
    appModuleFull,
  ],
  "pipes-3": [
    customerEntity,
    orderEntity,
    createOrderDto,
    updateOrderDto,
    ordersModuleBasic,
    customersModule,
    customersService,
    appModuleFull,
  ],

  // --- Pruebas con mocks ---
  "pruebas-1": [
    customerEntity,
    orderEntity,
    createOrderDto,
    updateOrderDto,
    ordersServiceBasic,
    ordersModuleBasic,
    customersModule,
    customersService,
    appModuleFull,
  ],
  "pruebas-2": [
    customerEntity,
    orderEntity,
    createOrderDto,
    updateOrderDto,
    ordersServiceBasic,
    ordersModuleBasic,
    customersModule,
    customersService,
    appModuleFull,
  ],
  "pruebas-3": [
    customerEntity,
    orderEntity,
    ordersServiceRules,
    orderRulesService,
    ordersModuleRules,
    customersModule,
    customersService,
    appModuleFull,
  ],

  "taller-1": [roomEntity, cinemaAppModule],
  "taller-2": [roomEntity, screeningEntity, bookSeatsDto, screeningsModule, cinemaAppModule],
};

/* ------------------------------------------------------------------ */
/* API pública                                                         */
/* ------------------------------------------------------------------ */

/**
 * Resuelve el conjunto completo de archivos del proyecto para un
 * ejercicio: base + contexto + archivos del ejercicio (con el
 * contenido actual del editor) + tests ocultos. Los archivos del
 * ejercicio se escriben al final, así que ganan sobre el contexto.
 */
export function resolveProjectFiles(
  exercise: Exercise,
  overrides: Record<string, string> = {},
): ProjectFile[] {
  const context = contexts[exercise.id] ?? [];
  const hidden = exercise.tests ?? [];
  const exerciseFiles: ProjectFile[] = exercise.files.map((file) => ({
    path: file.path,
    content: overrides[file.path] ?? file.content,
  }));

  const byPath = new Map<string, ProjectFile>();
  for (const file of [
    ...baseFiles,
    ...context,
    ...exerciseFiles,
    ...hidden,
  ]) {
    byPath.set(file.path, file);
  }
  return [...byPath.values()];
}

/** Rutas de los tests ocultos del ejercicio. */
export function hiddenTestPaths(exercise: Exercise): Set<string> {
  return new Set((exercise.tests ?? []).map((file) => file.path));
}

/** true cuando el ejercicio tiene contexto completo en el motor. */
export function hasContext(exerciseId: string): boolean {
  return exerciseId in contexts;
}
