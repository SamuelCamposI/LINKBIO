# 📊 Esquema de Base de Datos - LINKBIO

## Descripción General
Base de datos Supabase para la aplicación Link Bio, que permite a los usuarios crear perfiles personalizados con múltiples enlaces compartibles.

---

## 📋 Tablas

### 1. **users**
Tabla de usuarios autenticados (gestionada por Supabase Auth)

| Atributo | Tipo | Constraints | Descripción |
|----------|------|-----------|-------------|
| `id` | `UUID` | PK | ID único del usuario (generado por Supabase Auth) |
| `email` | `VARCHAR` | UNIQUE, NOT NULL | Correo electrónico del usuario |
| `created_at` | `TIMESTAMP` | NOT NULL | Fecha de creación |
| `last_sign_in_at` | `TIMESTAMP` | NULL | Último acceso |

**Relaciones:**
- 1 a N con `profiles`
- 1 a N con `profile_links`
- 1 a N con `user_stats`

---

### 2. **profiles**
Datos personalizados del perfil de cada usuario

| Atributo | Tipo | Constraints | Descripción |
|----------|------|-----------|-------------|
| `id` | `UUID` | PK | ID único del perfil |
| `user_id` | `UUID` | FK → users, NOT NULL | Usuario propietario |
| `display_name` | `VARCHAR(100)` | NOT NULL | Nombre mostrado |
| `bio` | `TEXT` | NULL | Biografía del usuario |
| `avatar_url` | `VARCHAR(500)` | NULL | URL de la foto de perfil |
| `accent_color` | `VARCHAR(7)` | DEFAULT: '#ec4899' | Color principal (hex) |
| `button_style` | `VARCHAR(20)` | DEFAULT: 'soft' | Estilo: 'soft' \| 'outline' |
| `slug` | `VARCHAR(100)` | UNIQUE | Slug para URL pública |
| `created_at` | `TIMESTAMP` | NOT NULL | Fecha de creación |
| `updated_at` | `TIMESTAMP` | NOT NULL | Última actualización |

**Índices:**
- `user_id` (para búsquedas rápidas)
- `slug` (para URLs públicas)

---

### 3. **profile_links**
Enlaces individuales en el perfil del usuario

| Atributo | Tipo | Constraints | Descripción |
|----------|------|-----------|-------------|
| `id` | `UUID` | PK | ID único del enlace |
| `profile_id` | `UUID` | FK → profiles, NOT NULL | Perfil al que pertenece |
| `label` | `VARCHAR(100)` | NOT NULL | Texto visible del enlace |
| `href` | `VARCHAR(2000)` | NOT NULL | URL destino |
| `icon` | `VARCHAR(50)` | NOT NULL | Tipo de icono (youtube, tiktok, instagram, etc.) |
| `position` | `INTEGER` | NOT NULL | Orden de aparición |
| `is_active` | `BOOLEAN` | DEFAULT: true | Visible en el perfil |
| `created_at` | `TIMESTAMP` | NOT NULL | Fecha de creación |

**Índices:**
- `profile_id` (para obtener todos los links de un perfil)
- `position` (para ordenar)

**Relaciones:**
- N a 1 con `profiles`
- 1 a N con `link_clicks`

---

### 4. **user_stats**
Estadísticas y métricas de cada usuario

| Atributo | Tipo | Constraints | Descripción |
|----------|------|-----------|-------------|
| `id` | `UUID` | PK | ID único |
| `user_id` | `UUID` | FK → users, NOT NULL | Usuario |
| `total_clicks` | `INTEGER` | DEFAULT: 0 | Total de clics en enlaces |
| `total_views` | `INTEGER` | DEFAULT: 0 | Vistas del perfil |
| `monthly_active_users` | `INTEGER` | DEFAULT: 0 | Usuarios activos/mes |
| `conversion_rate` | `DECIMAL(5,2)` | DEFAULT: 0 | Tasa de conversión (%) |
| `updated_at` | `TIMESTAMP` | NOT NULL | Última actualización |

**Relaciones:**
- N a 1 con `users`

---

### 5. **link_clicks**
Registro de clics en cada enlace (analítica)

| Atributo | Tipo | Constraints | Descripción |
|----------|------|-----------|-------------|
| `id` | `UUID` | PK | ID único |
| `link_id` | `UUID` | FK → profile_links, NOT NULL | Enlace clickeado |
| `user_agent` | `TEXT` | NULL | Información del navegador |
| `ip_address` | `VARCHAR(45)` | NULL | IP del usuario |
| `referrer` | `VARCHAR(500)` | NULL | De dónde vino |
| `timestamp` | `TIMESTAMP` | NOT NULL, DEFAULT: NOW() | Cuándo ocurrió |

**Índices:**
- `link_id, timestamp` (para analítica por periodo)
- `timestamp` (para queries recientes)

---

### 6. **subscriptions**
Planes de suscripción de usuarios

| Atributo | Tipo | Constraints | Descripción |
|----------|------|-----------|-------------|
| `id` | `UUID` | PK | ID único |
| `user_id` | `UUID` | FK → users, NOT NULL | Usuario suscrito |
| `plan` | `VARCHAR(50)` | NOT NULL | Plan: 'free', 'pro', 'premium' |
| `status` | `VARCHAR(50)` | DEFAULT: 'active' | Estado: 'active', 'cancelled', 'expired' |
| `started_at` | `TIMESTAMP` | NOT NULL | Fecha de inicio |
| `expires_at` | `TIMESTAMP` | NULL | Fecha de expiración |
| `billing_period` | `VARCHAR(20)` | NULL | 'monthly', 'yearly' |
| `created_at` | `TIMESTAMP` | NOT NULL |  |

**Relaciones:**
- N a 1 con `users`

---

## 🔗 Diagrama de Relaciones

```
┌─────────────────────────────────┐
│         users (Auth)            │
│  • id (PK)                      │
│  • email                        │
│  • created_at                   │
└────────────┬────────────────────┘
             │
             │ 1:N
             │
        ┌────┴────────┬─────────────────┬──────────────────┐
        │             │                 │                  │
        v             v                 v                  v
   ┌─────────┐  ┌────────────┐  ┌──────────────┐  ┌──────────────┐
   │profiles │  │ user_stats │  │subscriptions │  │ link_clicks  │
   │  • id   │  │   • id     │  │    • id      │  │    • id      │
   │  • slug │  │   • stats  │  │   • plan     │  │   • link_id  │
   │  • name │  │            │  │   • status   │  │   • timestamp│
   └────┬────┘  └────────────┘  └──────────────┘  └──────────────┘
        │
        │ 1:N
        │
   ┌────v──────────────────┐
   │  profile_links (FK)   │
   │  • id                 │
   │  • profile_id         │──────────────┬──────────────┐
   │  • label              │              │              │
   │  • href               │              │              v
   │  • icon               │              │     ┌──────────────┐
   │  • position           │              └────>│ link_clicks  │
   │  • is_active          │                    │  • link_id   │
   └───────────────────────┘                    └──────────────┘
```

---

## 📝 Tipos TypeScript Relacionados

```typescript
// Corresponde con tabla: users
export type User = {
  id: string
  email: string
  created_at: string
  last_sign_in_at?: string
}

// Corresponde con tabla: profiles
export type ProfileConfig = {
  displayName: string
  bio: string
  avatar: string
  accent: string
  buttonStyle: 'soft' | 'outline'
  links: ProfileLink[]
}

// Corresponde con tabla: profile_links
export type ProfileLink = {
  id: string
  label: string
  href: string
  icon: ProfileIcon
}

// Corresponde con tabla: user_stats
export type UserStats = {
  totalClicks: number
  totalViews: number
  monthlyActiveUsers: number
  conversionRate: number
}

// Corresponde con tabla: subscriptions
export type Subscription = {
  id: string
  plan: 'free' | 'pro' | 'premium'
  status: 'active' | 'cancelled' | 'expired'
  billingPeriod: 'monthly' | 'yearly'
}
```

---

## 🛡️ Políticas de Seguridad (RLS)

### Users Table
- ✅ Lectura: Solo el usuario propietario
- ✅ Inserción: Solo durante registro (Supabase Auth)
- ✅ Actualización: Solo el propietario

### Profiles Table
- ✅ Lectura: Público (para perfiles compartidos)
- ✅ Lectura por slug: Cualquiera
- ✅ Inserción/Actualización: Solo el propietario

### Profile Links Table
- ✅ Lectura: Público
- ✅ Inserción/Actualización: Solo el propietario del perfil

### User Stats Table
- ✅ Lectura: Solo el propietario
- ✅ Inserción/Actualización: Solo por funciones del sistema

### Link Clicks Table
- ✅ Lectura: Solo el propietario (ver analytics)
- ✅ Inserción: Por trigger automático

---

## 🚀 Información Adicional

**Variables de Entorno Necesarias:**
```
VITE_SUPABASE_URL=https://[project].supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
```

**Tabla de Prueba Actual:** `prueba`
(Se puede eliminar una vez que se implemente el esquema real)

