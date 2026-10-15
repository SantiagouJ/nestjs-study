import type { Track } from "@/lib/types";
import { hiddenTests } from "@/data/hidden-tests";
import { solutions } from "@/data/solutions";

/**
 * Catálogo del track NestJS.
 *
 * Estructura confirmada: 5 temas × 3 ejercicios (fácil–medio).
 * Los archivos iniciales son reales pero incompletos (marcados con TODO).
 * Los tests ocultos viven en hidden-tests.ts. Las soluciones quedan pendientes.
 */
export const track: Track = {
  id: "nestjs",
  title: "NestJS con TypeORM",
  tagline: "Del CRUD al testing: el camino de los repositorios",
  description:
    "Practica NestJS construyendo una API de pedidos de café con TypeORM: entidades, relaciones, repositorios, servicios, validación de entrada y pruebas unitarias con repositories simulados.",
  topics: [
    {
      id: "entidades-relaciones",
      order: 1,
      title: "Entidades y relaciones con TypeORM",
      tagline: "Del diagrama ER a clases mapeadas",
      description:
        "Define entidades, columnas y relaciones many-to-one / one-to-many entre clientes y pedidos.",
      exercises: [
        {
          id: "entidades-1",
          topicId: "entidades-relaciones",
          order: 1,
          title: "Define tu primera entidad",
          difficulty: "easy",
          minutes: 15,
          summary:
            "Completa CustomerEntity con las columnas name y email usando los decoradores de TypeORM.",
          objectives: [
            "Diferenciar entidad de DTO",
            "Usar @Column con opciones de longitud y unicidad",
            "Entender @PrimaryGeneratedColumn",
          ],
          hints: [
            "@Column({ length: 80 }) limita la columna a 80 caracteres.",
            "email debe ser única: @Column({ unique: true }).",
            "Una entidad describe lo que TypeORM persiste; un DTO describe lo que recibe el endpoint.",
          ],
          files: [
            {
              path: "src/customers/entities/customer.entity.ts",
              language: "typescript",
              content: `import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity("customers")
export class CustomerEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  // TODO: agrega la columna name
  // - tipo string
  // - máximo 80 caracteres

  // TODO: agrega la columna email
  // - tipo string
  // - única en la tabla
}
`,
            },
            {
              path: "src/customers/customers.module.ts",
              language: "typescript",
              readOnly: true,
              content: `import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CustomerEntity } from "./entities/customer.entity";

@Module({
  imports: [TypeOrmModule.forFeature([CustomerEntity])],
})
export class CustomersModule {}
`,
            },
          ],
          solutionFiles: solutions["entidades-1"],
          tests: hiddenTests["entidades-1"],
        },
        {
          id: "entidades-2",
          topicId: "entidades-relaciones",
          order: 2,
          title: "Many-to-One: cada pedido pertenece a un cliente",
          difficulty: "medium",
          minutes: 25,
          summary:
            "Agrega la relación many-to-one en OrderEntity con @ManyToOne y @JoinColumn({ name: 'customer_id' }).",
          objectives: [
            "Identificar el lado muchos de la relación",
            "Configurar @ManyToOne con nullable: false",
            "Controlar el nombre de la clave foránea con @JoinColumn",
          ],
          hints: [
            "La clave foránea vive en el lado muchos: orders.customer_id.",
            "@ManyToOne(() => CustomerEntity, (customer) => customer.orders).",
            "nullable: false evita pedidos sin cliente.",
          ],
          files: [
            {
              path: "src/orders/entities/order.entity.ts",
              language: "typescript",
              content: `import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

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

  // TODO: agrega la relación many-to-one con CustomerEntity
  // - propiedad customer: CustomerEntity (singular)
  // - nullable: false
  // - clave foránea llamada customer_id
}
`,
            },
            {
              path: "src/customers/entities/customer.entity.ts",
              language: "typescript",
              readOnly: true,
              content: `import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

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
            },
          ],
          solutionFiles: solutions["entidades-2"],
          tests: hiddenTests["entidades-2"],
        },
        {
          id: "entidades-3",
          topicId: "entidades-relaciones",
          order: 3,
          title: "One-to-Many: del cliente a sus pedidos",
          difficulty: "medium",
          minutes: 30,
          summary:
            "Completa el lado inverso con @OneToMany en CustomerEntity y carga la relación desde el repositorio.",
          objectives: [
            "Declarar @OneToMany como inversa de @ManyToOne",
            "Entender que orders es una propiedad de navegación, no una columna",
            "Solicitar la relación con relations: { orders: true }",
          ],
          hints: [
            "@OneToMany(() => OrderEntity, (order) => order.customer).",
            "orders!: OrderEntity[] no crea una columna; la columna es orders.customer_id.",
            "La relación se carga solo cuando la pides: relations: { orders: true }.",
          ],
          files: [
            {
              path: "src/customers/entities/customer.entity.ts",
              language: "typescript",
              content: `import {
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

  // TODO: agrega el lado inverso de la relación
  // - propiedad orders: OrderEntity[]
  // - apunta a OrderEntity y a su propiedad customer
}
`,
            },
            {
              path: "src/orders/entities/order.entity.ts",
              language: "typescript",
              readOnly: true,
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
            },
            {
              path: "src/customers/customers.service.ts",
              language: "typescript",
              content: `import { Injectable } from "@nestjs/common";
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
    // TODO: devuelve el cliente con sus pedidos usando findOne
    // Pista: la relación se llama "orders"
    return this.customersRepository.findOne({
      where: { id },
    });
  }
}
`,
            },
          ],
          solutionFiles: solutions["entidades-3"],
          tests: hiddenTests["entidades-3"],
        },
      ],
    },
    {
      id: "repositorios-crud",
      order: 2,
      title: "Repositorios y CRUD con TypeORM",
      tagline: "create, save, find, merge, remove",
      description:
        "Reemplaza el arreglo por Repository<T> e implementa las operaciones CRUD sobre los pedidos.",
      exercises: [
        {
          id: "repositorios-1",
          topicId: "repositorios-crud",
          order: 1,
          title: "Crea y guarda un pedido",
          difficulty: "easy",
          minutes: 20,
          summary:
            "Implementa create(): busca el cliente, responde 404 si no existe, y usa create() + save().",
          objectives: [
            "Entender que create() no escribe en la BD; save() sí",
            "Verificar la existencia del cliente relacionado",
            "Lanzar NotFoundException con un mensaje claro",
          ],
          hints: [
            "customersRepository.findOneBy({ id: customerId }) devuelve null si no existe.",
            "Primero busca el cliente, después construye el pedido con ordersRepository.create({ ... }).",
            "El INSERT ocurre en return this.ordersRepository.save(order).",
          ],
          files: [
            {
              path: "src/orders/orders.service.ts",
              language: "typescript",
              content: `import { Injectable, NotFoundException } from "@nestjs/common";
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
    // TODO: busca el cliente con customersRepository.findOneBy
    // Si no existe, lanza NotFoundException(
    //   \`Customer with id \${createOrderDto.customerId} was not found\`
    // )

    // TODO: construye el pedido con ordersRepository.create({
    //   item, quantity, status: "pending", customer,
    // })

    // TODO: guarda y devuelve el pedido con ordersRepository.save(order)
    return {} as OrderEntity;
  }
}
`,
            },
            {
              path: "src/orders/create-order.dto.ts",
              language: "typescript",
              readOnly: true,
              content: `export class CreateOrderDto {
  item!: string;
  quantity!: number;
  customerId!: number;
}
`,
            },
          ],
          solutionFiles: solutions["repositorios-1"],
          tests: hiddenTests["repositorios-1"],
        },
        {
          id: "repositorios-2",
          topicId: "repositorios-crud",
          order: 2,
          title: "Consulta con relations, orden y límite",
          difficulty: "medium",
          minutes: 25,
          summary:
            "Implementa findAll() con la relación al cliente y findOne() que lanza 404 cuando no existe.",
          objectives: [
            "Cargar la relación customer con relations: { customer: true }",
            "Ordenar resultados con order: { id: 'ASC' }",
            "Convertir null en NotFoundException dentro del servicio",
          ],
          hints: [
            "find({ relations: { customer: true }, order: { id: 'ASC' } }).",
            "findOne({ where: { id }, relations: { customer: true } }) devuelve null cuando no existe.",
            "La conversión de null a 404 es responsabilidad del servicio, no del repositorio.",
          ],
          files: [
            {
              path: "src/orders/orders.service.ts",
              language: "typescript",
              content: `import { Injectable, NotFoundException } from "@nestjs/common";
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
    // TODO: devuelve todos los pedidos
    // - incluye el cliente de cada pedido
    // - ordena por id ascendente
    return this.ordersRepository.find();
  }

  async findOne(id: number): Promise<OrderEntity> {
    // TODO: busca un pedido por id incluyendo su cliente
    // Si no existe, lanza NotFoundException(\`Order with id \${id} was not found\`)
    return {} as OrderEntity;
  }
}
`,
            },
          ],
          solutionFiles: solutions["repositorios-2"],
          tests: hiddenTests["repositorios-2"],
        },
        {
          id: "repositorios-3",
          topicId: "repositorios-crud",
          order: 3,
          title: "Actualiza y elimina con merge y remove",
          difficulty: "medium",
          minutes: 30,
          summary:
            "Implementa update() con merge() + save() y remove() conservando el 404 cuando el pedido no existe.",
          objectives: [
            "Aplicar cambios parciales con merge() antes de save()",
            "Entender la diferencia entre remove() y delete()",
            "Conservar el comportamiento 404 en ambas operaciones",
          ],
          hints: [
            "merge(order, updateOrderDto) aplica en memoria solo los campos enviados.",
            "remove() necesita la entidad cargada; delete() elimina directamente por condición.",
            "Reutiliza findOne(id) para validar existencia antes de actualizar o eliminar.",
          ],
          files: [
            {
              path: "src/orders/orders.service.ts",
              language: "typescript",
              content: `import { Injectable, NotFoundException } from "@nestjs/common";
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

  async update(
    id: number,
    updateOrderDto: UpdateOrderDto,
  ): Promise<OrderEntity> {
    // TODO: busca el pedido con findOne(id)
    // TODO: aplica los cambios con merge(order, updateOrderDto)
    // TODO: guarda y devuelve con save(order)
    return {} as OrderEntity;
  }

  async remove(id: number): Promise<OrderEntity> {
    // TODO: busca el pedido con findOne(id)
    // TODO: elimínalo con remove(order) y devuélvelo
    return {} as OrderEntity;
  }
}
`,
            },
            {
              path: "src/orders/update-order.dto.ts",
              language: "typescript",
              readOnly: true,
              content: `export class UpdateOrderDto {
  item?: string;
  quantity?: number;
  status?: "pending" | "ready";
}
`,
            },
          ],
          solutionFiles: solutions["repositorios-3"],
          tests: hiddenTests["repositorios-3"],
        },
      ],
    },
    {
      id: "servicios-di",
      order: 3,
      title: "Servicios e inyección de dependencias",
      tagline: "IoC, providers y servicios colaboradores",
      description:
        "Crea servicios que reutilizan otros servicios, aplica reglas de negocio y consulta con opciones avanzadas.",
      exercises: [
        {
          id: "servicios-1",
          topicId: "servicios-di",
          order: 1,
          title: "Un segundo servicio: estimación de preparación",
          difficulty: "easy",
          minutes: 20,
          summary:
            "Crea OrderPreparationEstimateService que inyecta OrdersService y calcula minutos de espera.",
          objectives: [
            "Inyectar un servicio dentro de otro por constructor",
            "Registrar el nuevo provider en el módulo",
            "Reutilizar findOne() y su 404 en lugar de duplicar lógica",
          ],
          hints: [
            "El constructor pide OrdersService; no uses new OrdersService().",
            "Regla: pending → 3 + quantity × 2 minutos; ready → 0.",
            "Agrega el servicio a providers de OrdersModule sin quitar los existentes.",
          ],
          files: [
            {
              path: "src/orders/order-preparation-estimate.service.ts",
              language: "typescript",
              content: `import { Injectable } from "@nestjs/common";
import { OrdersService } from "./orders.service";

@Injectable()
export class OrderPreparationEstimateService {
  // TODO: inyecta OrdersService en el constructor

  async estimate(id: number) {
    // TODO: obtén el pedido con this.ordersService.findOne(id)

    // TODO: calcula estimatedMinutes:
    // - status "ready" → 0
    // - status "pending" → 3 + quantity * 2

    return {
      orderId: 0,
      status: "pending" as const,
      estimatedMinutes: 0,
    };
  }
}
`,
            },
            {
              path: "src/orders/orders.module.ts",
              language: "typescript",
              content: `import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CustomerEntity } from "../customers/entities/customer.entity";
import { OrderEntity } from "./entities/order.entity";
import { OrdersController } from "./orders.controller";
import { OrderRulesService } from "./order-rules.service";
import { OrdersService } from "./orders.service";
import { OrderPreparationEstimateService } from "./order-preparation-estimate.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([CustomerEntity, OrderEntity]),
  ],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    OrderRulesService,
    // TODO: registra OrderPreparationEstimateService
  ],
})
export class OrdersModule {}
`,
            },
          ],
          solutionFiles: solutions["servicios-1"],
          tests: hiddenTests["servicios-1"],
        },
        {
          id: "servicios-2",
          topicId: "servicios-di",
          order: 2,
          title: "RulesService: reglas de negocio",
          difficulty: "medium",
          minutes: 30,
          summary:
            "Crea OrderRulesService con las reglas para marcar un pedido como listo y el endpoint PATCH :id/ready.",
          objectives: [
            "Separar reglas de negocio del servicio principal",
            "Lanzar BadRequestException y ConflictException según la regla",
            "Coordinar: buscar → validar → cambiar → guardar",
          ],
          hints: [
            "quantity <= 0 → BadRequestException; status !== 'pending' → ConflictException.",
            "OrderRulesService no recibe HTTP ni consulta la BD: trabaja con el pedido ya consultado.",
            "En OrdersService.markAsReady: findOne → ensureCanBeMarkedAsReady → status = 'ready' → save.",
          ],
          files: [
            {
              path: "src/orders/order-rules.service.ts",
              language: "typescript",
              content: `import {
  BadRequestException,
  ConflictException,
  Injectable,
} from "@nestjs/common";
import { OrderEntity } from "./entities/order.entity";

@Injectable()
export class OrderRulesService {
  // TODO: implementa ensureCanBeMarkedAsReady(order: OrderEntity): void
  // - quantity <= 0 → BadRequestException(
  //     "An order must have at least one item"
  //   )
  // - status !== "pending" → ConflictException(
  //     "Only pending orders can be marked as ready"
  //   )
}
`,
            },
            {
              path: "src/orders/orders.service.ts",
              language: "typescript",
              content: `import { Injectable } from "@nestjs/common";
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
    // TODO: coordina la operación
    // 1. const order = await this.findOne(id)
    // 2. this.orderRulesService.ensureCanBeMarkedAsReady(order)
    // 3. order.status = "ready"
    // 4. return this.ordersRepository.save(order)
    return {} as OrderEntity;
  }
}
`,
            },
          ],
          solutionFiles: solutions["servicios-2"],
          tests: hiddenTests["servicios-2"],
        },
        {
          id: "servicios-3",
          topicId: "servicios-di",
          order: 3,
          title: "Cola de pendientes y contador",
          difficulty: "medium",
          minutes: 30,
          summary:
            "Implementa findRecentPending() con where, relations, order y take, además de countBy() para el total.",
          objectives: [
            "Filtrar con where: { status: 'pending' }",
            "Limitar con take: 5 y ordenar con order: { id: 'DESC' }",
            "Contar con countBy() sin cargar todos los registros",
          ],
          hints: [
            "find({ where, relations, order, take }) construye la consulta completa.",
            "countBy({ status: 'pending' }) devuelve un número.",
            "El endpoint GET /orders/pending debe declararse antes de GET /orders/:id.",
          ],
          files: [
            {
              path: "src/orders/orders.service.ts",
              language: "typescript",
              content: `import { Injectable } from "@nestjs/common";
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
    // TODO: devuelve como máximo 5 pedidos pendientes
    // - solo status "pending"
    // - incluye el cliente de cada pedido
    // - ids descendentes (los más recientes primero)
    return this.ordersRepository.find();
  }

  async countPending(): Promise<number> {
    // TODO: devuelve el total de pedidos pendientes con countBy
    return 0;
  }
}
`,
            },
            {
              path: "src/orders/orders.controller.ts",
              language: "typescript",
              content: `import { Controller, Get } from "@nestjs/common";
import { OrdersService } from "./orders.service";

@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // TODO: agrega GET "pending" (debe ir antes de @Get(":id"))
  // findRecentPending() → this.ordersService.findRecentPending()

  // TODO: agrega GET "pending/count"
  // countPending() → this.ordersService.countPending() → { total }

  @Get(":id")
  findOne() {
    return null;
  }
}
`,
            },
          ],
          solutionFiles: solutions["servicios-3"],
          tests: hiddenTests["servicios-3"],
        },
      ],
    },
    {
      id: "controladores-pipes",
      order: 4,
      title: "Controladores, pipes y validación",
      tagline: "Datos de entrada confiables",
      description:
        "Recibe datos desde HTTP, distingue de dónde provienen y los valida antes de ejecutar los servicios.",
      exercises: [
        {
          id: "pipes-1",
          topicId: "controladores-pipes",
          order: 1,
          title: "Valida el DTO de creación",
          difficulty: "easy",
          minutes: 20,
          summary:
            "Agrega validadores de class-validator a CreateOrderDto y ParseIntPipe al parámetro :id.",
          objectives: [
            "Decorar el DTO con @IsString, @IsNotEmpty, @IsInt, @Min, @Max",
            "Entender que el decorador describe la regla y el pipe la ejecuta",
            "Reemplazar Number(id) por ParseIntPipe",
          ],
          hints: [
            "quantity: @IsInt(), @Min(1), @Max(20).",
            "item: @IsString(), @IsNotEmpty(), @MaxLength(80).",
            "ParseIntPipe convierte el param a entero o devuelve 400 antes de ejecutar el método.",
          ],
          files: [
            {
              path: "src/orders/create-order.dto.ts",
              language: "typescript",
              content: `// TODO: importa los decoradores de class-validator

export class CreateOrderDto {
  // TODO: item — texto, no vacío, máximo 80 caracteres
  item!: string;

  // TODO: quantity — entero entre 1 y 20
  quantity!: number;

  // TODO: customerId — entero positivo
  customerId!: number;
}
`,
            },
            {
              path: "src/orders/orders.controller.ts",
              language: "typescript",
              content: `import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from "@nestjs/common";
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
  findOne(
    // TODO: usa ParseIntPipe en el parámetro id
    @Param("id") id: string,
  ) {
    return this.ordersService.findOne(Number(id));
  }
}
`,
            },
          ],
          solutionFiles: solutions["pipes-1"],
          tests: hiddenTests["pipes-1"],
        },
        {
          id: "pipes-2",
          topicId: "controladores-pipes",
          order: 2,
          title: "ValidationPipe con whitelist",
          difficulty: "medium",
          minutes: 30,
          summary:
            "Aplica un ValidationPipe al body de creación con transform, whitelist y forbidNonWhitelisted.",
          objectives: [
            "Crear una instancia de ValidationPipe reutilizable",
            "Entender transform, whitelist y forbidNonWhitelisted",
            "Aplicar el pipe al parámetro que lo declara",
          ],
          hints: [
            "const requestValidationPipe = new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }).",
            "whitelist permite solo propiedades con decoradores de validación.",
            "Agregar status al body de creación debe generar 400: no forma parte de CreateOrderDto.",
          ],
          files: [
            {
              path: "src/orders/orders.controller.ts",
              language: "typescript",
              content: `import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from "@nestjs/common";
import { CreateOrderDto } from "./create-order.dto";
import { OrdersService } from "./orders.service";

@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    // TODO: aplica un ValidationPipe a este body
    // - transform: true
    // - whitelist: true
    // - forbidNonWhitelisted: true
    return this.ordersService.create(createOrderDto);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.ordersService.findOne(id);
  }
}
`,
            },
            {
              path: "src/orders/create-order.dto.ts",
              language: "typescript",
              readOnly: true,
              content: `import {
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
            },
          ],
          solutionFiles: solutions["pipes-2"],
          tests: hiddenTests["pipes-2"],
        },
        {
          id: "pipes-3",
          topicId: "controladores-pipes",
          order: 3,
          title: "Filtros de búsqueda en query",
          difficulty: "medium",
          minutes: 35,
          summary:
            "Crea FilterOrdersQueryDto con @Type, @IsOptional e @IsIn, y el endpoint GET /orders/search.",
          objectives: [
            "Convertir query strings a números con @Type(() => Number)",
            "Hacer un campo opcional con @IsOptional",
            "Restringir valores con @IsIn y declarar search antes de :id",
          ],
          hints: [
            "limit llega como texto: @Type(() => Number) lo convierte antes de @IsInt().",
            "@IsOptional() omite la validación cuando el valor es undefined.",
            "@Get('search') debe declararse antes de @Get(':id') para que 'search' no se lea como un id.",
          ],
          files: [
            {
              path: "src/orders/filter-orders-query.dto.ts",
              language: "typescript",
              content: `// TODO: importa Type de class-transformer
// TODO: importa IsIn, IsInt, IsOptional, Max, Min de class-validator

export class FilterOrdersQueryDto {
  // TODO: status — opcional, solo "pending" o "ready"
  status?: "pending" | "ready";

  // TODO: limit — convierte a número, entero entre 1 y 20,
  // valor por defecto 5 cuando no se envía
  limit: number = 5;
}
`,
            },
            {
              path: "src/orders/orders.controller.ts",
              language: "typescript",
              content: `import {
  Controller,
  Get,
  Query,
  ValidationPipe,
} from "@nestjs/common";
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

  // TODO: agrega GET "search" antes de @Get(":id")
  // search(@Query(requestValidationPipe) query: FilterOrdersQueryDto)
  // → this.ordersService.findFiltered(query)

  @Get(":id")
  findOne() {
    return null;
  }
}
`,
            },
            {
              path: "src/orders/orders.service.ts",
              language: "typescript",
              content: `import { Injectable } from "@nestjs/common";
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
    // TODO: consulta con find() usando las opciones del DTO:
    // - where: el filtro de status solo si existe
    // - relations: { customer: true }
    // - order: { id: 'ASC' }
    // - take: query.limit
    return this.ordersRepository.find();
  }
}
`,
            },
          ],
          solutionFiles: solutions["pipes-3"],
          tests: hiddenTests["pipes-3"],
        },
      ],
    },
    {
      id: "pruebas-mocks",
      order: 5,
      title: "Pruebas con repositories simulados",
      tagline: "TestingModule, getRepositoryToken y mocks",
      description:
        "Prueba OrdersService de forma aislada: sin PostgreSQL, sin HTTP, con repositories y servicios simulados.",
      exercises: [
        {
          id: "pruebas-1",
          topicId: "pruebas-mocks",
          order: 1,
          title: "Prueba findAll y findOne exitoso",
          difficulty: "easy",
          minutes: 25,
          summary:
            "Configura el TestingModule con un repository simulado y prueba los casos exitosos de findAll y findOne.",
          objectives: [
            "Crear un TestingModule con Test.createTestingModule()",
            "Reemplazar el repository con getRepositoryToken + useValue",
            "Controlar respuestas con mockResolvedValue()",
          ],
          hints: [
            "repositoryMock = { find: jest.fn(), findOne: jest.fn(), create: jest.fn(), save: jest.fn() }.",
            "provide: getRepositoryToken(OrderEntity), useValue: repositoryMock.",
            "jest.clearAllMocks() en beforeEach() antes de cada caso.",
          ],
          files: [
            {
              path: "src/orders/orders.service.spec.ts",
              language: "typescript",
              content: `import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { OrderEntity } from "./entities/order.entity";
import { OrdersService } from "./orders.service";

describe("OrdersService", () => {
  let service: OrdersService;

  const repositoryMock = {
    // TODO: crea los mocks de find, findOne, create y save con jest.fn()
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        OrdersService,
        // TODO: registra el repository simulado
        // { provide: getRepositoryToken(OrderEntity), useValue: repositoryMock }
      ],
    }).compile();

    service = moduleRef.get(OrdersService);
  });

  it("is defined", () => {
    expect(service).toBeDefined();
  });

  it("returns all orders", async () => {
    // TODO: configura repositoryMock.find para resolver un arreglo de pedidos
    // TODO: ejecuta service.findAll() y comprueba que devuelve el arreglo
    // TODO: comprueba que repositoryMock.find fue llamado una vez
  });

  it("returns an order when the id exists", async () => {
    // TODO: configura repositoryMock.findOne para resolver un pedido con id 7
    // TODO: ejecuta service.findOne(7) y comprueba el resultado
    // TODO: comprueba que findOne fue llamado con { where: { id: 7 }, relations: { customer: true } }
  });
}
`,
            },
          ],
          solutionFiles: solutions["pruebas-1"],
          tests: hiddenTests["pruebas-1"],
        },
        {
          id: "pruebas-2",
          topicId: "pruebas-mocks",
          order: 2,
          title: "Caso 404 y creación con mocks",
          difficulty: "medium",
          minutes: 30,
          summary:
            "Prueba que findOne lanza NotFoundException cuando el repository devuelve null, y el flujo de create().",
          objectives: [
            "Simular null para probar la transformación en 404",
            "Usar mockReturnValue para create() y mockResolvedValue para save()",
            "Comprobar promesas rechazadas con rejects",
          ],
          hints: [
            "repositoryMock.findOne.mockResolvedValue(null) — el servicio convierte null en NotFoundException.",
            "await expect(service.findOne(999)).rejects.toBeInstanceOf(NotFoundException).",
            "create() es síncrono: usa mockReturnValue; save() es asíncrono: mockResolvedValue.",
          ],
          files: [
            {
              path: "src/orders/orders.service.spec.ts",
              language: "typescript",
              content: `import { NotFoundException } from "@nestjs/common";
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
        {
          provide: getRepositoryToken(OrderEntity),
          useValue: repositoryMock,
        },
        {
          provide: getRepositoryToken(CustomerEntity),
          useValue: customersRepositoryMock,
        },
      ],
    }).compile();

    service = moduleRef.get(OrdersService);
  });

  it("throws NotFoundException when the order does not exist", async () => {
    // TODO: configura repositoryMock.findOne para resolver null
    // TODO: comprueba que service.findOne(999) rechaza con NotFoundException
  });

  it("creates and saves an order", async () => {
    const customer = { id: 1, name: "Laura" } as CustomerEntity;
    const data = { item: "Latte", quantity: 2, customerId: 1 };
    const order = { id: 4, ...data, status: "pending" } as OrderEntity;
    const savedOrder = { ...order, id: 4 } as OrderEntity;

    // TODO: configura customersRepositoryMock.findOneBy para resolver customer
    // TODO: configura repositoryMock.create para retornar order (mockReturnValue)
    // TODO: configura repositoryMock.save para resolver savedOrder (mockResolvedValue)

    // TODO: ejecuta service.create(data)
    // TODO: comprueba que create recibió los datos y save recibió la entidad construida
    // TODO: comprueba que el resultado es savedOrder
  });

  it("throws NotFoundException when the customer does not exist", async () => {
    // TODO: configura customersRepositoryMock.findOneBy para resolver null
    // TODO: comprueba que service.create({ customerId: 9999, ... })
    //       rechaza con NotFoundException
  });
}
`,
            },
          ],
          solutionFiles: solutions["pruebas-2"],
          tests: hiddenTests["pruebas-2"],
        },
        {
          id: "pruebas-3",
          topicId: "pruebas-mocks",
          order: 3,
          title: "Coordinación: markAsReady y reglas",
          difficulty: "medium",
          minutes: 35,
          summary:
            "Prueba que markAsReady coordina el rules service y que save() NO se ejecuta cuando la regla falla.",
          objectives: [
            "Mockear OrderRulesService y verificar la colaboración",
            "Comprobar que save() recibe la entidad con status 'ready'",
            "Verificar que save() no se llama cuando la regla lanza ConflictException",
          ],
          hints: [
            "orderRulesServiceMock = { ensureCanBeMarkedAsReady: jest.fn() }.",
            "mockImplementation(() => { throw new ConflictException(...) }) simula una regla que falla.",
            "expect(repositoryMock.save).not.toHaveBeenCalled() protege la escritura.",
          ],
          files: [
            {
              path: "src/orders/orders.service.spec.ts",
              language: "typescript",
              content: `import { ConflictException } from "@nestjs/common";
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
        {
          provide: getRepositoryToken(OrderEntity),
          useValue: repositoryMock,
        },
        {
          provide: OrderRulesService,
          useValue: orderRulesServiceMock,
        },
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

    // TODO: configura repositoryMock.findOne para resolver order
    // TODO: configura repositoryMock.save para resolver savedOrder

    // TODO: ejecuta service.markAsReady(4)

    // TODO: comprueba que ensureCanBeMarkedAsReady fue llamado con order
    // TODO: comprueba que save fue llamado con la entidad actualizada (status "ready")
    // TODO: comprueba que el resultado es savedOrder
  });

  it("does not save when the business rule rejects the change", async () => {
    const order = {
      id: 5,
      item: "Espresso",
      quantity: 1,
      status: "ready",
    } as OrderEntity;

    // TODO: configura repositoryMock.findOne para resolver order
    // TODO: configura orderRulesServiceMock.ensureCanBeMarkedAsReady
    //       para lanzar ConflictException con mockImplementation

    // TODO: comprueba que service.markAsReady(5) rechaza con ConflictException
    // TODO: comprueba que repositoryMock.save NO fue llamado
  });
}
`,
            },
          ],
          solutionFiles: solutions["pruebas-3"],
          tests: hiddenTests["pruebas-3"],
        },
      ],
    },
    {
      id: "taller-cine",
      order: 6,
      title: "Taller: una función de cine",
      tagline: "Entidades y una regla de cupo",
      description:
        "Junta lo aprendido: modela una función ligada a una sala y reserva asientos sin pasarte de la capacidad.",
      exercises: [
        {
          id: "taller-1",
          topicId: "taller-cine",
          order: 1,
          title: "La función pertenece a una sala",
          difficulty: "medium",
          minutes: 25,
          summary:
            "Define ScreeningEntity con la película, los asientos ocupados y una relación many-to-one hacia RoomEntity.",
          objectives: [
            "Reutilizar @ManyToOne y @JoinColumn en un modelo nuevo",
            "Nombrar la clave foránea room_id",
            "Marcar la sala como obligatoria",
          ],
          hints: [
            "@ManyToOne(() => RoomEntity, { nullable: false }).",
            "@JoinColumn({ name: 'room_id' }) vive en la tabla de funciones.",
            "movie usa @Column({ length: 120 }) y seatsTaken es un entero.",
          ],
          files: [
            {
              path: "src/screenings/entities/screening.entity.ts",
              language: "typescript",
              content: `import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("screenings")
export class ScreeningEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  // TODO: columna movie, texto, máximo 120 caracteres

  // TODO: columna seatsTaken, entero

  // TODO: relación many-to-one con RoomEntity
  // - propiedad room
  // - nullable: false
  // - clave foránea room_id
}
`,
            },
            {
              path: "src/rooms/entities/room.entity.ts",
              language: "typescript",
              readOnly: true,
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
            },
          ],
          solutionFiles: solutions["taller-1"],
          tests: hiddenTests["taller-1"],
        },
        {
          id: "taller-2",
          topicId: "taller-cine",
          order: 2,
          title: "Reservar sin pasarse del aforo",
          difficulty: "medium",
          minutes: 30,
          summary:
            "Implementa book(): carga la función con su sala, rechaza si no hay cupo y guarda los asientos ocupados.",
          objectives: [
            "Cargar la relación room para leer capacity",
            "Lanzar ConflictException cuando seatsTaken + seats supera el aforo",
            "Persistir el nuevo seatsTaken con save()",
          ],
          hints: [
            "findOne({ where: { id }, relations: { room: true } }).",
            "Si no hay función, NotFoundException.",
            "next > screening.room.capacity → ConflictException('Not enough seats').",
          ],
          files: [
            {
              path: "src/screenings/bookings.service.ts",
              language: "typescript",
              content: `import {
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
    // TODO: busca la función por screeningId e incluye room
    // Si no existe, NotFoundException(
    //   \`Screening with id \${bookSeatsDto.screeningId} was not found\`
    // )

    // TODO: si seatsTaken + seats > room.capacity,
    // lanza ConflictException("Not enough seats")

    // TODO: suma los asientos y guarda con save()
    return {} as ScreeningEntity;
  }
}
`,
            },
            {
              path: "src/screenings/book-seats.dto.ts",
              language: "typescript",
              readOnly: true,
              content: `export class BookSeatsDto {
  screeningId!: number;
  seats!: number;
}
`,
            },
          ],
          solutionFiles: solutions["taller-2"],
          tests: hiddenTests["taller-2"],
        },
      ],
    },
  ],
};

/** Todos los ejercicios aplanados, en orden de track. */
export const allExercises = track.topics.flatMap((topic) =>
  topic.exercises.map((exercise) => ({ ...exercise, topicTitle: topic.title })),
);

export function getExercise(exerciseId: string) {
  return allExercises.find((exercise) => exercise.id === exerciseId);
}

export function getTopic(topicId: string) {
  return track.topics.find((topic) => topic.id === topicId);
}

export const exerciseCount = allExercises.length;
