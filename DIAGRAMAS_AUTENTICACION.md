# 📊 Diagrama de Flujos - Autenticación

## 1️⃣ FLUJO DE REGISTRO

### AHORA (Mock) ❌

```
┌─────────────────────────────────────────────────────────┐
│              Frontend (React - Login.tsx)               │
│  Usuario llena formulario:                              │
│  • Email: samuel@gmail.com                              │
│  • Password: Abc123$Pass!                               │
│  • Nombre: Samuel                                       │
│  • Apellido: López                                      │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│              auth.ts - register()                       │
│  Validaciones:                                          │
│  ✓ Email válido                                         │
│  ✓ Password fuerte                                      │
│  ✓ Nombres válidos                                      │
│  ✓ Edad >= 18                                           │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│          localStorage (Navegador) - ❌ INSEGURO         │
│                                                         │
│  linkbio-mock-users = [                                 │
│    {                                                    │
│      email: "samuel@gmail.com",                         │
│      password: "Abc123$Pass!",  ← ❌ TEXTO PLANO!      │
│      firstName: "Samuel",                               │
│      lastName: "López",                                 │
│      birthDate: "1999-03-15"                            │
│    }                                                    │
│  ]                                                      │
│                                                         │
│  ⚠️ Problemas:                                          │
│  • Password visible en DevTools                         │
│  • Si navegador se limpia, se pierden datos             │
│  • Sin encriptación                                     │
│  • Solo funciona en este navegador                      │
└─────────────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│         ❌ NO se crea perfil automáticamente             │
│         ❌ Usuario debe hacerlo manualmente              │
│         ❌ Sin BD de respaldo                            │
└─────────────────────────────────────────────────────────┘
```

---

### DESPUÉS (Supabase) ✅

```
┌─────────────────────────────────────────────────────────┐
│              Frontend (React - Login.tsx)               │
│  Usuario llena formulario                               │
│  • Email: samuel@gmail.com                              │
│  • Password: Abc123$Pass!                               │
│  • Nombre: Samuel                                       │
│  • Apellido: López                                      │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│              auth.ts - register()                       │
│  Validaciones en CLIENTE:                               │
│  ✓ Email válido                                         │
│  ✓ Password fuerte                                      │
│  ✓ Nombres válidos                                      │
│  ✓ Edad >= 18                                           │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
        ┌─────────────────────┐
        │   Enviar a servidor │
        └────────────┬────────┘
                     │ HTTPS (encriptado)
                     ▼
┌─────────────────────────────────────────────────────────┐
│          Supabase Auth (Servidor)                       │
│  • Valida email único                                   │
│  • Hashea password con bcrypt                           │
│  • Almacena en auth.users                               │
│  • Genera JWT token                                     │
│  • Envía email de verificación                          │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│     PostgreSQL Database (Supabase)                      │
│                                                         │
│  auth.users INSERT:                                     │
│  {                                                      │
│    id: "uuid-abc123",                                   │
│    email: "samuel@gmail.com",                           │
│    encrypted_password: "$2a$10$...",  ✅ HASHEADO      │
│    user_metadata: {                                     │
│      firstName: "Samuel",                               │
│      lastName: "López",                                 │
│      birthDate: "1999-03-15",                           │
│      username: "samuel-lopez"                           │
│    }                                                    │
│  }                                                      │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────────┐
│    TRIGGER: create_user_profile_on_signup()             │
│  Automáticamente crea:                                  │
│                                                         │
│  1. profiles INSERT:                                    │
│     {                                                   │
│       user_id: "uuid-abc123",                           │
│       display_name: "samuel-lopez",                     │
│       slug: "samuel-lopez-abc1",                        │
│       bio: null,                                        │
│       avatar_url: null,                                 │
│       accent_color: "#ec4899",                          │
│       button_style: "soft"                              │
│     }                                                   │
│                                                         │
│  2. user_stats INSERT:                                  │
│     {                                                   │
│       user_id: "uuid-abc123",                           │
│       total_clicks: 0,                                  │
│       total_views: 0                                    │
│     }                                                   │
│                                                         │
│  3. subscriptions INSERT:                               │
│     {                                                   │
│       user_id: "uuid-abc123",                           │
│       plan: "free",                                     │
│       status: "active"                                  │
│     }                                                   │
└──────────────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│       Frontend recibe JWT token                         │
│  localStorage se llena automáticamente:                 │
│                                                         │
│  {                                                      │
│    "supabase.auth.token": "eyJhbGc...",                │
│    "supabase.auth.refresh_token": "...",               │
│    "supabase.auth.expires_in": 3600                    │
│  }                                                      │
│                                                         │
│  ✅ Sesión persistente y segura                         │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│              Dashboard Cargado                          │
│  Usuario puede:                                         │
│  • Ver su perfil público: /u/samuel-lopez-abc1         │
│  • Editar su perfil                                     │
│  • Agregar enlaces                                      │
│  • Ver estadísticas                                     │
└─────────────────────────────────────────────────────────┘
```

---

## 2️⃣ FLUJO DE LOGIN

### AHORA (Mock) ❌

```
┌──────────────────────────────────┐
│  Usuario ingresa credenciales    │
│  Email: samuel@gmail.com         │
│  Password: Abc123$Pass!          │
│  Recordar sesión: ✓              │
└────────────────┬─────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────┐
│   auth.ts verifica en localStorage       │
│   ❌ Busca: linkbio-mock-users           │
│   ❌ Compara: password === "Abc123$..."  │
│   ❌ SIN ENCRIPTACIÓN                    │
└────────────────┬─────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────┐
│   ✅ Login exitoso (si coincide)         │
│   Guarda en localStorage/sessionStorage  │
│   ⚠️ Solo funciona en este navegador     │
└──────────────────────────────────────────┘
```

---

### DESPUÉS (Supabase) ✅

```
┌──────────────────────────────────────────┐
│  Usuario ingresa credenciales            │
│  Email: samuel@gmail.com                 │
│  Password: Abc123$Pass!                  │
│  Recordar sesión: ✓                      │
└────────────────┬─────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────┐
│   auth.ts valida en CLIENTE:             │
│   ✓ Email es válido                      │
│   ✓ Password no es vacía                 │
└────────────────┬─────────────────────────┘
                 │
                 ▼
        ┌─────────────────────┐
        │   Enviar a servidor │
        │      HTTPS POST     │
        └────────────┬────────┘
                     │
                     ▼
┌──────────────────────────────────────────┐
│   Supabase Auth verifica:                │
│   1. Busca usuario por email             │
│   2. Compara hash(password)              │
│   3. Genera JWT token                    │
│   4. Devuelve sesión                     │
└────────────────┬─────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────┐
│   Response exitoso:                      │
│   {                                      │
│     "access_token": "eyJhbGc...",        │
│     "refresh_token": "...",              │
│     "expires_in": 3600,                  │
│     "user": {                            │
│       "id": "uuid-abc123",               │
│       "email": "samuel@gmail.com"        │
│     }                                    │
│   }                                      │
└────────────────┬─────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────┐
│   localStorage se llena automáticamente: │
│   supabase.auth.token = "eyJhbGc..."    │
│   supabase.auth.refresh_token = "..."   │
│   supabase.auth.expires_in = 3600       │
│                                          │
│   ✅ Seguro (no el password)             │
│   ✅ Funciona en cualquier navegador     │
└────────────────┬─────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────┐
│   JWT Token Activo                       │
│   Todos los requests incluyen:           │
│   Authorization: Bearer eyJhbGc...      │
│                                          │
│   Supabase verifica que sea válido       │
│   y que no haya expirado                 │
└────────────────┬─────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────┐
│   Dashboard Cargado ✅                   │
└──────────────────────────────────────────┘
```

---

## 3️⃣ FLUJO DE RESET DE CONTRASEÑA

### AHORA (Mock) ❌

```
Usuario hace clic en "Olvidé mi contraseña"
        ↓
Ingresa email: samuel@gmail.com
        ↓
auth.ts genera código random (100000-999999)
        ↓
❌ Código guardado en sessionStorage (visible en DevTools)
        ↓
Usuario ingresa código de 6 dígitos
        ↓
❌ Verifica contra sessionStorage (texto plano)
        ↓
Usuario ingresa nueva contraseña
        ↓
❌ Actualiza contraseña en localStorage (sin encriptación)
        ↓
⚠️ Solo funciona si no borró sessionStorage
⚠️ Password sigue siendo texto plano
```

---

### DESPUÉS (Supabase) ✅

```
┌─────────────────────────────────────────────────────────┐
│  Usuario hace clic en "Olvidé mi contraseña"            │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Ingresa email: samuel@gmail.com                        │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  auth.ts envía a Supabase:                              │
│  resetPasswordForEmail('samuel@gmail.com')              │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Supabase Auth:                                         │
│  1. Busca si existe el email                            │
│  2. Genera token temporal (válido 60 min)               │
│  3. Crea link de reset                                  │
│  4. Envía email                                         │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Email recibido:                                        │
│  ┌─────────────────────────────────────────────────────┐
│  │ Hola Samuel,                                        │
│  │                                                     │
│  │ [Cambiar contraseña]                               │
│  │ https://tuapp.com/reset?token=abc123def456...     │
│  │                                                     │
│  │ Este link expira en 60 minutos                      │
│  └─────────────────────────────────────────────────────┘
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Usuario hace clic en el link                           │
│  URL: /reset?token=abc123def456...                      │
│  ✅ Token está en la URL                                │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  App.tsx detecta token en URL                           │
│  Muestra formulario:                                    │
│  [Nueva contraseña]                                     │
│  [Confirmar contraseña]                                │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  Usuario ingresa nueva contraseña                       │
│  NewPassword123$                                        │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  auth.ts:                                               │
│  1. Valida que sea fuerte                               │
│  2. Envía a Supabase (token + password)                 │
│  3. Supabase verifica token                             │
│  4. Supabase hashea y actualiza password                │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  ✅ Contraseña actualizada                              │
│  Token invalidado (no se puede usar de nuevo)          │
│  Email de confirmación enviado                          │
│  Usuario puede login con nueva contraseña               │
└─────────────────────────────────────────────────────────┘
```

---

## 4️⃣ FLUJO DE LOGOUT

### AHORA (Mock) ❌

```
Usuario hace clic "Cerrar sesión"
        ↓
localStorage.removeItem(AUTH_STORAGE_KEY)
sessionStorage.removeItem(AUTH_STORAGE_KEY)
        ↓
❌ Solo se limpia localmente
❌ Si abre en otro navegador, sigue autenticado
```

---

### DESPUÉS (Supabase) ✅

```
Usuario hace clic "Cerrar sesión"
        ↓
auth.ts.logout()
        ├─ supabase.auth.signOut()  ← Notifica servidor
        └─ localStorage.clear()      ← Limpia cliente
        ↓
Supabase:
  • Invalida el JWT token
  • Marca sesión como cerrada
  • En otros navegadores se detecta inmediatamente
        ↓
Frontend limpia localStorage
        ↓
✅ Sesión terminada en TODOS lados
```

---

## 5️⃣ FLUJO DE VERIFICACIÓN DE SESIÓN (App Init)

### AHORA (Mock) ❌

```
App.tsx carga
        ↓
getSession() busca en localStorage
        ↓
Si encuentra datos → autenticado
Si no → mostrar Login
        ↓
❌ Si alguien borra localStorage, se desautentica
❌ Sin validación en servidor
```

---

### DESPUÉS (Supabase) ✅

```
┌──────────────────────────────────┐
│  App.tsx carga en useEffect      │
└────────────┬─────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│  supabase.auth.getSession()      │
│  Verifica si hay JWT en storage  │
└────────────┬─────────────────────┘
             │
             ▼
        ¿JWT existe?
         /         \
        /           \
      SÍ             NO
      │              │
      ▼              ▼
   ¿Es válido?   Mostrar Login
   /        \
  SÍ         NO (expirado)
  │          │
  │      Intentar refresh
  │      con refresh_token
  │          │
  │      ¿Refresh ok?
  │       /      \
  │      SÍ        NO
  │      │         │
  │      ▼         ▼
  │   Nuevo    Mostrar
  │   token    Login
  │
  └──────────┐
             │
             ▼
  ✅ Dashboard Cargado
     con usuario autenticado
```

---

## 📊 Comparación Visual

| Aspecto | AHORA ❌ | DESPUÉS ✅ |
|---------|----------|-----------|
| **Dónde se guarda** | localStorage | Supabase + JWT |
| **Seguridad** | 🔓 Baja | 🔒 Alta |
| **Encriptación** | ❌ Texto plano | ✅ bcrypt + HTTPS |
| **Reset password** | Mock | Email real |
| **Crear perfil** | Manual | Automático (trigger) |
| **Funciona en** | 1 navegador | Todos |
| **Código necesario** | 500 líneas | 200 líneas |
| **Mantenimiento** | ❌ Alto | ✅ Supabase lo hace |

