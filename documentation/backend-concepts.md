# Backend Concepts Explained

Este documento explica conceptos importantes del backend que pueden no ser obvios.

---

## 1. Autenticación: ¿De dónde viene `req.user`?

### El objeto `@Req() req: any`

**NO viene del frontend directamente**. Es inyectado por NestJS después de la autenticación.

### Flujo completo:

```
1. Frontend hace login:
   POST /auth/login
   Body: { email, password }

2. Backend responde con tokens:
   {
     accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     refreshToken: "abc123..."
   }

3. Frontend guarda el accessToken (localStorage/cookie)

4. Frontend incluye token en requests subsiguientes:
   POST /cart/items
   Headers: {
     Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   }

5. Backend procesa:
   ├─ JwtAuthGuard extrae y valida el token
   ├─ JwtStrategy.validate() decodifica el payload
   ├─ El resultado se asigna a req.user
   └─ El controller recibe req con user populado
```

### Código relevante:

**JwtStrategy** (`src/commons/jwt.strategy.ts`):
```typescript
async validate(payload: JwtPayload): Promise<JwtUser> {
  return {
    userId: payload.sub,      // ← Se convierte en req.user.userId
    email: payload.email,      // ← Se convierte en req.user.email
    role: payload.role,        // ← Se convierte en req.user.role
    permissions: payload.permissions,
    isDashboard: payload.isDashboard,
  };
}
```

**En el controller**:
```typescript
@Post()
@Roles(UserRole.USER, UserRole.ADMIN)
async addItem(@Req() req: any, @Body() dto: AddToCartDto) {
  const userId = req.user.userId; // ← Viene del JWT decodificado
  // ...
}
```

### ¿Por qué `any`?

Es una simplificación. Lo correcto sería:

```typescript
interface RequestWithUser extends Request {
  user: JwtUser;
}

@Post()
async addItem(@Req() req: RequestWithUser) {
  const userId = req.user.userId; // ✅ Tipado correcto
}
```

Pero por simplicidad, muchos proyectos usan `any` (aunque no es ideal para producción).

---

## 2. Data Snapshots: ¿Por qué duplicar datos?

### Problema: Referencias vs Copias

**❌ Enfoque ingenuo (solo IDs):**
```typescript
Order {
  userId: "123",
  addressId: "456",           // ← Solo ID
  items: [
    { productId: "789" }      // ← Solo ID
  ]
}
```

**Problemas:**
- Usuario cambia dirección → historial muestra dirección nueva ❌
- Producto cambia precio → historial muestra precio nuevo ❌
- Producto se elimina → no puedes mostrar qué se compró ❌

### ✅ Solución: Data Snapshots

**Guardar una copia completa de los datos al momento de la transacción:**

```typescript
Order {
  userId: "123",

  // Snapshot completo de la dirección
  shippingAddress: {
    fullName: "Juan Pérez",
    street: "Calle Falsa 123",
    city: "Buenos Aires",
    // ... todos los campos
  },

  // Snapshot completo de cada producto
  items: [
    {
      productId: "789",                // Para referencia
      productName: "Remera Oversize",  // Snapshot
      productImage: "...",             // Snapshot
      variantSize: "M",                // Snapshot
      variantColor: "Negro",           // Snapshot
      price: 1000,                     // Precio al momento de compra
      quantity: 2,
      subtotal: 2000
    }
  ]
}
```

### Beneficios:

1. **Historial inmutable**: La orden muestra EXACTAMENTE lo que se compró
2. **Auditoría**: Registro fiel para contabilidad/legal
3. **Independencia**: Aunque se elimine el producto, la orden sigue válida
4. **Facturación**: Precio correcto sin importar cambios futuros
5. **Logística**: Dirección exacta del envío, no la actual del usuario

### Ejemplo real:

```
DÍA 1 (Compra):
Usuario: Juan Pérez
Dirección: Calle Falsa 123, Buenos Aires
Producto: Remera Oversize, Talle M, Negro
Precio: $1,000

SNAPSHOT GUARDADO EN LA ORDEN ✅

DÍA 90 (Futuro):
Usuario cambió nombre: Juan García
Usuario cambió dirección: Avenida Siempre Viva 742
Producto ahora cuesta: $1,500
Producto cambió nombre: "Remera Classic Fit"

HISTORIAL DE ORDEN MUESTRA:
✅ Juan Pérez (nombre al momento de compra)
✅ Calle Falsa 123 (dirección de envío real)
✅ $1,000 (precio pagado real)
✅ "Remera Oversize" (nombre del producto al comprar)
```

### ¿No es redundante?

Sí, **intencionalmente redundante**. En e-commerce, la integridad histórica es más importante que la normalización de datos.

**Analogía:** Es como una fotografía. Captura un momento exacto en el tiempo, aunque las cosas cambien después.

---

## 3. Cart vs Order: ¿Cuál es la diferencia?

### Cart (Carrito)
- **Temporal**: Se puede modificar libremente
- **Mutable**: Items se agregan/quitan/actualizan
- **Sin compromisos**: No afecta stock hasta crear la orden
- **Un carrito por usuario**: Singleton pattern
- **Datos calculados**: Totales calculados on-the-fly

```typescript
Cart {
  userId: "123",
  items: [
    {
      productId: "456",
      variantSKU: "SKU-001",
      quantity: 2,
      priceAtAdd: 1000  // ← Puede cambiar si actualizan el carrito
    }
  ]
  // No decrementar stock aún
}
```

### Order (Orden/Pedido)
- **Permanente**: Registro histórico
- **Inmutable**: Una vez creada, solo cambia el status
- **Con compromisos**: Decrementa stock al crear
- **Múltiples por usuario**: Historial completo
- **Datos snapshot**: Todo copiado al momento de crear

```typescript
Order {
  orderNumber: "ORD-2025-00001",
  userId: "123",
  items: [
    {
      productId: "456",
      productName: "Remera Oversize",  // Snapshot
      price: 1000,                     // Inmutable
      quantity: 2,
      subtotal: 2000
    }
  ],
  shippingAddress: { /* snapshot */ },
  status: "pending",
  total: 2000
  // Stock YA decrementado
}
```

### Transición Cart → Order:

```typescript
async create(userId, createOrderDto) {
  // 1. Leer carrito
  const cart = await this.cartService.getCart(userId);

  // 2. Validar stock
  await this.cartService.validateCartStock(userId);

  // 3. Obtener dirección
  const address = await this.addressService.findById(addressId);

  // 4. Crear orden con snapshots
  const order = new Order({
    items: cart.items.map(item => ({
      ...item,
      // Copiar snapshot completo
    })),
    shippingAddress: { ...address }, // Copiar snapshot
    // ...
  });

  // 5. Decrementar stock
  for (const item of cart.items) {
    await this.productService.decreaseStock(...);
  }

  // 6. Limpiar carrito
  await this.cartService.clearCart(userId);

  return order;
}
```

---

## 4. BaseFilter: Herencia de DTOs

### Patrón de herencia

Para evitar repetir `page`, `limit`, `search` en cada DTO de filtros:

```typescript
// ❌ Malo - Repetición
export class FilterProductDto {
  page?: number = 1;
  limit?: number = 10;
  search?: string;
  category?: string;
  // ...
}

export class FilterOrderDto {
  page?: number = 1;      // ← Repetido
  limit?: number = 10;    // ← Repetido
  search?: string;        // ← Repetido
  status?: string;
}
```

```typescript
// ✅ Bueno - Herencia
export class FilterBaseDto {
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;
}

export class FilterProductDto extends FilterBaseDto {
  @IsOptional()
  category?: string;
  // Solo campos específicos de productos
}

export class FilterOrderDto extends FilterBaseDto {
  @IsOptional()
  status?: string;
  // Solo campos específicos de órdenes
}
```

### Ventajas:
- DRY (Don't Repeat Yourself)
- Cambios centralizados
- Consistencia en paginación
- Menos código

---

## 5. Guards Globales vs Por Endpoint

### Guards globales (configurados en AppModule):

```typescript
providers: [
  {
    provide: APP_GUARD,
    useClass: JwtAuthGuard,  // ← Aplicado a TODOS los endpoints
  },
  {
    provide: APP_GUARD,
    useClass: RolesGuard,    // ← Aplicado a TODOS los endpoints
  }
]
```

**Efecto:** Por defecto, todos los endpoints requieren autenticación.

### Excepciones con decoradores:

```typescript
// Endpoint público (sin autenticación)
@Get('catalog')
@Public()  // ← Bypass JwtAuthGuard
async getCatalog() { }

// Endpoint para usuarios específicos
@Post()
@Roles(UserRole.USER, UserRole.ADMIN)  // ← Verificado por RolesGuard
async create() { }

// Endpoint solo para admin
@Patch(':id/status')
@Roles(UserRole.ADMIN)  // ← Solo admin
async updateStatus() { }
```

### Orden de ejecución:

```
Request
  ↓
JwtAuthGuard
  ├─ ¿Tiene @Public()? → Pasar sin validar
  └─ ¿No? → Validar JWT
      ↓
RolesGuard
  ├─ ¿Tiene @Roles()? → Verificar rol del usuario
  └─ ¿No? → Pasar (requiere auth pero cualquier rol)
      ↓
Controller
```

---

## 6. Mongoose: ObjectId vs String

### En MongoDB:
```json
{
  "_id": ObjectId("507f1f77bcf86cd799439011"),
  "userId": ObjectId("507f191e810c19729de860ea")
}
```

### En TypeScript (Schema):
```typescript
@Prop({ type: Types.ObjectId, ref: 'User' })
userId: Types.ObjectId;  // ← Tipo Mongoose
```

### Conversión en Queries:
```typescript
// ❌ Esto puede fallar
await Model.find({ userId: stringId });

// ✅ Convertir explícitamente
await Model.find({ userId: new Types.ObjectId(stringId) });
```

### En Respuestas API (Mapper):
```typescript
// ❌ No exponer ObjectId directamente
{
  id: product._id  // Tipo complejo
}

// ✅ Convertir a string
{
  id: String(product._id)  // String simple
}
```

---

## 7. Embedded vs Referenced Documents

### Embedded (usado en este proyecto):

```typescript
// Producto tiene variantes embebidas
Product {
  name: "Remera",
  variants: [
    { size: "M", color: "Negro", stock: 50 },
    { size: "L", color: "Negro", stock: 30 }
  ]
}
```

**Ventajas:**
- Lectura rápida (una sola query)
- Atomic updates
- Buen para datos que siempre se usan juntos

**Desventajas:**
- No se puede buscar variantes independientemente
- Límite de 16MB por documento

### Referenced (usado para relaciones):

```typescript
// Usuario tiene órdenes referenciadas
User { _id: "123" }
Order { userId: "123" }  // ← Referencia
Order { userId: "123" }  // ← Referencia
```

**Ventajas:**
- Flexible
- Queries independientes
- No duplica datos

**Desventajas:**
- Requiere múltiples queries o population
- Más complejo

---

## Recursos Adicionales

- [NestJS Guards](https://docs.nestjs.com/guards)
- [Passport JWT](https://docs.nestjs.com/security/authentication)
- [Mongoose Schemas](https://mongoosejs.com/docs/guide.html)
- [Data Snapshots Pattern](https://en.wikipedia.org/wiki/Snapshot_(computer_storage))
