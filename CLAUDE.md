# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a NestJS-based e-commerce backend for a t-shirt/apparel brand. The application uses MongoDB (Mongoose) for data persistence, implements JWT-based authentication with refresh tokens, and follows role-based authorization patterns.

## Essential Commands

### Development
```bash
# Install dependencies (project uses pnpm)
pnpm install

# Start development server with watch mode
pnpm run start:dev

# Build the project
pnpm run build

# Production start
pnpm run start:prod
```

### Testing
```bash
# Run all unit tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Run specific test file
pnpm run test -- user.service.spec.ts

# Run e2e tests
pnpm run test:e2e

# Generate coverage report
pnpm run test:cov
```

### Code Quality
```bash
# Run ESLint with auto-fix
pnpm run lint

# Format code with Prettier
pnpm run format
```

## Architecture

### Module Structure

The application follows NestJS modular architecture with clear domain separation:

- **auth/** - Authentication & authorization (login, refresh tokens, JWT strategy)
- **user/** - User management (CRUD operations, role/status handling)
- **product/** - Product catalog (products with variants, categories, styles)
- **address/** - Shipping addresses management (CRUD, default address handling)
- **cart/** - Shopping cart functionality (add/update/remove items, stock validation)
- **order/** - Order processing (create from cart, status tracking, order history)
- **commons/** - Shared utilities (guards, decorators, DTOs, interfaces, strategies)

### Authentication Flow

The application implements an **Access Token + Refresh Token** strategy:

1. **Access Tokens**: JWT tokens with 60-minute expiration used for API authentication
2. **Refresh Tokens**: Randomly generated tokens stored in MongoDB with 7-day expiration
3. **Token Rotation**: Clients use refresh tokens to obtain new access tokens without re-authentication
4. **Revocation Support**: Refresh tokens can be revoked individually or globally per user

Key implementation details:
- JWT secret configured via `JWT_SECRET` environment variable
- Refresh token schema includes metadata (userAgent, ipAddress, isRevoked flag)
- TTL index on refresh tokens for automatic cleanup after expiration
- See `documentation/refresh-token-strategy.md` for detailed strategy documentation

### Authorization System

Currently implements **role-based authorization** with plans for permission-based granularity:

- **Roles**: Defined in `src/user/user.enum.ts` (ADMIN, USER)
- **Guards**: `JwtAuthGuard` (authentication) and `RolesGuard` (authorization) applied globally
- **Decorators**:
  - `@Public()` - Skip authentication for public endpoints
  - `@Roles(UserRole.ADMIN)` - Restrict access by role
- **Future**: Permission-based authorization planned (see `documentation/permission-based-authorization.md`)

### Data Models

**User Schema** (`src/user/user.schema.ts`):
- Email (unique), password (bcrypt hashed)
- Role (USER/ADMIN) and status (ACTIVE/INACTIVE/SUSPENDED)
- Email verification, last login tracking
- Indexed on: email, role, status

**Product Schema** (`src/product/schemas/product.schema.ts`):
- Code (unique identifier), name, basePrice, description
- Images array, tags array
- **Variants**: Nested schema with size, color, stock, SKU, priceModifier
- **Category**: Enum (CAMISETAS, BUZOS, PANTALONES, ACCESORIOS, OTROS)
- **Style**: Enum (OVERSIZE, REGULAR, SLIM_FIT, CASUAL, DEPORTIVO, FORMAL, STREETWEAR, VINTAGE, MINIMALISTA)
- **Status**: ACTIVE, INACTIVE, DISCONTINUED, COMING_SOON
- Indexed on: code, name/description (text search), status, category, style, variant fields

**RefreshToken Schema** (`src/auth/auth.schema.ts`):
- Token (unique), userId reference
- Expiration timestamp, revocation flag
- UserAgent and IP tracking for security audit
- TTL index for automatic cleanup

**Address Schema** (`src/address/address.schema.ts`):
- userId reference (indexed)
- fullName, street, city, state, zipCode, country, phone
- isDefault flag (only one per user)
- Indexed on: userId + isDefault

**Cart Schema** (`src/cart/cart.schema.ts`):
- userId reference (unique - one cart per user)
- items array with embedded CartItem schema
- CartItem includes: productId, variantSKU, quantity, priceAtAdd, product snapshot (name, image, size, color)
- Totals calculated on-the-fly in mapper

**Order Schema** (`src/order/order.schema.ts`):
- orderNumber (unique, auto-generated: ORD-YYYY-NNNNN)
- userId reference (indexed)
- items array with embedded OrderItem schema (product snapshot at purchase time)
- shippingAddress (embedded snapshot of address)
- subtotal, shippingCost, total
- status: pending, paid, processing, shipped, delivered, cancelled
- paymentMethod and paymentStatus
- Indexed on: userId + createdAt, orderNumber, status, paymentStatus

### DTOs & Validation

- **class-validator**: All DTOs use decorators for validation (`@IsEmail`, `@IsString`, `@Min`, etc.)
- **class-transformer**: Global transformation pipe enabled in `main.ts`
- **Validation Settings**: `whitelist: true`, `forbidNonWhitelisted: true` (strips unknown properties)
- **Pagination**: Standard pagination pattern in filter DTOs (page, limit, sortBy, sortOrder)
- **Response Mappers**: Dedicated mapper classes (`user.mapper.ts`, `product.mapper.ts`) separate domain models from API responses

### Common Patterns

**Filter/Search Pattern**:
```typescript
// BaseFilter interface provides standard pagination
interface BaseFilter {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Domain-specific filters extend BaseFilter
class FilterProductDto extends BaseFilter {
  code?: string;
  category?: ProductCategory;
  style?: ProductStyle;
  status?: ProductStatus;
  search?: string; // Text search on name/description
  minPrice?: number;
  maxPrice?: number;
}
```

**Response Transformation**:
- Never expose internal MongoDB `_id` or sensitive fields
- Use mapper classes to transform documents to response DTOs
- Paginated responses follow consistent structure: `{ data: [], total: number, page: number, limit: number }`

**Error Handling**:
- Use NestJS built-in HTTP exceptions (`NotFoundException`, `BadRequestException`, `UnauthorizedException`)
- Mongoose errors are caught and transformed into appropriate HTTP responses

## Environment Variables

Required variables in `.env`:
```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
PORT=3000
```

## Important Notes

### Security Considerations

- Passwords are hashed using bcrypt before storage
- JWT tokens are stateless but short-lived (60 minutes)
- Refresh tokens are stored in database for revocation capability
- Global authentication guard requires explicit `@Public()` decorator to bypass
- CORS is enabled globally - configure origins for production

### E-commerce Flow

The application implements a complete e-commerce purchase flow:

1. **Browse Catalog**: Public endpoints show active products (`GET /products/catalog`)
2. **Add to Cart**: Authenticated users add items to cart with stock validation (`POST /cart/items`)
3. **Manage Cart**: Users can update quantities, remove items, or clear cart
4. **Shipping Address**: Users manage delivery addresses, one marked as default
5. **Create Order**: Order created from cart, decrements stock, clears cart (`POST /orders`)
6. **Order Management**: Users track orders, admins update status, users can cancel pending orders
7. **Stock Control**: Stock automatically managed during order creation/cancellation

### Product Variants

Products use an embedded variant pattern (not separate collection):
- Each product has an array of variants (size/color combinations)
- Each variant tracks its own stock level and can have price modifiers
- SKU generation should be unique per variant
- Stock updates operate on variant level, not product level

### Cart & Order Workflow

**Cart Behavior:**
- One cart per user (singleton pattern)
- Items include snapshot of product data to avoid extra queries
- Stock validated on add/update operations
- Endpoint to validate entire cart before checkout

**Order Creation:**
- Validates cart is not empty
- Validates stock availability for all items
- Retrieves shipping address
- Creates order with product/address snapshots (historical data)
- Decrements stock for all items
- Clears user's cart
- Generates unique order number (ORD-YYYY-NNNNN)

**Order Cancellation:**
- Only pending orders can be cancelled by users
- Stock is returned to products automatically
- Order status changed to cancelled (not deleted)

### Validation & Transformation

All incoming requests are:
1. Validated against DTO schemas (class-validator)
2. Transformed to typed instances (class-transformer)
3. Stripped of non-whitelisted properties (forbidNonWhitelisted: true)

### Module Dependencies

- `UsersModule` is imported by `AuthModule` (auth needs user service)
- `commons/` contains shared code used across all modules
- Guards and strategies registered globally in `AppModule`
- ConfigModule is global - no need to re-import in feature modules

### Code Organization

- **Schemas**: Mongoose models with decorator-based definitions
- **DTOs**: Input validation (create/update) and filtering
- **Interfaces**: TypeScript types for business logic
- **Mappers**: Transform domain entities to API responses
- **Services**: Business logic and database operations
- **Controllers**: HTTP routing and request/response handling

## TypeScript Configuration

- Uses `nodenext` module resolution for modern Node.js compatibility
- Decorators enabled (`experimentalDecorators`, `emitDecoratorMetadata`)
- Strict null checks enabled but lenient on implicit any
- Source maps enabled for debugging

## Testing Notes

- Jest configured with ts-jest transformer
- Test files use `.spec.ts` extension
- Root directory for tests is `src/` (unit tests co-located with source)
- E2e tests have separate config in `test/jest-e2e.json`
- Coverage directory: `coverage/`
