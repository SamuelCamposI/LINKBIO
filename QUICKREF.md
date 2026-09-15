# 🎯 Referencia Rápida - Base de Datos LINKBIO

## Tablas Principales (Quick Reference)

### 📋 **PROFILES** - Datos del perfil del usuario
```
id: UUID
user_id: UUID (FK → auth.users)
display_name: "fckn.daybeat"
bio: "Contenido, ritmo y vibes"
avatar_url: "https://..."
accent_color: "#ec4899"
button_style: "soft" | "outline"
slug: "fckn-daybeat-a1b2" (UNIQUE)
created_at, updated_at
```
**Acceso:** 🌐 Público (lectura) | 👤 Privado (escritura)

---

### 🔗 **PROFILE_LINKS** - Enlaces en el perfil
```
id: UUID
profile_id: UUID (FK → profiles)
label: "YouTube"
href: "https://youtube.com/@user"
icon: "youtube" | "tiktok" | "instagram" | etc
position: 0 (orden)
is_active: true
created_at
```
**Acceso:** 🌐 Público (lectura) | 👤 Privado (escritura)

---

### 📊 **USER_STATS** - Estadísticas
```
id: UUID
user_id: UUID (FK → auth.users)
total_clicks: 1250
total_views: 3400
monthly_active_users: 280
conversion_rate: 36.76%
updated_at
```
**Acceso:** 👤 Privado (solo dueño)

---

### 📈 **LINK_CLICKS** - Analítica de clics
```
id: UUID
link_id: UUID (FK → profile_links)
user_agent: "Mozilla/5.0..."
ip_address: "192.168.1.1"
referrer: "google.com"
timestamp: 2024-01-15T10:30:00Z
```
**Acceso:** 👤 Privado (lectura) | 🌐 Público (inserción)

---

### 💳 **SUBSCRIPTIONS** - Planes
```
id: UUID
user_id: UUID (FK → auth.users)
plan: "free" | "pro" | "premium"
status: "active" | "cancelled" | "expired"
started_at: 2024-01-15
expires_at: 2025-01-15
billing_period: "monthly" | "yearly"
created_at
```
**Acceso:** 👤 Privado | ⚙️ Sistema

---

## Queries Comunes

### Obtener Perfil Público
```sql
SELECT p.*, COUNT(pl.id) as link_count
FROM profiles p
LEFT JOIN profile_links pl ON p.id = pl.profile_id
WHERE p.slug = 'fckn-daybeat-a1b2'
GROUP BY p.id;
```

### Obtener Links Activos
```sql
SELECT * FROM profile_links
WHERE profile_id = 'uuid-xxx' AND is_active = true
ORDER BY position ASC;
```

### Clics Últimos 7 Días
```sql
SELECT 
  pl.label,
  COUNT(*) as clicks
FROM link_clicks lc
JOIN profile_links pl ON lc.link_id = pl.id
WHERE lc.timestamp > NOW() - INTERVAL '7 days'
  AND pl.profile_id = 'uuid-xxx'
GROUP BY pl.id
ORDER BY clicks DESC;
```

### Actualizar Perfil
```sql
UPDATE profiles
SET display_name = 'Nuevo Nombre',
    bio = 'Nueva bio',
    updated_at = NOW()
WHERE user_id = auth.uid();
```

### Insertar Link
```sql
INSERT INTO profile_links 
(profile_id, label, href, icon, position)
VALUES ('uuid-profile', 'YouTube', 'https://...', 'youtube', 0)
RETURNING *;
```

---

## TypeScript Types

```typescript
// Usuario autenticado
type User = {
  id: string
  email: string
}

// Perfil completo
type Profile = {
  id: string
  user_id: string
  display_name: string
  bio?: string
  avatar_url?: string
  accent_color: string
  button_style: 'soft' | 'outline'
  slug: string
  created_at: string
  updated_at: string
}

// Link individual
type ProfileLink = {
  id: string
  profile_id: string
  label: string
  href: string
  icon: ProfileIcon
  position: number
  is_active: boolean
  created_at: string
}

// Tipos de iconos válidos
type ProfileIcon = 
  | 'youtube' | 'tiktok' | 'instagram' | 'facebook' | 'x'
  | 'linkedin' | 'spotify' | 'twitch' | 'github' | 'discord'
  | 'whatsapp' | 'telegram' | 'blog' | 'music' | 'globe' | 'link'

// Estadísticas
type UserStats = {
  id: string
  user_id: string
  total_clicks: number
  total_views: number
  monthly_active_users: number
  conversion_rate: number
  updated_at: string
}

// Suscripción
type Subscription = {
  id: string
  user_id: string
  plan: 'free' | 'pro' | 'premium'
  status: 'active' | 'cancelled' | 'expired'
  started_at: string
  expires_at?: string
  billing_period?: 'monthly' | 'yearly'
  created_at: string
}
```

---

## Operaciones en Supabase Client

### Leer Perfil Público
```typescript
const { data } = await supabase
  .from('profiles')
  .select('*, profile_links(*)')
  .eq('slug', slug)
  .single()
```

### Leer Perfil del Usuario
```typescript
const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', auth.uid())
  .single()
```

### Actualizar Perfil
```typescript
const { data, error } = await supabase
  .from('profiles')
  .update({
    display_name: 'Nuevo nombre',
    bio: 'Nueva bio'
  })
  .eq('user_id', auth.uid())
  .select()
```

### Agregar Link
```typescript
const { data, error } = await supabase
  .from('profile_links')
  .insert({
    profile_id: profileId,
    label: 'YouTube',
    href: 'https://youtube.com/@user',
    icon: 'youtube',
    position: 0
  })
  .select()
```

### Registrar Click (Anonymous)
```typescript
const { error } = await supabase
  .from('link_clicks')
  .insert({
    link_id: linkId,
    user_agent: navigator.userAgent,
    timestamp: new Date().toISOString()
  })
```

### Obtener Estadísticas
```typescript
const { data } = await supabase
  .from('user_stats')
  .select('*')
  .eq('user_id', auth.uid())
  .single()
```

---

## Flujos de Desarrollo

### 1. Usuario Se Registra
```
email/password → auth.users.INSERT
              ↓
       Trigger: create_user_profile_on_signup()
              ↓
       profiles.INSERT (nombre del email)
       user_stats.INSERT (vacío)
       subscriptions.INSERT (plan=free)
              ↓
       Usuario listo ✅
```

### 2. Usuario Edita Perfil
```
UI → app.tsx state → supabase.profiles.UPDATE
                        ↓
                  Trigger: update_updated_at()
                        ↓
              Perfil actualizado ✅
```

### 3. Usuario Agrega Link
```
UI → profileConfig.tsx → supabase.profile_links.INSERT
                              ↓
                    Link visible en perfil ✅
```

### 4. Visita Pública
```
Alguien abre /u/slug
      ↓
GET profiles WHERE slug=slug (público)
      ↓
GET profile_links WHERE profile_id=id
      ↓
Perfil renderizado
```

### 5. Click en Link
```
Usuario hace click
      ↓
Frontend: supabase.link_clicks.INSERT
      ↓
Trigger: track_link_click()
      ↓
user_stats.total_clicks++ ✅
```

---

## Límites y Límpieza

| Entidad | Límite | Acción |
|---------|--------|--------|
| Links por perfil | 50 | No enforced, pero UI podría limitarse |
| Tamaño de bio | 500 chars | Validar en frontend |
| Avatar | 5MB | Validar en frontend |
| URL | 2000 chars | Validar en frontend |
| Link clicks | Sin límite | Archive después de 90 días |

---

## Debug Rápido

### Ver Console del Browser
```javascript
// Ver usuario actual
const { data } = await supabase.auth.getUser()
console.log(data.user)

// Ver perfil del usuario
const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', data.user.id)
  .single()
console.log(data)

// Ver todos los links
const { data } = await supabase
  .from('profile_links')
  .select('*')
  .eq('profile_id', profileId)
console.log(data)

// Ver estadísticas
const { data } = await supabase
  .from('user_stats')
  .select('*')
  .eq('user_id', data.user.id)
  .single()
console.log(data)
```

---

## Archivos de Documentación

- 📖 [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Esquema completo
- 📊 [DIAGRAMA_ER.md](./DIAGRAMA_ER.md) - Diagrama entidad-relación
- 🚀 [IMPLEMENTACION_BD.md](./IMPLEMENTACION_BD.md) - Guía de setup
- ⚡ [QUICKREF.md](./QUICKREF.md) - Este archivo (referencia rápida)
- 📝 [schema.sql](./schema.sql) - Script SQL completo

---

## Contacto & Soporte

Para dudas sobre la estructura de datos:
- Revisa [DIAGRAMA_ER.md](./DIAGRAMA_ER.md)
- Consulta [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)
- Síguelo con [IMPLEMENTACION_BD.md](./IMPLEMENTACION_BD.md)

