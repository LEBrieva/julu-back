# httpOnly Cookies + Rate Limiting - Guía de Implementación

## 📋 Resumen

Se implementaron dos mejoras de seguridad críticas en el sistema de autenticación:

1. **httpOnly Cookies** para refresh tokens (protección contra XSS)
2. **Rate Limiting** con @nestjs/throttler (protección contra brute force y DDoS)

---

## 🍪 httpOnly Cookies

### ¿Qué cambió?

**Antes:**
```json
// Response de /auth/login
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "a1b2c3d4...", // ⚠️ Expuesto en JSON
  "user": { ... }
}

// Frontend guardaba en localStorage
localStorage.setItem('refreshToken', 'a1b2c3d4...');
```

**Ahora:**
```json
// Response de /auth/login
{
  "accessToken": "eyJhbGci...",
  "user": { ... }
  // ✅ refreshToken NO aparece en JSON
}

// Backend guarda en httpOnly cookie automáticamente
Set-Cookie: refreshToken=a1b2c3d4...; HttpOnly; Secure; SameSite=Strict; Path=/auth; Max-Age=604800
```

### Ventajas de Seguridad

| Ataque | Antes (localStorage) | Ahora (httpOnly cookie) |
|--------|----------------------|-------------------------|
| **XSS** | ❌ Vulnerable | ✅ Protegido |
| **JavaScript malicioso** | ❌ Puede robar token | ✅ No puede acceder |
| **document.cookie** | ❌ Accesible | ✅ Inaccesible |
| **CSRF** | ✅ Protegido | ✅ Protegido (SameSite) |

### Flujo de Revocación

```typescript
// Escenario 1: Logout normal
POST /auth/logout
Cookie: refreshToken=abc123

Backend:
1. Lee refresh token de cookie ✅
2. Marca como isRevoked: true en BD ✅
3. Limpia cookie del navegador ✅

// Escenario 2: Intento de usar token revocado
POST /auth/refresh
Cookie: refreshToken=abc123 (revocado)

Backend valida en BD:
- findOne({ token: 'abc123', isRevoked: false })
- No encuentra (porque isRevoked: true)
- Rechaza con 401 Unauthorized ✅
```

**La cookie es solo transporte, la validación real está en BD.**

---

## 🚦 Rate Limiting

### Configuración Global

Se configuraron 3 niveles de throttling:

```typescript
// app.module.ts
ThrottlerModule.forRoot([
  {
    name: 'short',
    ttl: 1000,    // 1 segundo
    limit: 3,     // 3 requests máximo
  },
  {
    name: 'medium',
    ttl: 10000,   // 10 segundos
    limit: 20,
  },
  {
    name: 'long',
    ttl: 60000,   // 1 minuto
    limit: 100,
  },
])
```

### Límites por Endpoint

| Endpoint | Límite | Ventana | Protege contra |
|----------|--------|---------|----------------|
| `POST /auth/login` | 5 requests | 60s | Brute force de passwords |
| `POST /auth/dashboard/login` | 5 requests | 60s | Ataques a panel admin |
| `POST /auth/refresh` | 10 requests | 60s | Abuso de renovación de tokens |
| Otros endpoints | 100 requests | 60s | DDoS general |

### Respuestas del Rate Limiter

**Cuando se excede el límite:**
```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1696876543

{
  "statusCode": 429,
  "message": "ThrottlerException: Too Many Requests"
}
```

**Headers informativos:**
```http
X-RateLimit-Limit: 5          // Límite máximo
X-RateLimit-Remaining: 3      // Requests restantes
X-RateLimit-Reset: 1696876543 // Timestamp de reset
```

---

## 🔧 Uso desde Frontend

### Login (con httpOnly cookies)

```javascript
// Login normal
const response = await fetch('http://localhost:3000/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // ⭐ CRÍTICO: incluir cookies
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

const { accessToken, user } = await response.json();

// Solo guardar access token
localStorage.setItem('accessToken', accessToken);
// ✅ refreshToken ya está en cookie httpOnly
```

### Refresh Token

```javascript
// Renovar access token
// IMPORTANTE: NO enviar body, el token viene de la cookie httpOnly
const response = await fetch('http://localhost:3000/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // ⭐ Cookie se envía automáticamente
  // NO body - el refresh token viene de la cookie
});

if (response.ok) {
  const { accessToken } = await response.json();
  localStorage.setItem('accessToken', accessToken);
} else if (response.status === 401) {
  // Refresh token inválido/expirado → Redirect a login
  localStorage.clear();
  window.location.href = '/login';
}
```

### Logout

```javascript
// IMPORTANTE: NO requiere Authorization header ni body
// El refresh token viene de la cookie httpOnly
const response = await fetch('http://localhost:3000/auth/logout', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // ⭐ Enviar cookie para revocar
  // NO Authorization header requerido
  // NO body requerido
});

// Limpiar localStorage
localStorage.removeItem('accessToken');
localStorage.clear(); // O limpiar todo

// ✅ Cookie limpiada automáticamente por backend
```

### Manejo de Rate Limiting

```javascript
async function loginWithRetry(email, password) {
  try {
    const response = await fetch('http://localhost:3000/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (response.status === 429) {
      const resetTime = response.headers.get('X-RateLimit-Reset');
      const waitSeconds = Math.ceil((resetTime * 1000 - Date.now()) / 1000);

      throw new Error(`Too many attempts. Try again in ${waitSeconds} seconds.`);
    }

    return await response.json();
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}
```

---

## 🔐 Endpoints de Autenticación - Análisis

### ¿Por qué /auth/refresh y /auth/logout son públicos?

**Conceptualmente incorrecto pensar que necesitan autenticación JWT:**

| Endpoint | Decorador | Razón |
|----------|-----------|-------|
| `/auth/login` | `@Public()` | ✅ Obvio - usuario no autenticado |
| `/auth/refresh` | `@Public()` | ✅ Access token **YA EXPIRÓ**, no hay JWT válido |
| `/auth/logout` | `@Public()` | ✅ Permite logout incluso si access token expiró |

**La seguridad NO viene del `@UseGuards(JwtAuthGuard)`, viene de:**
1. **Validación en BD** del refresh token (`isRevoked: false`)
2. **httpOnly cookie** (inaccesible para JavaScript malicioso)
3. **Rate limiting** (10 intentos/minuto máximo)

### Flujo Real de Seguridad

```typescript
// ❌ INCORRECTO: Pensar que refresh necesita JWT
@UseGuards(JwtAuthGuard) // <-- Access token ya expiró!
@Post('refresh')
async refresh() { ... }

// ✅ CORRECTO: Refresh valida con el refresh token (de cookie)
@Public() // Access token expirado, NO HAY autenticación JWT
@Post('refresh')
async refresh(@Request() req) {
  const refreshToken = req.cookies.refreshToken; // <-- ESTA es la autenticación

  // Validación en BD (la VERDADERA seguridad)
  const tokenDoc = await this.refreshTokenModel.findOne({
    token: refreshToken,
    isRevoked: false // <-- Si está revocado, falla aquí
  });

  if (!tokenDoc) throw new UnauthorizedException();
  // ...
}
```

## 🔒 Casos de Uso de Seguridad

### 1. Usuario Sospecha de Cuenta Comprometida

```typescript
// Frontend: "Cerrar sesión en todos los dispositivos"
POST /auth/logout-all

// Backend (necesitarías implementar este endpoint):
async logoutAll(userId: string, res: Response) {
  await this.refreshTokenModel.updateMany(
    { userId },
    { isRevoked: true }
  );

  res.clearCookie('refreshToken', { path: '/auth' });
}
```

### 2. Admin Revoca Sesión Específica

```typescript
// Dashboard Admin: Ver sesiones activas
GET /admin/users/:userId/sessions

Response:
[
  {
    id: "token_id_1",
    userAgent: "Chrome 118.0 on MacOS",
    ipAddress: "192.168.1.100",
    createdAt: "2025-10-01T10:00:00Z",
    expiresAt: "2025-10-08T10:00:00Z"
  },
  {
    id: "token_id_2",
    userAgent: "Safari on iPhone",
    ipAddress: "192.168.1.50",
    createdAt: "2025-10-05T15:30:00Z",
    expiresAt: "2025-10-12T15:30:00Z"
  }
]

// Revocar sesión sospechosa
DELETE /admin/sessions/token_id_2

Backend:
await this.refreshTokenModel.updateOne(
  { _id: tokenId },
  { isRevoked: true }
);
```

### 3. Detección de Brute Force

```bash
# Logs del rate limiter
[Nest] 2025-10-09 - ThrottlerGuard: IP 203.0.113.45 exceeded limit on /auth/login
[Nest] 2025-10-09 - ThrottlerGuard: IP 203.0.113.45 blocked for 60 seconds

# Puedes agregar alertas
if (rateLimitExceeded) {
  await notifySecurityTeam({
    ip: request.ip,
    endpoint: '/auth/login',
    attempts: 10,
    timeWindow: '60s'
  });
}
```

---

## 🧪 Testing

### Test Manual con curl

```bash
# 1. Login (recibir cookie)
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -c cookies.txt \
  -v

# Output:
# < Set-Cookie: refreshToken=abc123...; HttpOnly; Path=/auth; Max-Age=604800
# {"accessToken":"eyJhbGci...","user":{...}}

# 2. Refresh usando cookie
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -v

# Output:
# {"accessToken":"eyJhbGci..."}

# 3. Test rate limiting (ejecutar 6 veces seguidas)
for i in {1..6}; do
  curl -X POST http://localhost:3000/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' \
    -v
done

# Request #6 debería retornar 429 Too Many Requests
```

### Test de Revocación

```bash
# 1. Login y guardar cookie
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -c cookies.txt

# 2. Logout (revocar token)
curl -X POST http://localhost:3000/auth/logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -b cookies.txt

# 3. Intentar refresh (debería fallar con 401)
curl -X POST http://localhost:3000/auth/refresh \
  -b cookies.txt \
  -v

# Output esperado:
# HTTP/1.1 401 Unauthorized
# {"statusCode":401,"message":"Invalid refresh token"}
```

---

## ⚙️ Variables de Entorno

Actualiza tu `.env`:

```env
# Existentes
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
PORT=3000

# Nuevas (opcionales)
NODE_ENV=development # 'production' para HTTPS cookies
FRONTEND_URL=http://localhost:5173 # URL de tu frontend para CORS
```

---

## 🚀 Mejoras Futuras (Opcionales)

### 1. Refresh Token Rotation

```typescript
async refreshAccessToken(oldRefreshToken: string) {
  const tokenDoc = await this.refreshTokenModel.findOne({
    token: oldRefreshToken,
    isRevoked: false
  });

  if (!tokenDoc) throw new UnauthorizedException();

  // Revocar token viejo
  await this.refreshTokenModel.updateOne(
    { _id: tokenDoc._id },
    { isRevoked: true }
  );

  // Generar NUEVO refresh token
  const newRefreshToken = await this.generateRefreshToken(tokenDoc.userId);

  return {
    accessToken: this.jwtService.sign(payload),
    refreshToken: newRefreshToken.token // Nuevo token
  };
}
```

### 2. Custom Throttler Guard (por userId en vez de IP)

```typescript
// custom-throttler.guard.ts
@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Si está autenticado, limitar por userId
    if (req.user?.userId) {
      return `user-${req.user.userId}`;
    }
    // Si no, limitar por IP
    return req.ip;
  }
}
```

### 3. Redis para Rate Limiting Distribuido

```bash
pnpm install @nest-lab/throttler-storage-redis ioredis
```

```typescript
// app.module.ts
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';

ThrottlerModule.forRootAsync({
  useFactory: () => ({
    throttlers: [{ ttl: 60000, limit: 10 }],
    storage: new ThrottlerStorageRedisService({
      host: 'localhost',
      port: 6379,
    }),
  }),
})
```

---

## 📝 Checklist de Migración para Frontend

- [ ] Agregar `credentials: 'include'` en TODAS las peticiones a `/auth/*`
- [ ] Eliminar lógica de guardar/leer refreshToken de localStorage
- [ ] Mantener solo accessToken en localStorage
- [ ] Actualizar interceptor de Axios/Fetch para incluir credentials
- [ ] Manejar errores 429 (Too Many Requests) con mensajes al usuario
- [ ] Probar flujo completo: login → refresh → logout

---

## 🔗 Referencias

- [NestJS Throttler Docs](https://docs.nestjs.com/security/rate-limiting)
- [MDN httpOnly Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies#restrict_access_to_cookies)
- [OWASP XSS Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)

---

**Fecha de Implementación:** Octubre 2025
**Versión:** 1.0
