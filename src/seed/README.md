# 🌱 Seed Script - Datos de Prueba

Este módulo genera datos de prueba para la base de datos del e-commerce.

## 📦 Datos que se Crean

### Usuarios (5)
- **Admin**: `admin@ecommerce.com` / `password123`
- **Users**:
  - `user1@example.com` / `password123` (João Silva)
  - `user2@example.com` / `password123` (Maria Santos)
  - `user3@example.com` / `password123` (Pedro Oliveira)
  - `user4@example.com` / `password123` (Ana Costa)

### Productos (5)
- 2 Camisetas (Oversize y Regular)
- 2 Buzos (Streetwear y Minimalista)
- 1 Pantalón (Casual)

Cada producto tiene múltiples variantes (tallas y colores) con stock.

### Direcciones (4)
Una dirección por usuario (excepto admin), todas en São Paulo, Brasil.

### Órdenes (30)
- Distribuidas en los últimos 30 días
- Estados variados: pending, paid, processing, shipped, delivered, cancelled
- Métodos de pago: PIX, tarjeta de crédito, tarjeta de débito
- 1-3 productos por orden

## 🚀 Cómo Usar

### Opción 1: Via API (Recomendado)

```bash
# Ejecutar seed
curl -X POST http://localhost:3000/seed
```

O desde el navegador:
```
http://localhost:3000/seed
```

### Opción 2: Via Postman/Thunder Client

```
POST http://localhost:3000/seed
```

## ⚠️ Importante

- **Este endpoint LIMPIA toda la base de datos** antes de insertar los nuevos datos
- Solo usar en **desarrollo/testing**, NUNCA en producción
- El endpoint está marcado como `@Public()` para facilitar el testing

## 📊 Resultado Esperado

```json
{
  "message": "Base de datos poblada exitosamente",
  "data": {
    "users": 5,
    "products": 5,
    "addresses": 4,
    "orders": 30
  }
}
```

## 🧪 Testing

Después de ejecutar el seed, puedes:

1. **Login como admin**:
   - Email: `admin@ecommerce.com`
   - Password: `password123`

2. **Ver órdenes** en el panel admin:
   - Navega a `/admin/orders`
   - Filtra por estado, fecha, etc.
   - Haz clic en una orden para ver el detalle

3. **Login como usuario**:
   - Email: `user1@example.com` (o user2, user3, user4)
   - Password: `password123`

## 🔒 Seguridad

Para **producción**, se recomienda:
1. Eliminar el SeedModule del AppModule
2. O proteger el endpoint con guards de admin
3. O usar variables de entorno para habilitarlo solo en dev

```typescript
// seed.controller.ts
@Post()
@Roles(UserRole.ADMIN) // Solo admin puede ejecutar
async seed() {
  // ...
}
```
