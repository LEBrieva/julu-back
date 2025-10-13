# API Endpoints Reference

## Authentication

### Public Endpoints
- `POST /auth/login` - User login (returns access + refresh tokens)
- `POST /auth/refresh` - Refresh access token using refresh token

### Protected Endpoints
- `POST /auth/logout` - Logout and revoke refresh token
- `POST /auth/logout-all` - Logout from all devices

---

## Users

### Admin Only
- `POST /users` - Create user (Admin)
- `GET /users` - List all users with filters (Admin)
- `GET /users/:id` - Get user by ID (Admin)
- `PATCH /users/:id` - Update user (Admin)
- `DELETE /users/:id` - Delete user (Admin)

---

## Products

### Admin Only
- `POST /products` - Create product
- `GET /products` - List all products (admin view with all statuses)
- `GET /products/findById?id=` - Get product by ID
- `GET /products/findByCode?code=` - Get product by code
- `PATCH /products/:id` - Update product
- `PATCH /products/:id/activate` - Activate product
- `PATCH /products/:id/deactivate` - Deactivate product

**Variant Management:**
- `POST /products/:id/variants` - Add variant to product
- `PATCH /products/:id/variants/:sku` - Update specific variant
- `DELETE /products/:id/variants/:sku` - Remove variant

**Stock Management:**
- `PATCH /products/:id/variants/:sku/stock` - Set stock
- `PATCH /products/:id/variants/:sku/increase-stock` - Increase stock
- `PATCH /products/:id/variants/:sku/decrease-stock` - Decrease stock

### Public Endpoints
- `GET /products/catalog` - View active products catalog (public)
- `GET /products/catalog/:id` - View product detail (public)

---

## Addresses

### User/Admin
- `POST /addresses` - Create address
- `GET /addresses` - List user's addresses
- `GET /addresses/:id` - Get address by ID
- `PATCH /addresses/:id` - Update address
- `DELETE /addresses/:id` - Delete address (requires at least one remaining)
- `PATCH /addresses/:id/set-default` - Mark address as default

---

## Cart

### User/Admin
- `GET /cart` - Get current cart
- `POST /cart/items` - Add item to cart
- `PATCH /cart/items/:index` - Update item quantity
- `DELETE /cart/items/:index` - Remove item from cart
- `DELETE /cart` - Clear entire cart
- `GET /cart/validate` - Validate cart stock before checkout

---

## Orders

### User/Admin
- `POST /orders` - Create order from cart
- `GET /orders` - List orders (user sees own, admin sees all)
- `GET /orders/:id` - Get order detail
- `PATCH /orders/:id/cancel` - Cancel order (only if pending)

### Admin Only
- `PATCH /orders/:id/status` - Update order status

---

## Query Parameters

### Pagination (most list endpoints)
- `page` (default: 1)
- `limit` (default: 10)

### Product Filters
- `search` - Text search on name/description
- `category` - Filter by category
- `style` - Filter by style
- `status` - Filter by status (admin only)
- `size` - Filter by variant size
- `color` - Filter by variant color
- `code` - Filter by product code

### Order Filters
- `status` - Filter by order status
- `paymentStatus` - Filter by payment status

---

## Response Formats

### Success Response (Single Resource)
```json
{
  "id": "string",
  "field1": "value",
  "field2": "value"
}
```

### Success Response (Paginated List)
```json
{
  "data": [ /* array of resources */ ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

### Error Response
```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request"
}
```

---

## Authentication

All protected endpoints require:
```
Authorization: Bearer <access_token>
```

Access tokens expire after 60 minutes. Use the refresh token endpoint to get a new access token.

---

## Enums

### User
- **Role**: `user`, `admin`
- **Status**: `active`, `inactive`, `suspended`

### Product
- **Status**: `active`, `inactive`, `out_of_stock`
- **Category**: `remera`, `pantalon`, `chaqueta`, `zapatillas`, `botas`, `shorts`, `vestido`, `blusa`
- **Size**: `xs`, `s`, `m`, `g`, `gg`, `xxl`
- **Color**: `black`, `white`, `gray`, `navy`, `red`, `blue`

### Order
- **Status**: `pending`, `paid`, `processing`, `shipped`, `delivered`, `cancelled`
- **PaymentStatus**: `pending`, `completed`, `failed`, `refunded`
- **PaymentMethod**: `credit_card`, `debit_card`, `mercado_pago`, `cash_on_delivery`
