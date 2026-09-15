# 🚀 Guía de Implementación - Base de Datos LINKBIO

## Índice
1. [Requisitos Previos](#requisitos-previos)
2. [Crear Proyecto Supabase](#crear-proyecto-supabase)
3. [Ejecutar Script SQL](#ejecutar-script-sql)
4. [Configurar Storage](#configurar-storage)
5. [Verificar Configuración](#verificar-configuración)
6. [Variables de Entorno](#variables-de-entorno)
7. [Testing](#testing)

---

## Requisitos Previos

✅ Cuenta en [supabase.com](https://supabase.com)  
✅ Proyecto LINKBIO clonado localmente  
✅ Node.js 18+ instalado  
✅ Variables de entorno configuradas  

---

## Crear Proyecto Supabase

### 1. Ir a Supabase Dashboard

1. Abre [app.supabase.com](https://app.supabase.com)
2. Inicia sesión o crea una cuenta
3. Haz clic en **"New Project"**

### 2. Configurar Proyecto

- **Name:** `linkbio` (o el nombre que prefieras)
- **Database Password:** Guarda en lugar seguro
- **Region:** Elige la más cercana a tus usuarios
- **Pricing Plan:** Puedes usar Free para desarrollo

### 3. Copiar Credenciales

Una vez creado el proyecto:

1. Ve a **Settings** → **API**
2. Copia:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public key` → `VITE_SUPABASE_PUBLISHABLE_KEY`

---

## Ejecutar Script SQL

### Opción A: Via Supabase SQL Editor (Recomendado)

1. En el dashboard de tu proyecto, ve a **SQL Editor**
2. Haz clic en **"New Query"**
3. Abre el archivo `schema.sql` del proyecto
4. Copia TODO el contenido
5. Pega en el editor SQL
6. Haz clic en **"Run"** (Ctrl + Enter)

✅ Espera a que se ejecute sin errores

### Opción B: Via CLI

Si tienes la CLI de Supabase instalada:

```bash
# Instalar Supabase CLI
npm install -g supabase

# Conectar a tu proyecto
supabase link

# Ejecutar el script
supabase db push --file schema.sql
```

---

## Configurar Storage

### 1. Crear Bucket para Avatars

1. En el dashboard, ve a **Storage** → **Buckets**
2. Haz clic en **"New bucket"**
3. **Name:** `avatars`
4. **Public bucket:** Elige si quieres URLs públicas
5. Crea el bucket

### 2. Configurar CORS (si es necesario)

Si los avatars se sirven desde un dominio diferente:

1. Ve a **Settings** → **CORS**
2. Agrega tu dominio: `http://localhost:5173` (desarrollo)
3. Agrega tu dominio de producción

### 3. Crear Bucket para Contenido Público

1. Crea otro bucket: `public-content`
2. Hazlo público para servir imágenes

---

## Verificar Configuración

### 1. Verificar Tablas

En **SQL Editor**, ejecuta:

```sql
-- Ver todas las tablas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Ver estructura de profiles
\d public.profiles

-- Ver estructura de profile_links
\d public.profile_links
```

### 2. Verificar Triggers

```sql
-- Ver todos los triggers
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public';
```

### 3. Verificar Políticas RLS

```sql
-- Ver políticas de seguridad
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

---

## Variables de Entorno

### Crear archivo `.env.local`

```bash
# .env.local
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...your-key...
```

### En `vite.config.ts`, los valores se cargan automáticamente via `import.meta.env`

Verifica que ya esté configurado:

```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
```

---

## Testing

### 1. Prueba de Conexión

En `App.tsx` ya hay un test:

```typescript
useEffect(() => {
  async function testSupabaseConnection() {
    const { data, error } = await supabase
      .from('prueba')  // ← Cambiar a 'profiles' cuando esté listo
      .select('*')
      .limit(1)

    if (error) {
      console.error('❌ Error con Supabase:', error)
      return
    }

    console.log('✅ Supabase conectado correctamente')
    console.log('Datos recibidos:', data)
  }

  testSupabaseConnection()
}, [])
```

### 2. Probar Inserción de Datos

En la consola del navegador:

```javascript
import { supabase } from './utils/supabase'

// Insertar un perfil de prueba
const { data, error } = await supabase
  .from('profiles')
  .insert([
    {
      user_id: 'uuid-aqui',
      display_name: 'Test User',
      slug: 'test-user-xyz'
    }
  ])
  .select()

console.log(data, error)
```

### 3. Probar Lectura de Datos

```javascript
// Obtener todos los perfiles
const { data, error } = await supabase
  .from('profiles')
  .select('*')

console.log(data)
```

### 4. Probar Lectura Pública (sin autenticación)

```javascript
// Esto debe funcionar sin usuario autenticado
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('slug', 'test-user-xyz')

console.log(data)
```

---

## Troubleshooting

### ❌ Error: "No rows returned"

**Causa:** No hay datos en la tabla  
**Solución:** Inserta datos de prueba primero

### ❌ Error: "permission denied for schema public"

**Causa:** RLS está bloqueando  
**Solución:** Verifica que seas usuario autenticado o que la tabla tenga `SELECT` público

### ❌ Error: "invalid user_id"

**Causa:** El UUID no existe en `auth.users`  
**Solución:** Usa `auth.uid()` desde el cliente o inserta con un user_id válido

### ❌ Error: "relation 'public.profiles' does not exist"

**Causa:** El script SQL no se ejecutó completamente  
**Solución:** 
1. Abre **SQL Editor**
2. Ejecuta nuevamente `schema.sql` paso a paso
3. Verifica que no haya errores

### ❌ Storage: "No bucket found"

**Causa:** No creaste el bucket `avatars`  
**Solución:** Ve a **Storage** → **Buckets** y crea uno

---

## Estructura de Directorios en Storage

```
storage/
├── avatars/
│   ├── {user_id}/
│   │   └── avatar.png
│   └── {user_id}/
│       └── avatar.jpg
└── public-content/
    ├── banners/
    │   └── {filename}
    └── media/
        └── {filename}
```

---

## Migraciones Futuras

Si necesitas actualizar el esquema:

### Opción A: Vía SQL Editor

1. Abre **SQL Editor**
2. Escribe el ALTER TABLE o CREATE TABLE
3. Ejecuta

### Opción B: Vía Supabase CLI (Recomendado)

```bash
# Crear una migración nueva
supabase migration new add_new_column

# Editar: supabase/migrations/xxxx_add_new_column.sql

# Aplicar
supabase db push
```

---

## Gestión de Datos Sensibles

### 🔐 Credenciales
- NUNCA commits `.env.local` a Git
- Usa `.gitignore` para excluir archivos de env
- En producción, usa Vercel Secrets o similar

### 🔒 RLS Policies
- Verificadas automáticamente en cada query
- El cliente NO puede bypassear (a menos que sea admin)
- Las políticas son ejecutadas a nivel de BD

### 📊 Backups
- Supabase hace backups automáticos
- Ve a **Settings** → **Backups** para ver historial
- Puedes descargar punto de restauración

---

## Comandos Útiles SQL

```sql
-- Contar registros por tabla
SELECT schemaname, tablename, 
       (SELECT count(*) FROM pg_class p WHERE p.relname=t.tablename)
FROM pg_tables t WHERE schemaname = 'public';

-- Ver tamaño de tablas
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Vaciar tabla (CUIDADO!)
TRUNCATE TABLE public.link_clicks CASCADE;

-- Ver los últimos 10 clicks
SELECT * FROM public.link_clicks 
ORDER BY timestamp DESC LIMIT 10;

-- Estadísticas por perfil
SELECT 
  p.slug,
  p.display_name,
  COUNT(pl.id) as total_links,
  COALESCE(us.total_clicks, 0) as clicks,
  COALESCE(us.total_views, 0) as views
FROM public.profiles p
LEFT JOIN public.profile_links pl ON p.id = pl.profile_id
LEFT JOIN public.user_stats us ON p.user_id = us.user_id
GROUP BY p.id, us.id;
```

---

## Próximos Pasos

1. ✅ Ejecutar `schema.sql`
2. ✅ Configurar Storage buckets
3. ✅ Agregar variables de entorno
4. ✅ Ejecutar tests básicos
5. ✅ Reemplazar tabla `prueba` con tabla real en App.tsx
6. ✅ Implementar funcionalidad de perfiles
7. ✅ Agregar tracking de clicks
8. ✅ Implementar suscripciones

---

## Recursos

- [Docs de Supabase](https://supabase.com/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Docs](https://supabase.com/docs/guides/storage)
- [Migrations](https://supabase.com/docs/guides/cli/local-development)

