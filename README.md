# fckn.daybeat Links

Sitio de redireccionamiento (link-in-bio) listo para Vercel.

## Desarrollo local

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Despliegue en Vercel

1. Sube este proyecto a GitHub (o importa la carpeta en Vercel).
2. En [vercel.com](https://vercel.com) → **Add New Project** → selecciona el repo.
3. Framework preset: **Vite** (se detecta solo).
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Deploy.

O con CLI:

```bash
npx vercel
```

## Personalizar enlaces

Edita las URLs en `src/App.tsx` (`PROFILE` y `LINKS`).
