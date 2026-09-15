# 💻 Ejemplos de Código - Login & Registro

## Resumen Rápido

| Aspecto | AHORA (Mock) | DESPUÉS (Supabase) |
|---------|--------------|-------------------|
| **Donde se guarda** | localStorage (navegador) | Supabase (servidor) |
| **Seguridad** | ❌ Baja (texto plano) | ✅ Alta (bcrypt + JWT) |
| **Base de datos** | Ninguna | PostgreSQL (Supabase) |
| **Creación de perfil** | Manual en código | Automático (trigger) |
| **Reset de password** | Mock con código | Real con email |

---

## 1️⃣ FUNCIÓN: LOGIN

### 🔴 AHORA (Mock)

```typescript
// ============ ARCHIVO: auth.ts ============

function findUser(email: string): MockUser | undefined {
  const normalized = email.trim().toLowerCase()
  return readUsers().find((user) => user.email === normalized)
}

function readUsers(): MockUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as MockUser[]
  } catch {
    return []
  }
}

export type LoginResult = { ok: true } | { ok: false; error: string }

export async function login(
  email: string,
  password: string,
  remember: boolean
): Promise<LoginResult> {
  // Validar email
  const normalized = email.trim().toLowerCase()
  if (!normalized) return { ok: false, error: 'Ingresa tu correo.' }
  if (!isValidEmail(normalized)) {
    return { ok: false, error: 'Ingresa un correo válido.' }
  }

  // Buscar usuario en localStorage
  let user = findUser(email)
  
  // User demo hardcodeado
  const isDemo = normalized === DEMO_EMAIL.toLowerCase()
  if (isDemo) {
    user = {
      email: DEMO_EMAIL,
      password: getDemoPassword(), // ← Puede cambiar si hizo reset
      username: 'demo-user',
      firstName: 'Samuel',
      lastName: 'Ruiz',
      birthDate: '1995-03-15',
    }
  }

  // Validar que existe
  if (!user) return { ok: false, error: 'Credenciales inválidas.' }

  // Comparar contraseña (❌ texto plano!)
  if (user.password !== password) {
    return { ok: false, error: 'Credenciales inválidas.' }
  }

  // Guardar sesión en localStorage
  saveSession(
    {
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      loggedInAt: new Date().toISOString(),
      remember,
    },
    remember
  )

  return { ok: true }
}
```

**Problemas:**
- ❌ Contraseña en texto plano en localStorage
- ❌ No hay conexión a BD
- ❌ Si navegador se limpia, se pierden los datos
- ❌ No hay validación en servidor
- ❌ Usuario demo es hardcodeado

---

### 🟢 DESPUÉS (Supabase)

```typescript
// ============ ARCHIVO: auth.ts ============

import { supabase } from './utils/supabase'

export type LoginResult = { ok: true } | { ok: false; error: string }

export async function login(
  email: string,
  password: string,
  remember: boolean
): Promise<LoginResult> {
  // Validar email
  const normalized = email.trim().toLowerCase()
  if (!normalized) return { ok: false, error: 'Ingresa tu correo.' }
  if (!isValidEmail(normalized)) {
    return { ok: false, error: 'Ingresa un correo válido.' }
  }

  // Validar que no esté vacía
  if (!password) return { ok: false, error: 'Ingresa tu contraseña.' }

  // Enviar a Supabase Auth (servidor)
  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalized,
    password,
  })

  if (error) {
    // Supabase devuelve errores claros
    if (error.message.includes('Invalid login credentials')) {
      return { ok: false, error: 'Credenciales inválidas.' }
    }
    return { ok: false, error: error.message }
  }

  // ✅ Login exitoso
  // data.session contiene el JWT token
  // Supabase lo guarda automáticamente en localStorage

  // Guardar datos adicionales en memoria
  saveSession(
    {
      email: data.user.email,
      username: data.user.user_metadata?.username,
      firstName: data.user.user_metadata?.firstName,
      lastName: data.user.user_metadata?.lastName,
      loggedInAt: new Date().toISOString(),
      remember,
    },
    remember
  )

  return { ok: true }
}
```

**Ventajas:**
- ✅ Contraseña verificada en servidor (seguro)
- ✅ Conectado a Supabase Auth
- ✅ JWT token persistente
- ✅ Validación en servidor
- ✅ Sin usuario hardcodeado

---

## 2️⃣ FUNCIÓN: REGISTER

### 🔴 AHORA (Mock)

```typescript
// ============ ARCHIVO: auth.ts ============

function writeUsers(users: MockUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export type RegisterResult = { ok: true } | { ok: false; error: string }

export async function register(
  email: string,
  password: string,
  confirmPassword: string,
  firstName: string,
  lastName: string,
  birthDate: string,
  remember: boolean
): Promise<RegisterResult> {
  // Validar email
  const normalized = email.trim().toLowerCase()
  if (!normalized) return { ok: false, error: 'Ingresa tu correo.' }
  if (!isValidEmail(normalized)) {
    return { ok: false, error: 'Ingresa un correo válido.' }
  }

  // Validar que no exista
  if (accountExists(normalized)) {
    return { ok: false, error: 'Este correo ya tiene cuenta.' }
  }

  // Validar nombre
  if (!isValidPersonName(firstName)) {
    return { ok: false, error: 'Ingresa tu nombre.' }
  }

  // Validar apellido
  if (!isValidPersonName(lastName)) {
    return { ok: false, error: 'Ingresa tu apellido.' }
  }

  // Validar edad
  const age = getAgeFromBirthDate(birthDate)
  if (age < MIN_REGISTER_AGE) {
    return {
      ok: false,
      error: `Debes tener al menos ${MIN_REGISTER_AGE} años.`,
    }
  }

  // Validar contraseña
  if (!password || !confirmPassword) {
    return { ok: false, error: 'Completa y confirma tu contraseña.' }
  }
  if (password !== confirmPassword) {
    return { ok: false, error: 'Las contraseñas no coinciden.' }
  }

  const strength = evaluatePassword(password)
  if (!strength.isStrongEnough) {
    return { ok: false, error: 'La contraseña aún no es lo bastante segura.' }
  }

  // ❌ Guardar usuario en localStorage (sin encriptación!)
  const username = generateUsername(firstName, lastName)
  const users = readUsers()
  users.push({
    email: normalized,
    username,
    password, // ❌ Texto plano!!
    firstName,
    lastName,
    birthDate,
  })
  writeUsers(users)

  // Guardar sesión
  saveSession(
    {
      email: normalized,
      username,
      firstName,
      lastName,
      loggedInAt: new Date().toISOString(),
      remember,
    },
    remember
  )

  return { ok: true }
}
```

**Problemas:**
- ❌ Contraseña guardada en texto plano
- ❌ Datos en localStorage (inseguro)
- ❌ Sin verificación de email
- ❌ No hay trigger para crear perfil
- ❌ Usuario manual en cada navegador

---

### 🟢 DESPUÉS (Supabase)

```typescript
// ============ ARCHIVO: auth.ts ============

import { supabase } from './utils/supabase'

export type RegisterResult = { ok: true } | { ok: false; error: string }

export async function register(
  email: string,
  password: string,
  confirmPassword: string,
  firstName: string,
  lastName: string,
  birthDate: string,
  remember: boolean
): Promise<RegisterResult> {
  // Validar email
  const normalized = email.trim().toLowerCase()
  if (!normalized) return { ok: false, error: 'Ingresa tu correo.' }
  if (!isValidEmail(normalized)) {
    return { ok: false, error: 'Ingresa un correo válido.' }
  }

  // Validar nombre
  if (!isValidPersonName(firstName)) {
    return { ok: false, error: 'Ingresa tu nombre.' }
  }

  // Validar apellido
  if (!isValidPersonName(lastName)) {
    return { ok: false, error: 'Ingresa tu apellido.' }
  }

  // Validar edad
  const age = getAgeFromBirthDate(birthDate)
  if (age < MIN_REGISTER_AGE) {
    return {
      ok: false,
      error: `Debes tener al menos ${MIN_REGISTER_AGE} años.`,
    }
  }

  // Validar contraseña
  if (!password || !confirmPassword) {
    return { ok: false, error: 'Completa y confirma tu contraseña.' }
  }
  if (password !== confirmPassword) {
    return { ok: false, error: 'Las contraseñas no coinciden.' }
  }

  const strength = evaluatePassword(password)
  if (!strength.isStrongEnough) {
    return { ok: false, error: 'La contraseña aún no es lo bastante segura.' }
  }

  // Generar username desde nombre y apellido
  const username = generateUsername(firstName, lastName)

  // ✅ Registrar en Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email: normalized,
    password,
    options: {
      // Datos adicionales guardados en user_metadata
      data: {
        firstName,
        lastName,
        birthDate,
        username,
      },
    },
  })

  if (error) {
    // Supabase devuelve errores específicos
    if (error.message.includes('already registered')) {
      return { ok: false, error: 'Este correo ya tiene cuenta.' }
    }
    return { ok: false, error: error.message }
  }

  // ✅ Usuario creado en Supabase
  // Automáticamente:
  // 1. Se crea entrada en auth.users
  // 2. Se ejecuta trigger create_user_profile_on_signup
  // 3. Se crea profiles + user_stats + subscriptions
  // 4. Se envía email de confirmación

  // Guardar sesión del cliente
  saveSession(
    {
      email: data.user?.email || normalized,
      username,
      firstName,
      lastName,
      loggedInAt: new Date().toISOString(),
      remember,
    },
    remember
  )

  return { ok: true }
}
```

**Ventajas:**
- ✅ Contraseña encriptada en servidor (bcrypt)
- ✅ Email de confirmación automático
- ✅ Trigger crea automáticamente: perfil + stats + suscripción
- ✅ Datos persistentes en BD
- ✅ Seguro en todos los navegadores

---

## 3️⃣ FUNCIÓN: LOGOUT

### 🔴 AHORA (Mock)

```typescript
export function logout() {
  localStorage.removeItem(AUTH_STORAGE_KEY)
  sessionStorage.removeItem(AUTH_STORAGE_KEY)
}
```

---

### 🟢 DESPUÉS (Supabase)

```typescript
export async function logout() {
  // Limpiar sesión en Supabase
  await supabase.auth.signOut()

  // Limpiar datos locales (Supabase ya limpió localStorage)
  localStorage.removeItem(AUTH_STORAGE_KEY)
  sessionStorage.removeItem(AUTH_STORAGE_KEY)
}
```

---

## 4️⃣ FUNCIÓN: RESET DE CONTRASEÑA

### 🔴 AHORA (Mock)

```typescript
export type ResetRequestResult =
  | { ok: true; maskedEmail: string; cooldownSec: number; mockCode?: string }
  | { ok: false; error: string }

export async function requestPasswordReset(
  email: string
): Promise<ResetRequestResult> {
  const normalized = email.trim().toLowerCase()
  if (!normalized) return { ok: false, error: 'Ingresa tu correo.' }
  if (!isValidEmail(normalized)) {
    return { ok: false, error: 'Ingresa un correo válido.' }
  }

  const maskedEmail = maskEmail(normalized)

  // Verificar que la cuenta existe
  if (accountExists(normalized)) {
    // Generar código random de 6 dígitos
    const code = generateResetCode()

    // Guardar en sessionStorage (no localStorage)
    writeReset({
      email: normalized,
      code,
      expiresAt: Date.now() + RESET_CODE_TTL_MS, // 10 minutos
      attempts: 0,
      verified: false,
    })

    // En modo mock, devolver el código para testing
    return {
      ok: true,
      maskedEmail,
      cooldownSec: RESEND_COOLDOWN_SEC,
      mockCode: AUTH_MODE === 'mock' ? code : undefined,
    }
  }

  // Aunque no exista, fingir que sí (seguridad)
  writeReset(null)
  return { ok: true, maskedEmail, cooldownSec: RESEND_COOLDOWN_SEC }
}

// Usuario ingresa el código...
export async function verifyPasswordResetCode(
  email: string,
  code: string
): Promise<ResetVerifyResult> {
  const normalized = email.trim().toLowerCase()
  const cleaned = code.replace(/\D/g, '')

  if (cleaned.length !== 6) {
    return { ok: false, error: 'Ingresa el código de 6 dígitos.' }
  }

  const challenge = readReset()
  if (!challenge || challenge.email !== normalized) {
    return { ok: false, error: 'Solicita un código nuevo e inténtalo de nuevo.' }
  }

  // Verificar expiración
  if (Date.now() > challenge.expiresAt) {
    writeReset(null)
    return { ok: false, error: 'El código expiró. Solicita uno nuevo.' }
  }

  // Verificar intentos
  if (challenge.attempts >= RESET_MAX_ATTEMPTS) {
    writeReset(null)
    return { ok: false, error: 'Demasiados intentos. Solicita un código nuevo.' }
  }

  // Comparar código
  if (challenge.code !== cleaned) {
    writeReset({ ...challenge, attempts: challenge.attempts + 1 })
    const left = RESET_MAX_ATTEMPTS - challenge.attempts - 1
    return {
      ok: false,
      error:
        left > 0
          ? `Código incorrecto. Te quedan ${left} intentos.`
          : 'Código incorrecto. Solicita uno nuevo.',
    }
  }

  // Código correcto
  writeReset({ ...challenge, verified: true })
  return { ok: true }
}

// Usuario ingresa nueva contraseña...
export async function completePasswordReset(
  email: string,
  password: string,
  confirmPassword: string
): Promise<ResetVerifyResult> {
  const normalized = email.trim().toLowerCase()

  if (!password || !confirmPassword) {
    return { ok: false, error: 'Completa y confirma tu contraseña.' }
  }

  if (password !== confirmPassword) {
    return { ok: false, error: 'Las contraseñas no coinciden.' }
  }

  const strength = evaluatePassword(password)
  if (!strength.isStrongEnough) {
    return { ok: false, error: 'La contraseña aún no es lo bastante segura.' }
  }

  const challenge = readReset()
  if (!challenge || challenge.email !== normalized || !challenge.verified) {
    return { ok: false, error: 'Verifica el código antes de cambiar la contraseña.' }
  }

  // Actualizar usuario en localStorage
  if (normalized === DEMO_EMAIL.toLowerCase()) {
    setDemoPassword(password)
    writeReset(null)
    return { ok: true }
  }

  const users = readUsers()
  const index = users.findIndex((user) => user.email === normalized)
  if (index === -1) {
    writeReset(null)
    return { ok: false, error: 'No se pudo actualizar la contraseña.' }
  }

  users[index] = { ...users[index], password }
  writeUsers(users)
  writeReset(null)

  return { ok: true }
}
```

**Problemas:**
- ❌ Código guardado en sessionStorage (puede verse en DevTools)
- ❌ Contraseña guardada en texto plano
- ❌ Sin email real (solo mock)

---

### 🟢 DESPUÉS (Supabase)

```typescript
import { supabase } from './utils/supabase'

export type ResetRequestResult =
  | { ok: true; maskedEmail: string; cooldownSec: number }
  | { ok: false; error: string }

export async function requestPasswordReset(
  email: string
): Promise<ResetRequestResult> {
  const normalized = email.trim().toLowerCase()
  if (!normalized) return { ok: false, error: 'Ingresa tu correo.' }
  if (!isValidEmail(normalized)) {
    return { ok: false, error: 'Ingresa un correo válido.' }
  }

  // Supabase se encarga de todo (seguro)
  const { error } = await supabase.auth.resetPasswordForEmail(normalized)

  // Supabase SIEMPRE responde ok (no revela si existe la cuenta)
  // Si existe, envía email. Si no, no hace nada (pero no lo dice).

  const maskedEmail = maskEmail(normalized)

  if (error) {
    // Mostrar error pero no revelar detalles
    console.error('Error en reset:', error)
  }

  // Siempre devolver ok (seguridad)
  return {
    ok: true,
    maskedEmail,
    cooldownSec: RESEND_COOLDOWN_SEC,
  }
}

// Usuario abre el link del email y llega a esta función
export async function completePasswordReset(
  password: string,
  confirmPassword: string
): Promise<ResetVerifyResult> {
  if (!password || !confirmPassword) {
    return { ok: false, error: 'Completa y confirma tu contraseña.' }
  }

  if (password !== confirmPassword) {
    return { ok: false, error: 'Las contraseñas no coinciden.' }
  }

  const strength = evaluatePassword(password)
  if (!strength.isStrongEnough) {
    return { ok: false, error: 'La contraseña aún no es lo bastante segura.' }
  }

  // El token viene en la URL (manejado por Supabase)
  // Solo enviar la nueva contraseña
  const { error } = await supabase.auth.updateUser({
    password,
  })

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true }
}
```

**Ventajas:**
- ✅ Email real enviado por Supabase
- ✅ Link seguro con token temporal
- ✅ No requiere código manual
- ✅ Contraseña nunca en cliente
- ✅ Automático

---

## 5️⃣ VERIFICAR SESIÓN

### 🔴 AHORA (Mock)

```typescript
export function getSession(): AuthSession | null {
  // Buscar en localStorage primero
  let raw = localStorage.getItem(AUTH_STORAGE_KEY)
  if (raw) {
    try {
      return JSON.parse(raw) as AuthSession
    } catch {
      return null
    }
  }

  // Si no, buscar en sessionStorage
  raw = sessionStorage.getItem(AUTH_STORAGE_KEY)
  if (raw) {
    try {
      return JSON.parse(raw) as AuthSession
    } catch {
      return null
    }
  }

  return null
}

export function isAuthenticated(): boolean {
  return getSession() !== null
}
```

---

### 🟢 DESPUÉS (Supabase)

```typescript
export async function getSession(): Promise<AuthSession | null> {
  // Supabase verifica el JWT
  const { data, error } = await supabase.auth.getSession()

  if (error || !data.session) {
    return null
  }

  // Convertir datos de Supabase a nuestro formato
  return {
    email: data.session.user.email || '',
    username: data.session.user.user_metadata?.username,
    firstName: data.session.user.user_metadata?.firstName,
    lastName: data.session.user.user_metadata?.lastName,
    loggedInAt: data.session.user.created_at,
    remember: true,
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession()
  return session !== null
}
```

---

## 📋 Resumen de Cambios

| Función | AHORA | DESPUÉS |
|---------|-------|---------|
| **login()** | localStorage | Supabase Auth |
| **register()** | localStorage + manual | Supabase Auth + trigger |
| **logout()** | localStorage.removeItem | supabase.auth.signOut() |
| **reset** | Mock con código | Email real con link |
| **getSession()** | localStorage | supabase.auth.getSession() |
| **Seguridad** | ❌ Texto plano | ✅ bcrypt + JWT |
| **BD** | ❌ Ninguna | ✅ PostgreSQL |
| **Email** | ❌ Mock | ✅ Real |

