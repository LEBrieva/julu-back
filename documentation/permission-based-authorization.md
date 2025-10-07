# Sistema de Autorización Basado en Permisos

## 📋 Resumen Ejecutivo

Este documento describe la migración del sistema de autorización de **roles simples** a **permisos granulares** para el ecommerce de remeras. El objetivo es proporcionar un control de acceso más flexible y escalable sin agregar complejidad innecesaria.

## 🔄 Evolución: De Roles a Permisos

### Estado Actual (Role-based)
```typescript
// Verificación simple por rol
@Roles(UserRole.ADMIN)
@Get('/users')
findAllUsers() { ... }

// Permisos hardcodeados en código
const permissions = {
  [UserRole.ADMIN]: ['users:read', 'users:write', 'users:delete'],
  [UserRole.USER]: ['profile:read', 'profile:write']
};
```

### Estado Objetivo (Permission-based)
```typescript
// Verificación granular por permiso específico
@Permissions('users:read')
@Get('/users')
findAllUsers() { ... }

// Flexibilidad para combinar permisos
@Permissions('users:write', 'inventory:manage')
@Post('/users/:id/reset-inventory')
resetUserInventory() { ... }
```

## ✅ Beneficios del Sistema de Permisos

### 1. **Granularidad Precisa**
- **Antes:** Un admin tiene TODO el acceso
- **Después:** Puedes dar acceso solo a lo que necesita

```typescript
// Ejemplo: Empleado que solo maneja inventario
const empleadoInventario = {
  role: 'employee',
  permissions: ['products:read', 'inventory:manage', 'orders:read']
  // NO tiene users:delete ni settings:write
};
```

### 2. **Flexibilidad para Casos Específicos**
Perfecto para tu marca de remeras cuando crezca:

```typescript
// Fotógrafo freelance: solo puede subir imágenes de productos
const fotografo = {
  permissions: ['products:read', 'media:upload', 'media:manage']
};

// Community Manager: solo redes y contenido
const communityManager = {
  permissions: ['content:write', 'social:manage', 'analytics:read']
};

// Contador: solo reportes y finanzas
const contador = {
  permissions: ['orders:read', 'analytics:read', 'reports:export']
};
```

### 3. **Escalabilidad Sin Refactoring**
Cuando agregues nuevos módulos, solo extiendes permisos:

```typescript
// Nuevos módulos = nuevos permisos
const PERMISSIONS = {
  // Existentes
  'users:read', 'users:write', 'users:delete',
  
  // Productos (futuro)
  'products:read', 'products:write', 'products:delete',
  'inventory:manage', 'categories:manage',
  
  // Marketing (futuro)  
  'campaigns:read', 'campaigns:write',
  'coupons:manage', 'newsletters:send',
  
  // Analytics (futuro)
  'analytics:read', 'reports:export',
  'sales:analytics', 'customer:analytics'
};
```

### 4. **Control de Acceso Temporal**
```typescript
// Ejemplo: Acceso temporal para auditoría externa
const auditor = {
  permissions: ['orders:read', 'users:read', 'analytics:read'],
  expiresAt: '2025-12-31' // Se pueden revocar automáticamente
};
```

### 5. **Testing y Debugging Más Fácil**
```typescript
// Test específico: ¿puede un empleado ver pero no modificar usuarios?
const testUser = { permissions: ['users:read'] };
expect(can(testUser, 'users:read')).toBe(true);
expect(can(testUser, 'users:write')).toBe(false);
```

## ❌ Desventajas y Consideraciones

### 1. **Complejidad Inicial**
- Más código para mantener
- Más decisiones que tomar al crear endpoints
- Curva de aprendizaje para el equipo

### 2. **Overhead de Performance Mínimo**
```typescript
// Cada request verifica array de permisos
return requiredPermissions.some(permission => 
  user.permissions.includes(permission)
);
```

### 3. **Gestión de Permisos**
- Necesitas interfaz para asignar/revocar permisos
- Documentación de qué hace cada permiso
- Auditoría de quién tiene qué acceso

### 4. **Posible Over-Engineering**
Para un ecommerce personal pequeño, podría ser excesivo inicialmente.

## 🎯 Recomendación para Tu Caso (Marca de Remeras)

### **Fase 1: Mantener Roles (actual)** ✅
**¿Cuándo?** Mientras seas solo vos manejando todo
```typescript
// Perfecto para MVP
ADMIN: todas las operaciones
USER: solo perfil propio
```

### **Fase 2: Híbrido (recomendado)** 🚀
**¿Cuándo?** Cuando contrates primera persona o tengas 3+ módulos

```typescript
// Lo mejor de ambos mundos
@Controller('products')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProductsController {
  
  @Get()
  @Permissions('products:read') // Granular cuando importa
  findAll() { ... }
  
  @Delete(':id')
  @Roles(UserRole.ADMIN) // Simple cuando es obvio que solo admin
  remove() { ... }
}
```

### **Fase 3: Full Permissions (futuro)** 🔮
**¿Cuándo?** Con equipo grande o multi-tenant

## 🛠️ Implementación Paso a Paso

### Paso 1: Crear Guards y Decoradores
```bash
src/commons/guards/permissions.guard.ts
src/commons/decorators/permissions.decorator.ts
```

### Paso 2: Definir Constantes de Permisos
```typescript
// src/commons/constants/permissions.ts
export const PERMISSIONS = {
  // Users
  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',
  USERS_DELETE: 'users:delete',
  
  // Products (para cuando los agregues)
  PRODUCTS_READ: 'products:read',
  PRODUCTS_WRITE: 'products:write',
  // ...
} as const;
```

### Paso 3: Migrar Controllers Gradualmente
```typescript
// Antes
@Roles(UserRole.ADMIN)

// Después  
@Permissions(PERMISSIONS.USERS_READ)
```

### Paso 4: UI para Gestión (opcional)
Interface administrativa para asignar permisos a usuarios.

## 📊 Comparación de Enfoques

| Aspecto | Roles Simples | Permisos Granulares |
|---------|---------------|---------------------|
| **Simplicidad** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Flexibilidad** | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Escalabilidad** | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Performance** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Mantenimiento** | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Curva Aprendizaje** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

## 🚀 Próximos Pasos Recomendados

1. **Inmediato:** Mantener sistema actual de roles
2. **Mes 1-2:** Implementar PermissionsGuard como alternativa
3. **Mes 3:** Migrar endpoints críticos a permisos granulares
4. **Mes 6:** Evaluar migración completa según crecimiento del negocio

## 💡 Casos de Uso Específicos para Ecommerce

### Escenario 1: Contratar Diseñador
```typescript
const diseñador = {
  permissions: [
    'products:read',
    'media:upload', 
    'media:manage',
    'categories:read'
  ]
};
// Puede ver productos y gestionar imágenes, pero no precios ni inventario
```

### Escenario 2: Expandir a Marketplace
```typescript
const vendedorExterno = {
  permissions: [
    'products:read:own', // Solo sus productos
    'products:write:own',
    'orders:read:own',
    'analytics:read:own'
  ]
};
```

### Escenario 3: Temporada Alta
```typescript
const empleadoTemporal = {
  permissions: ['orders:read', 'orders:fulfill', 'inventory:read'],
  expiresAt: '2025-01-31' // Solo durante temporada navideña
};
```

## 📝 Conclusión

Para tu marca de remeras, **el sistema actual de roles es perfecto para empezar**. Los permisos granulares son una excelente evolución natural cuando:

- Tengas más de 2 personas trabajando
- Manejes información sensible (financiera, PII)
- Quieras delegar responsabilidades específicas
- Planees expansión o marketplace

La clave es **evolucionar gradualmente** sin over-engineering prematuro.

---

**Autor:** Sistema de Autorización - Ecommerce Remeras  
**Fecha:** Octubre 2025  
**Versión:** 1.0