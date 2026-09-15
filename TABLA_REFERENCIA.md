# 📊 ESTRUCTURA DE BD - LINKBIO

## TABLAS Y RELACIONES

```
┌──────────────────────────────────────────────────────────────────────┐
│                        auth.users (Supabase Auth)                    │
│  ┌─ id (UUID, PK)      ┌─ email (STRING, UNIQUE)   ┌─ created_at    │
└──┼────────────────────┼──────────────────────────┼──────────────────┘
   │                    │                          │
   ├─ 1:1              │                          ├─ 1:1
   │                    │                          │
   v                    v                          v
┌──────────────┐   ┌──────────────┐         ┌──────────────────┐
│  profiles    │   │  user_stats  │         │ subscriptions    │
├──────────────┤   ├──────────────┤         ├──────────────────┤
│ • id (PK)    │   │ • id (PK)    │         │ • id (PK)        │
│ • user_id(FK)│   │ • user_id(FK)│         │ • user_id (FK)   │
│ • display_name   │ • total_clicks   │         │ • plan           │
│ • bio        │   │ • total_views    │         │ • status         │
│ • avatar_url │   │ • monthly_active │         │ • started_at     │
│ • accent_color   │ • conversion_rate│         │ • expires_at     │
│ • button_style   │ • updated_at     │         │ • billing_period │
│ • slug       │   └──────────────┘         └──────────────────┘
└────┬─────────┘   (Actualizado por
     │             trigger al hacer click)
     │ 1:N
     │
     v
┌─────────────────────────┐
│   profile_links         │
├─────────────────────────┤
│ • id (PK)               │
│ • profile_id (FK)       │
│ • label                 │
│ • href                  │
│ • icon                  │
│ • position              │
│ • is_active             │
└────┬────────────────────┘
     │ 1:N
     │
     v
┌────────────────────────┐
│  link_clicks           │
├────────────────────────┤
│ • id (PK)              │
│ • link_id (FK)         │
│ • user_agent           │
│ • ip_address           │
│ • referrer             │
│ • timestamp            │
└────────────────────────┘
(Tracking anónimo)
```

---

## PERMISOS DE ACCESO (RLS)

| Tabla | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| **profiles** | 🌐 | 👤 | 👤 | 👤 |
| **profile_links** | 🌐 | 👤 | 👤 | 👤 |
| **user_stats** | 👤 | ⚙️ | ⚙️ | ❌ |
| **link_clicks** | 👤 | 🌐 | ❌ | ❌ |
| **subscriptions** | 👤 | ⚙️ | ⚙️ | ❌ |

🌐 = Público  |  👤 = Usuario autenticado  |  ⚙️ = Sistema  |  ❌ = Bloqueado

---

## CAMPOS PRINCIPALES POR TABLA

### 1. profiles (Perfil del usuario)
```
{
  id: "uuid-1234",
  user_id: "auth-uuid",
  display_name: "fckn.daybeat",
  bio: "Contenido, ritmo y vibes",
  avatar_url: "https://...",
  accent_color: "#ec4899",
  button_style: "soft",
  slug: "fckn-daybeat-a1b2",
  created_at: "2024-01-15T...",
  updated_at: "2024-01-15T..."
}
```

### 2. profile_links (Enlaces)
```
{
  id: "uuid-link-1",
  profile_id: "uuid-1234",
  label: "YouTube",
  href: "https://youtube.com/@user",
  icon: "youtube",
  position: 0,
  is_active: true,
  created_at: "2024-01-15T..."
}
```

### 3. user_stats (Estadísticas)
```
{
  id: "uuid-stats",
  user_id: "auth-uuid",
  total_clicks: 1250,
  total_views: 3400,
  monthly_active_users: 280,
  conversion_rate: 36.76,
  updated_at: "2024-01-15T..."
}
```

### 4. link_clicks (Analítica)
```
{
  id: "uuid-click-1",
  link_id: "uuid-link-1",
  user_agent: "Mozilla/5.0...",
  ip_address: "192.168.1.1",
  referrer: "google.com",
  timestamp: "2024-01-15T10:30:00Z"
}
```

### 5. subscriptions (Planes)
```
{
  id: "uuid-sub",
  user_id: "auth-uuid",
  plan: "pro",
  status: "active",
  started_at: "2024-01-15T...",
  expires_at: "2025-01-15T...",
  billing_period: "monthly",
  created_at: "2024-01-15T..."
}
```

---

## ICONOS VÁLIDOS (profile_links.icon)

youtube | tiktok | instagram | facebook | x (twitter) | linkedin | spotify | 
twitch | github | discord | whatsapp | telegram | blog | music | globe | link

---

## ENUMS / VALORES FIJOS

### button_style
- `soft`
- `outline`

### plan (subscriptions)
- `free`
- `pro`
- `premium`

### status (subscriptions)
- `active`
- `cancelled`
- `expired`

### billing_period (subscriptions)
- `monthly`
- `yearly`

---

## ÍNDICES PARA PERFORMANCE

```
profiles:
  - idx_profiles_user_id (búsqueda por usuario)
  - idx_profiles_slug (URL pública)

profile_links:
  - idx_profile_links_profile_id (get links)
  - idx_profile_links_position (orden)

user_stats:
  - idx_user_stats_user_id

link_clicks:
  - idx_link_clicks_link_id (analytics)
  - idx_link_clicks_timestamp (recientes)
  - idx_link_clicks_link_timestamp (range queries)

subscriptions:
  - idx_subscriptions_user_id
  - idx_subscriptions_status
  - idx_subscriptions_expires_at
```

---

## TRIGGERS AUTOMÁTICOS

1. **update_profiles_updated_at** → Actualiza `updated_at` cuando se edita el perfil
2. **create_user_profile_on_signup** → Al registrarse, crea: profiles + user_stats + subscriptions
3. **track_link_click** → Al hacer click, incrementa `user_stats.total_clicks`

---

## FLUJO DE USUARIO TÍPICO

```
1. REGISTRO
   └─> auth.users.INSERT (email/password)
       └─> Trigger: crea profiles + user_stats + subscriptions

2. EDITAR PERFIL
   └─> profiles.UPDATE (display_name, bio, avatar, etc)
       └─> Trigger: update_updated_at

3. AGREGAR ENLACES
   └─> profile_links.INSERT (label, href, icon)

4. VISITA PÚBLICA
   └─> GET profiles WHERE slug = 'slug'
   └─> GET profile_links WHERE profile_id = id
   └─> Renderizar perfil

5. CLICK EN ENLACE
   └─> link_clicks.INSERT (user_agent, ip, timestamp)
       └─> Trigger: user_stats.total_clicks++

6. VER ESTADÍSTICAS
   └─> GET user_stats WHERE user_id = auth.uid()
       └─> Mostrar clicks, views, conversion_rate
```

---

## LIMPIEZA Y MANTENIMIENTO

- **link_clicks**: Archive después de 90 días (muchas inserciones)
- **user_stats**: Nunca se elimina, solo actualiza
- **subscriptions**: Marca como 'expired' pero no elimina

---

## VARIABLES DE ENTORNO NECESARIAS

```
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...
```

