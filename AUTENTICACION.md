# 🔐 Login & Registro - Guía Completa

## 📍 Estado Actual vs. Futuro

### ❌ ESTADO ACTUAL (Mock en localStorage)
```
User Login/Register
    ↓
auth.ts (MOCK) - guarda en localStorage
    ↓
localStorage (navegador)
```
**Problema:** Los datos solo existen en el navegador, no en la BD

---

### ✅ ESTADO FUTURO (Supabase Auth)
```
User Login/Register
    ↓
auth.ts (Supabase Auth) - autentica con Supabase
    ↓
Supabase Auth (servicio de autenticación)
    ↓
auth.users table + JWT token
    ↓
Datos seguros en la BD + sesión en el cliente
```

---

## 🏗️ Arquitectura Completa

### Componentes

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ Login.tsx│  │ App.tsx  │  │ auth.ts  │             │
│  └──────────┘  └──────────┘  └──────────┘             │
│                      ▲                                   │
│                      │                                   │
│        Cookies + LocalStorage (JWT)                      │
│                      │                                   │
└──────────────────────┼───────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│              Supabase Auth (Backend)                    │
│  • Gestiona registro (email/password)                  │
│  • Gestiona login (email/password)                     │
│  • Gestiona reset de contraseña (con email)           │
│  • Gestiona JWT (tokens de sesión)                    │
└─────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│          PostgreSQL Database (Supabase)                │
│  auth.users          ← Usuarios autenticados          │
│  public.profiles     ← Perfiles (vinculado a users)   │
│  public.subscriptions ← Planes del usuario             │
│  etc...                                                │
└─────────────────────────────────────────────────────────┘
```

---

## 📝 Funciones de auth.ts - Cómo Cambiar

### 🔴 AHORA (Mock)

```typescript
export async function login(
  email: string,
  password: string
): Promise<LoginResult> {
  // Lee de localStorage
  const user = findUser(email)
  if (!user || user.password !== password) {
    return { ok: false, error: 'Credenciales inválidas' }
  }
  
  saveSession({
    email: user.email,
    username: user.username,
    loggedInAt: new Date().toISOString(),
    remember: false,
  })
  
  return { ok: true }
}
```

### 🟢 DESPUÉS (Supabase)

```typescript
export async function login(
  email: string,
  password: string
): Promise<LoginResult> {
  // Usa Supabase Auth
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) {
    return { ok: false, error: error.message }
  }
  
  // data.user contiene { id, email, ...}
  // data.session contiene el JWT token
  
  saveSession({
    email: data.user.email,
    username: data.user.user_metadata?.username,
    loggedInAt: new Date().toISOString(),
    remember: true, // Supabase persiste automáticamente
  })
  
  return { ok: true }
}
```

---

## 🔄 Flujo Completo de Registro

### Paso 1: Usuario llena el formulario
```
[Email]     → samuel@gmail.com
[Password]  → Abc123$Pass!
[Nombre]    → Samuel Ruiz
[Apellido]  → López
[Edad]      → 25 años
```

### Paso 2: Validaciones Frontend (auth.ts)
```
✓ Email válido
✓ Contraseña lo bastante fuerte
✓ Nombre y apellido válidos
✓ Edad mínima cumplida
```

### Paso 3: Enviar a Supabase Auth
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'samuel@gmail.com',
  password: 'Abc123$Pass!',
  options: {
    data: {
      firstName: 'Samuel',
      lastName: 'López',
      birthDate: '1999-03-15',
      username: 'samuel-lopez'
    }
  }
})
```

### Paso 4: Supabase Auth Crea Usuario
```
auth.users.INSERT {
  id: "uuid-abc123",
  email: "samuel@gmail.com",
  encrypted_password: "...",
  user_metadata: {
    firstName: "Samuel",
    lastName: "López",
    birthDate: "1999-03-15",
    username: "samuel-lopez"
  }
}
```

### Paso 5: Trigger Automático (SQL)
```sql
TRIGGER: create_user_profile_on_signup()
  ├─ profiles.INSERT {
  │    id: uuid-xxx
  │    user_id: "uuid-abc123"
  │    display_name: "samuel-lopez"
  │    slug: "samuel-lopez-abc1"
  │  }
  ├─ user_stats.INSERT {
  │    id: uuid-yyy
  │    user_id: "uuid-abc123"
  │    total_clicks: 0
  │    total_views: 0
  │  }
  └─ subscriptions.INSERT {
       id: uuid-zzz
       user_id: "uuid-abc123"
       plan: "free"
       status: "active"
     }
```

### Paso 6: Usuario Ve Confirmación
```
✅ Cuenta creada exitosamente
   Perfil listo: /u/samuel-lopez-abc1
```

### Paso 7: Frontend Guarda JWT
```
localStorage: {
  "auth.token": "eyJhbGc...",      // JWT Token
  "auth.refresh_token": "...",
  "auth.expires_in": 3600
}

// Supabase persiste esto automáticamente
// No necesitas hacer nada
```

---

## 🔑 Flujo Completo de Login

### Estado 1: Sin Sesión
```typescript
getSession() → null
isAuthenticated() → false
→ Mostrar pantalla Login
```

### Estado 2: Usuario Ingresa Credenciales
```
Email: samuel@gmail.com
Password: Abc123$Pass!
Recordar sesión: ✓
```

### Estado 3: Frontend Valida
```typescript
// Validar email
if (!isValidEmail(email)) {
  return { ok: false, error: 'Email inválido' }
}

// Validar password vacía
if (!password) {
  return { ok: false, error: 'Ingresa tu contraseña' }
}

// ✅ Validaciones ok, enviar a Supabase
```

### Estado 4: Supabase Auth Verifica
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'samuel@gmail.com',
  password: 'Abc123$Pass!'
})

// Supabase busca en auth.users
// Compara hash de la contraseña
// Si es correcto, devuelve el usuario y JWT
```

### Estado 5: Guardar Sesión
```typescript
// data.session contiene:
{
  access_token: "eyJhbGc...",      // JWT para requests
  refresh_token: "...",
  expires_in: 3600,                // Expira en 1 hora
  expires_at: 1705427200,
  token_type: "bearer",
  user: {
    id: "uuid-abc123",
    email: "samuel@gmail.com",
    user_metadata: {
      firstName: "Samuel",
      username: "samuel-lopez"
    }
  }
}

// Supabase lo guarda automáticamente en:
// localStorage['supabase.auth.token']
```

### Estado 6: Cargar Dashboard
```
App.tsx detecta:
isAuthenticated() → true
→ Mostrar dashboard
→ Cargar datos del usuario
```

---

## 🔐 Recuperar Contraseña (Password Reset)

### Paso 1: Usuario Solicita Reset
```
Email: samuel@gmail.com
```

### Paso 2: Validar Email
```typescript
if (!accountExists(email)) {
  // No decimos si existe o no (seguridad)
  return { ok: true, maskedEmail: "sa***@gmail.com" }
}
```

### Paso 3: Supabase Envía Email
```typescript
const { error } = await supabase.auth.resetPasswordForEmail(
  'samuel@gmail.com'
)

// Supabase envía email con link de reset
// El link contiene un token válido por 60 minutos
```

### Paso 4: Usuario Abre Link del Email
```
Email dice:
"Haz clic aquí para resetear tu contraseña"

Link: https://tuapp.com/reset-password?token=abc123def456
```

### Paso 5: Usuario Ingresa Nueva Contraseña
```
Nueva contraseña: NewPass123$
Confirmar: NewPass123$
```

### Paso 6: Cambiar en Supabase
```typescript
const { error } = await supabase.auth.updateUser({
  password: 'NewPass123$'
})

// O usar el token del email:
const { error } = await supabase.auth.verifyOtp({
  type: 'recovery',
  token: tokenDelEmail,
  password: 'NewPass123$'
})
```

### Paso 7: Contraseña Actualizada
```
✅ Contraseña actualizada
Ahora puedes iniciar sesión
```

---

## 🚪 Logout

### Cuando Usuario Hace Click "Cerrar Sesión"

```typescript
export function logout() {
  // Limpiar localStorage
  localStorage.removeItem(AUTH_STORAGE_KEY)
  
  // Limpiar sesión en Supabase
  await supabase.auth.signOut()
  
  // Mostrar Login de nuevo
}
```

---

## 🔄 Cambios Necesarios en auth.ts

### 1️⃣ Agregar Supabase al inicio
```typescript
import { supabase } from './utils/supabase'
```

### 2️⃣ Cambiar `AUTH_MODE`
```typescript
// AHORA:
export const AUTH_MODE = import.meta.env.VITE_AUTH_MODE ?? 'mock'

// DESPUÉS:
export const AUTH_MODE = 'supabase' // O leerlo de .env
```

### 3️⃣ Reemplazar función `login`
```typescript
// MOCK (eliminar)
function findUser(email: string): MockUser | undefined { ... }

// SUPABASE (new)
export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  if (error) return { ok: false, error: error.message }
  
  saveSession({
    email: data.user.email,
    ...
  })
  
  return { ok: true }
}
```

### 4️⃣ Reemplazar función `register`
```typescript
export async function register(email, password, userData) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        firstName: userData.firstName,
        lastName: userData.lastName,
        birthDate: userData.birthDate,
        username: userData.username
      }
    }
  })
  
  if (error) return { ok: false, error: error.message }
  
  return { ok: true }
}
```

### 5️⃣ Reemplazar funciones de reset
```typescript
// Solicitar reset
export async function requestPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email)
  
  if (error) return { ok: false, error: error.message }
  
  return {
    ok: true,
    maskedEmail: maskEmail(email),
    cooldownSec: RESEND_COOLDOWN_SEC
  }
}

// El resto se maneja automáticamente con el link del email
```

---

## 🎯 Ventajas de Usar Supabase Auth

✅ **Seguro**
- Contraseñas hasheadas (bcrypt)
- JWT tokens
- Tokens de refresh automáticos

✅ **Escalable**
- Sin límite de usuarios
- Infraestructura de nivel empresarial

✅ **Funcionalidades Incluidas**
- Reset de contraseña por email
- Multi-factor authentication (MFA)
- Autenticación social (Google, GitHub, etc.)
- Rate limiting automático

✅ **Integración Perfecta**
- Automáticamente vinculado a tu BD
- Los triggers crean profiles + stats

✅ **Sin Servidor**
- No necesitas mantener un servidor de auth

---

## ⚙️ Cambios en Variables de Entorno

### AHORA (.env.local)
```
VITE_AUTH_MODE=mock
VITE_DEMO_EMAIL=samuel@gmail.com
VITE_DEMO_PASSWORD=1234
```

### DESPUÉS (.env.local)
```
VITE_AUTH_MODE=supabase
VITE_SUPABASE_URL=https://[project].supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...
```

---

## 🔄 Estructura de Datos del Usuario

### En LocalStorage/Session (Cliente)
```javascript
{
  email: "samuel@gmail.com",
  username: "samuel-lopez",
  firstName: "Samuel",
  lastName: "López",
  loggedInAt: "2024-01-15T10:30:00Z",
  remember: true
}
```

### En auth.users (Supabase)
```javascript
{
  id: "uuid-abc123",
  email: "samuel@gmail.com",
  encrypted_password: "bcrypt...",
  email_confirmed_at: "2024-01-15T10:30:00Z",
  last_sign_in_at: "2024-01-15T10:30:00Z",
  user_metadata: {
    firstName: "Samuel",
    lastName: "López",
    birthDate: "1999-03-15",
    username: "samuel-lopez"
  },
  created_at: "2024-01-15T10:30:00Z"
}
```

### En public.profiles (Supabase)
```javascript
{
  id: "uuid-profile-1",
  user_id: "uuid-abc123",
  display_name: "samuel-lopez",
  slug: "samuel-lopez-abc1",
  bio: null,
  avatar_url: null,
  accent_color: "#ec4899",
  button_style: "soft",
  created_at: "2024-01-15T10:30:00Z",
  updated_at: "2024-01-15T10:30:00Z"
}
```

---

## 🧪 Pruebas Después de Implementar

### Test 1: Registro Básico
```
Email: test@example.com
Password: Test123$Pass!
→ Debe crear user en auth.users
→ Debe crear profile en profiles
→ Debe crear stats en user_stats
```

### Test 2: Login
```
Email: test@example.com
Password: Test123$Pass!
→ Debe cargar sesión
→ Debe mostrar dashboard
```

### Test 3: Persistencia
```
1. Login y marcar "Recordar sesión"
2. Refresh de página
→ Debe mantener sesión activa
→ Debe cargar dashboard automáticamente
```

### Test 4: Logout
```
1. Haz logout
→ localStorage debe vaciarse
→ Debe mostrar Login de nuevo
```

### Test 5: Reset de Contraseña
```
1. Ir a "Olvidé mi contraseña"
2. Ingresar email
3. Revisar email
4. Copiar link de reset
5. Ingresar nueva contraseña
→ Debe poder login con nueva contraseña
```

---

## 📋 Checklist para Migración

- [ ] Crear proyecto Supabase
- [ ] Ejecutar `schema.sql`
- [ ] Configurar `.env.local` con credenciales de Supabase
- [ ] Importar `supabase` en `auth.ts`
- [ ] Reemplazar función `login()`
- [ ] Reemplazar función `register()`
- [ ] Reemplazar función `requestPasswordReset()`
- [ ] Eliminar código MOCK (localStorage de usuarios)
- [ ] Eliminar `USERS_KEY`, `RESET_KEY` (ya no necesario)
- [ ] Probar registro
- [ ] Probar login
- [ ] Probar logout
- [ ] Probar reset de contraseña
- [ ] Probar persistencia de sesión

