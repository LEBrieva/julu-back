# Referencia de Frontend - Módulo de Productos

Este documento describe cómo podrían verse las pantallas del admin panel para gestionar productos, con referencias a qué endpoints usar en cada caso.

---

## 1. Lista de Productos (Admin)

### UI Propuesta:
```
┌────────────────────────────────────────────────────────────────────────┐
│ PRODUCTOS                                       [+ Nuevo Producto]     │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ Filtros:                                                               │
│ Búsqueda: [___________] Categoría: [Todas ▾] Estado: [Todos ▾]       │
│                                                                         │
│ ┌────────────────────────────────────────────────────────────────┐    │
│ │ Código    │ Nombre           │ Categoría │ Stock │ Estado │ Acciones│
│ ├────────────────────────────────────────────────────────────────┤    │
│ │ REM-001   │ Remera Oversize  │ Remera    │ 100   │ ACTIVO │ [...]  │
│ │ PANT-002  │ Pantalón Jean    │ Pantalón  │ 50    │ ACTIVO │ [...]  │
│ │ BUZ-003   │ Buzo Classic     │ Chaqueta  │ 0     │INACTIVO│ [...]  │
│ └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│ Mostrando 1-10 de 45                          [< 1 2 3 4 5 >]         │
└────────────────────────────────────────────────────────────────────────┘

Menú [...] de acciones:
  ├─ Ver detalle
  ├─ Editar
  ├─ Gestionar inventario
  ├─ Activar/Desactivar
  └─ Ver en catálogo
```

### Endpoints a usar:
```typescript
// Listar productos con filtros
GET /products?page=1&limit=10&search=remera&category=remera&status=active

// Activar/Desactivar desde la lista
PATCH /products/:id/activate
PATCH /products/:id/deactivate
```

---

## 2. Crear/Editar Producto Completo

### UI Propuesta:
```
┌────────────────────────────────────────────────────────────────────────┐
│ EDITAR PRODUCTO                                    [Cancelar] [Guardar]│
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ INFORMACIÓN BÁSICA                                                     │
│ ┌────────────────────────────────────────────────────────────────┐    │
│ │ Código *: [REM-001________________]                            │    │
│ │ Nombre *: [Remera Oversize_________]                           │    │
│ │ Categoría *: [Remera ▾]  Estilo *: [Oversize ▾]               │    │
│ │ Precio base *: [$1000_____]                                    │    │
│ │                                                                │    │
│ │ Descripción:                                                   │    │
│ │ ┌──────────────────────────────────────────────────────────┐  │    │
│ │ │ Remera de algodón 100%, corte oversize, ideal para...   │  │    │
│ │ └──────────────────────────────────────────────────────────┘  │    │
│ │                                                                │    │
│ │ Tags: [streetwear] [algodón] [+]                              │    │
│ │                                                                │    │
│ │ Estado: ( ) Activo  (•) Inactivo  ( ) Sin stock              │    │
│ └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│ IMÁGENES                                                               │
│ ┌────────────────────────────────────────────────────────────────┐    │
│ │ [📷 Imagen 1] [📷 Imagen 2] [📷 Imagen 3] [+ Agregar]        │    │
│ └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│ VARIANTES *                                                            │
│ ┌────────────────────────────────────────────────────────────────┐    │
│ │ Talle │ Color  │ Stock │ Precio │ SKU              │ Acciones  │    │
│ ├────────────────────────────────────────────────────────────────┤    │
│ │ M     │ Negro  │ 50    │ $1000  │ REM-001-M-BLK   │ [Eliminar]│    │
│ │ L     │ Negro  │ 30    │ $1000  │ REM-001-L-BLK   │ [Eliminar]│    │
│ │ M     │ Blanco │ 20    │ $1000  │ REM-001-M-WHT   │ [Eliminar]│    │
│ │                                                                │    │
│ │ [+ Agregar Variante]                                           │    │
│ └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│ * Campos requeridos                                                    │
│                                                                         │
│                                    [Cancelar] [Guardar Cambios]        │
└────────────────────────────────────────────────────────────────────────┘
```

### Endpoints a usar:
```typescript
// Crear producto nuevo (con todas sus variantes)
POST /products
Body: {
  code: "REM-001",
  name: "Remera Oversize",
  category: "remera",
  style: "oversize",
  basePrice: 1000,
  description: "...",
  tags: ["streetwear", "algodón"],
  images: ["url1", "url2"],
  variants: [
    { size: "m", color: "black", stock: 50, price: 1000 },
    { size: "l", color: "black", stock: 30, price: 1000 },
    { size: "m", color: "white", stock: 20, price: 1000 }
  ]
}

// Actualizar producto completo (reemplaza todo)
PATCH /products/:id
Body: {
  name: "Remera Oversize Updated",
  basePrice: 1200,
  variants: [...todasLasVariantesActualizadas],
  // ... resto de campos
}

// Obtener producto para editar
GET /products/findById?id=123
```

**Nota:** Este formulario usa el **approach de actualización completa**. Al guardar, envía todo el producto con todas sus variantes.

---

## 3. Panel de Inventario Rápido

### UI Propuesta:
```
┌────────────────────────────────────────────────────────────────────────┐
│ INVENTARIO - Remera Oversize (REM-001)                     [← Volver]  │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ Stock Total: 100 unidades                                              │
│                                                                         │
│ ┌────────────────────────────────────────────────────────────────┐    │
│ │ SKU              │ Talle │ Color  │ Stock │ Precio │ Acciones  │    │
│ ├────────────────────────────────────────────────────────────────┤    │
│ │ REM-001-M-BLK    │   M   │ Negro  │ [50 ] │ $1000  │ [Editar]  │    │
│ │                  │       │        │       │        │ [+10] [-10]│    │
│ │                  │       │        │       │        │ [Eliminar] │    │
│ ├────────────────────────────────────────────────────────────────┤    │
│ │ REM-001-L-BLK    │   L   │ Negro  │ [30 ] │ $1000  │ [Editar]  │    │
│ │                  │       │        │       │        │ [+10] [-10]│    │
│ │                  │       │        │       │        │ [Eliminar] │    │
│ ├────────────────────────────────────────────────────────────────┤    │
│ │ REM-001-M-WHT    │   M   │ Blanco │ [20 ] │ $1000  │ [Editar]  │    │
│ │                  │       │        │       │        │ [+10] [-10]│    │
│ │                  │       │        │       │        │ [Eliminar] │    │
│ └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│ [+ Agregar Nueva Variante]                                             │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘

Modal "Agregar Variante":
┌──────────────────────────────────┐
│ AGREGAR VARIANTE                 │
├──────────────────────────────────┤
│ Talle: [XS ▾]                    │
│ Color: [Gris ▾]                  │
│ Stock inicial: [0__]             │
│ Precio: [$1000_____]             │
│                                  │
│        [Cancelar] [Agregar]      │
└──────────────────────────────────┘

Modal "Editar Variante":
┌──────────────────────────────────┐
│ EDITAR VARIANTE                  │
│ SKU: REM-001-M-BLK              │
├──────────────────────────────────┤
│ Stock: [50__]                    │
│ Precio: [$1000_____]             │
│                                  │
│        [Cancelar] [Guardar]      │
└──────────────────────────────────┘
```

### Endpoints a usar:
```typescript
// Obtener producto
GET /products/findById?id=123

// Botones [+10] / [-10]
PATCH /products/:id/variants/:sku/increase-stock
Body: { quantity: 10 }

PATCH /products/:id/variants/:sku/decrease-stock
Body: { quantity: 10 }

// Editar stock manualmente (cambiar el input y guardar)
PATCH /products/:id/variants/:sku/stock
Body: { stock: 50 }

// Agregar nueva variante
POST /products/:id/variants
Body: {
  size: "xs",
  color: "gray",
  stock: 0,
  price: 1000
}

// Editar variante (modal)
PATCH /products/:id/variants/:sku
Body: {
  stock: 55,
  price: 1200
}

// Eliminar variante
DELETE /products/:id/variants/:sku
```

**Nota:** Este panel usa los **endpoints granulares** para operaciones rápidas sin tener que cargar/actualizar todo el producto.

---

## 4. Vista de Detalle de Producto (Admin)

### UI Propuesta:
```
┌────────────────────────────────────────────────────────────────────────┐
│ DETALLE DE PRODUCTO                    [Editar] [Gestionar Inventario]│
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ ┌─────────────────┐  Remera Oversize                                  │
│ │                 │  Código: REM-001                                   │
│ │   [📷 Imagen]   │  Estado: ● ACTIVO                                  │
│ │                 │                                                    │
│ └─────────────────┘  Categoría: Remera | Estilo: Oversize             │
│ [📷][📷][📷]        Precio base: $1000                                 │
│                                                                         │
│ Descripción:                                                           │
│ Remera de algodón 100%, corte oversize, ideal para uso diario.        │
│ Disponible en varios talles y colores.                                │
│                                                                         │
│ Tags: #streetwear #algodón #verano                                     │
│                                                                         │
│ ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│ VARIANTES DISPONIBLES                                                  │
│ ┌────────────────────────────────────────────────────────────────┐    │
│ │ SKU              │ Talle │ Color  │ Stock │ Precio │           │    │
│ ├────────────────────────────────────────────────────────────────┤    │
│ │ REM-001-M-BLK    │   M   │ Negro  │  50   │ $1000  │           │    │
│ │ REM-001-L-BLK    │   L   │ Negro  │  30   │ $1000  │           │    │
│ │ REM-001-M-WHT    │   M   │ Blanco │  20   │ $1000  │           │    │
│ └────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│ Stock Total: 100 unidades                                              │
│                                                                         │
│ ─────────────────────────────────────────────────────────────────────  │
│                                                                         │
│ INFORMACIÓN ADICIONAL                                                  │
│ Creado: 15/10/2025 14:30                                               │
│ Última actualización: 20/10/2025 09:15                                │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

### Endpoints a usar:
```typescript
// Obtener producto completo
GET /products/findById?id=123

// O buscar por código
GET /products/findByCode?code=REM-001
```

---

## 5. Catálogo Público (Cliente)

### UI Propuesta:
```
┌────────────────────────────────────────────────────────────────────────┐
│ 🛍️  TIENDA                                        [🛒 Carrito (3)]    │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ Buscar: [_____________] Categoría: [Todas ▾] Ordenar: [Novedad ▾]     │
│                                                                         │
│ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│ │   [📷]      │  │   [📷]      │  │   [📷]      │  │   [📷]      │  │
│ │             │  │             │  │             │  │             │  │
│ │ Remera      │  │ Pantalón    │  │ Buzo        │  │ Zapatillas  │  │
│ │ Oversize    │  │ Jean        │  │ Classic     │  │ Urbanas     │  │
│ │             │  │             │  │             │  │             │  │
│ │ $1000       │  │ $3500       │  │ $2500       │  │ $5000       │  │
│ │ [Ver más]   │  │ [Ver más]   │  │ [Ver más]   │  │ [Ver más]   │  │
│ └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │
│                                                                         │
│ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│ │   [📷]      │  │   [📷]      │  │   [📷]      │  │   [📷]      │  │
│ └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │
│                                                                         │
│ Mostrando 1-8 de 45 productos              [< 1 2 3 4 5 >]            │
└────────────────────────────────────────────────────────────────────────┘
```

### Endpoints a usar:
```typescript
// Listar productos del catálogo (solo ACTIVOS, sin autenticación)
GET /products/catalog?page=1&limit=12&category=remera&search=oversize

// No requiere token de autenticación - endpoint público
```

---

## 6. Detalle de Producto Público (Cliente)

### UI Propuesta:
```
┌────────────────────────────────────────────────────────────────────────┐
│ 🛍️  TIENDA > Remera Oversize                     [🛒 Carrito (3)]    │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ ┌──────────────────────┐                                              │
│ │                      │  Remera Oversize                              │
│ │    [📷 Imagen]       │                                               │
│ │     Principal        │  $1000                                        │
│ │                      │  ⭐⭐⭐⭐⭐ (24 reseñas)                      │
│ └──────────────────────┘                                              │
│ [📷] [📷] [📷] [📷]     Descripción:                                  │
│                         Remera de algodón 100%, corte oversize,       │
│                         ideal para uso diario. Disponible en          │
│                         varios talles y colores.                      │
│                                                                         │
│                         ─────────────────────────────────────────      │
│                                                                         │
│                         Seleccionar opciones:                          │
│                                                                         │
│                         Talle: ( ) M  ( ) L  ( ) XL                   │
│                         Color: ( ) Negro  ( ) Blanco  ( ) Gris        │
│                                                                         │
│                         Cantidad: [-] 1 [+]                            │
│                                                                         │
│                         Stock disponible: 50 unidades                  │
│                                                                         │
│                         [Agregar al Carrito]  [Comprar Ahora]          │
│                                                                         │
│                         #streetwear #algodón #verano                   │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

### Endpoints a usar:
```typescript
// Obtener detalle del producto (sin autenticación)
GET /products/catalog/:id

// Verificar stock antes de agregar al carrito (opcional)
// Este endpoint existe en el backend pero es interno (ADMIN)
// El frontend puede validar con el stock que viene en la respuesta
```

---

## 7. Service/Hook de Frontend (Ejemplo)

```typescript
// services/product.service.ts

export class ProductService {

  // ========== OPERACIONES ADMIN ==========

  // Lista y filtros
  async listProducts(filters: ProductFilters) {
    return api.get('/products', { params: filters });
  }

  async getProductById(id: string) {
    return api.get(`/products/findById?id=${id}`);
  }

  async getProductByCode(code: string) {
    return api.get(`/products/findByCode?code=${code}`);
  }

  // CRUD completo
  async createProduct(data: CreateProductDto) {
    return api.post('/products', data);
  }

  async updateProduct(id: string, data: UpdateProductDto) {
    return api.patch(`/products/${id}`, data);
  }

  // Activación
  async activateProduct(id: string) {
    return api.patch(`/products/${id}/activate`);
  }

  async deactivateProduct(id: string) {
    return api.patch(`/products/${id}/deactivate`);
  }

  // Variantes granulares
  async addVariant(productId: string, variant: AddVariantDto) {
    return api.post(`/products/${productId}/variants`, variant);
  }

  async updateVariant(productId: string, sku: string, data: UpdateVariantDto) {
    return api.patch(`/products/${productId}/variants/${sku}`, data);
  }

  async removeVariant(productId: string, sku: string) {
    return api.delete(`/products/${productId}/variants/${sku}`);
  }

  // Stock
  async setStock(productId: string, sku: string, stock: number) {
    return api.patch(`/products/${productId}/variants/${sku}/stock`, { stock });
  }

  async increaseStock(productId: string, sku: string, quantity: number) {
    return api.patch(`/products/${productId}/variants/${sku}/increase-stock`, { quantity });
  }

  async decreaseStock(productId: string, sku: string, quantity: number) {
    return api.patch(`/products/${productId}/variants/${sku}/decrease-stock`, { quantity });
  }

  // ========== OPERACIONES PÚBLICAS (catálogo) ==========

  async getCatalog(filters: CatalogFilters) {
    return api.get('/products/catalog', { params: filters });
  }

  async getCatalogProduct(id: string) {
    return api.get(`/products/catalog/${id}`);
  }
}
```

---

## 8. Flujos de Usuario Recomendados

### Flujo Admin - Crear Producto:
1. Click en [+ Nuevo Producto]
2. Completar formulario con info básica
3. Agregar variantes (mínimo 1 requerida)
4. Guardar → `POST /products`
5. Redirigir a lista o detalle

### Flujo Admin - Actualizar Stock Rápido:
1. Desde lista, click en "Gestionar inventario"
2. Ver panel con todas las variantes
3. Click en [+10] → `PATCH /products/:id/variants/:sku/increase-stock`
4. Stock se actualiza en tiempo real
5. No necesita "guardar" general

### Flujo Admin - Editar Producto Completo:
1. Desde lista, click en "Editar"
2. Cargar formulario con datos → `GET /products/findById`
3. Modificar cualquier campo (nombre, precio, variantes, etc.)
4. Guardar todo → `PATCH /products/:id` (con todo el payload)

### Flujo Cliente - Comprar:
1. Ver catálogo → `GET /products/catalog`
2. Click en producto → `GET /products/catalog/:id`
3. Seleccionar talle, color, cantidad
4. Agregar al carrito (lógica local, todavía no decrementas stock)
5. Al finalizar compra → Llamar a `decreaseStock` desde el backend

---

## 9. Consideraciones de UX

### Para el Admin:
- **Lista de productos**: Mostrar stock total, estado visual claro (badge/chip)
- **Filtros persistentes**: Guardar en URL o localStorage
- **Acciones rápidas**: Activar/desactivar desde la lista
- **Panel de inventario**: Botones [+10][-10] para ajustes rápidos comunes
- **Validaciones en tiempo real**: Verificar código único, SKUs, etc.

### Para el Cliente:
- **Solo productos activos**: El catálogo filtra automáticamente
- **Indicar disponibilidad**: "Últimas unidades", "Sin stock"
- **Imágenes de calidad**: Primera impresión importa
- **Filtros simples**: No abrumar con opciones de admin

---

## 10. Notas Técnicas

### DTOs de TypeScript (para el frontend):

```typescript
// Tipos para requests
export interface CreateProductDto {
  code: string;
  name: string;
  category: ProductCategory;
  style: ProductStyle;
  basePrice: number;
  description?: string;
  tags?: string[];
  images?: string[];
  variants: CreateVariantDto[];
}

export interface CreateVariantDto {
  size: ProductSize;
  color: ProductColor;
  stock: number;
  price: number;
}

export interface UpdateProductDto {
  name?: string;
  code?: string;
  description?: string;
  basePrice?: number;
  category?: ProductCategory;
  style?: ProductStyle;
  variants?: UpdateVariantDto[];
  status?: ProductStatus;
  tags?: string[];
  images?: string[];
}

export interface AddVariantDto {
  size: ProductSize;
  color: ProductColor;
  stock: number;
  price: number;
}

export interface UpdateSingleVariantDto {
  stock?: number;
  price?: number;
}

// Tipos para responses
export interface ProductResponse {
  id: string;
  code: string;
  name: string;
  description?: string;
  basePrice: number;
  images?: string[];
  variants: VariantResponse[];
  status: ProductStatus;
  category: ProductCategory;
  style: ProductStyle;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface VariantResponse {
  sku: string;
  size: string;
  color: string;
  stock: number;
  price: number;
}

// Enums (deben coincidir con el backend)
export enum ProductStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  OUT_OF_STOCK = 'out_of_stock',
}

export enum ProductCategory {
  REMERA = 'remera',
  PANTALON = 'pantalon',
  CHAQUETA = 'chaqueta',
  ZAPATILLAS = 'zapatillas',
  BOTAS = 'botas',
  SHORTS = 'shorts',
  VESTIDO = 'vestido',
  BLUSA = 'blusa',
}

export enum ProductSize {
  XS = 'xs',
  S = 's',
  M = 'm',
  G = 'g',
  GG = 'gg',
  XXL = 'xxl',
}

export enum ProductColor {
  BLACK = 'black',
  WHITE = 'white',
  GRAY = 'gray',
  NAVY = 'navy',
  RED = 'red',
  BLUE = 'blue',
}
```

---

## Resumen

Este documento te da una referencia visual de cómo podrían organizarse las pantallas en el frontend. La clave es:

1. **Formulario completo** → Usa `PATCH /products/:id` con todo
2. **Gestión rápida de inventario** → Usa endpoints granulares de variantes
3. **Catálogo público** → Usa endpoints `/products/catalog`

Cada approach tiene su lugar según el caso de uso. Elige el que mejor se adapte a cada pantalla.
