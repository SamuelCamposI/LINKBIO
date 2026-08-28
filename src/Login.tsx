/**
 * Login.tsx
 * ---------------
 * Pantalla de inicio de sesión (lo primero que ves si no estás logueado).
 *
 * Qué hice aquí:
 * 1) Layout tipo Facebook: visual a la izquierda + form a la derecha
 * 2) Mockup de iPhone 17 Pro Silver (librería @mockifydev/react)
 * 3) Toggle "Recordar sesión" que rellena el usuario demo
 * 4) Links estáticos (olvidé contraseña, registro, términos) sin redirección
 *
 * Cómo comprobar que funciona:
 * - Activa "Recordar sesión" -> se llenan samuel@gmail.com / 1234
 * - Dale a Entrar -> te manda al dashboard (App.tsx pone authed = true)
 * - Si pones mal la pass, sale el error en rojo
 */
import { motion } from 'framer-motion'
// Mockup real de iPhone (frame oficial). Solo uso el Silver en /public/mockify
import { DeviceMockup, iPhone17Pro } from '@mockifydev/react'
import { ArrowUpRight, BarChart3, Eye, EyeOff, Link2, Lock, Mail, MousePointerClick, Sparkles } from 'lucide-react'
import {
  FaFacebook,
  FaInstagram,
  FaSpotify,
  FaTiktok,
  FaYoutube,
} from 'react-icons/fa6'
import { useState, type FormEvent } from 'react'
import { getRememberPreference, login, setRememberPreference } from './auth'

// Mismos datos del .env para simular que "ya hay DB" cuando recuerda sesión
const DEMO_EMAIL = (import.meta.env.VITE_DEMO_EMAIL as string | undefined) ?? 'samuel@gmail.com'
const DEMO_PASSWORD = (import.meta.env.VITE_DEMO_PASSWORD as string | undefined) ?? '1234'

type LoginProps = {
  // Cuando el login sale bien, aviso al App para mostrar el dashboard
  onSuccess: () => void
}

export default function Login({ onSuccess }: LoginProps) {
  // Si ya tenía "recordar" activado, abro el form con los datos demo
  const [remember, setRemember] = useState(() => getRememberPreference())
  const [email, setEmail] = useState(() => (getRememberPreference() ? DEMO_EMAIL : ''))
  const [password, setPassword] = useState(() => (getRememberPreference() ? DEMO_PASSWORD : ''))
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // El toggle solo se activa al tocarlo (no al texto)
  // ON = relleno demo | OFF = limpio los inputs
  const handleRememberChange = (checked: boolean) => {
    setRemember(checked)
    setRememberPreference(checked)
    if (checked) {
      setEmail(DEMO_EMAIL)
      setPassword(DEMO_PASSWORD)
    } else {
      setEmail('')
      setPassword('')
    }
  }

  // Submit del form: llama a auth.login y si ok, entra al dashboard
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault() // para que no recargue la página
    setError('')
    setLoading(true)
    try {
      const result = await login(email, password, remember)
      if (result.ok) {
        onSuccess()
        return
      }
      setError(result.error)
    } finally {
      setLoading(false)
    }
  }

  return (
    // login-screen = pantalla completa sin scroll (ver index.css)
    <div className="login-screen relative h-dvh w-dvw overflow-hidden bg-midnight text-white">
      {/* En desktop: 2 columnas. En móvil solo se ve el form */}
      <div className="relative z-10 grid h-full w-full lg:grid-cols-[minmax(0,1fr)_minmax(30rem,40rem)]">
        {/* ===== COLUMNA IZQUIERDA: marca + iPhone + texto ===== */}
        <section className="relative hidden h-full overflow-hidden lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-10 xl:px-16 xl:py-12">
          <LoginBackground />
          <div className="relative z-10 flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-neon text-white shadow-[0_0_24px_-8px_rgba(236,72,153,0.9)]">
              <Link2 className="size-5" />
            </span>
            <span className="font-display text-lg font-extrabold tracking-tight">
              Link<span className="text-amber">Bio</span>
            </span>
          </div>

          <div className="relative z-10 flex flex-1 items-center justify-center">
            <LoginShowcase />
          </div>

          {/* Título en vertical (no como párrafo) + amarillo de Bio */}
          <div className="relative z-10 max-w-lg shrink-0 pt-2">
            <h2 className="font-display text-3xl font-extrabold leading-[1.12] tracking-tight xl:text-4xl">
              <span className="block">Todos tus enlaces.</span>
              <span className="mt-1 block text-amber">Un solo lugar.</span>
            </h2>
            <p className="mt-3 max-w-sm text-sm text-white/45">
              Crea tu página, personaliza tu estilo y comparte todo tu contenido con un link.
            </p>
          </div>
        </section>

        {/* ===== COLUMNA DERECHA: formulario de login ===== */}
        <section className="relative flex h-full items-center justify-center border-white/10 px-6 py-8 sm:px-10 lg:border-l lg:bg-void/40 lg:px-12 lg:backdrop-blur-sm xl:px-16">
          <div className="absolute inset-0 lg:hidden">
            <LoginBackground />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-md"
          >
            {/* Marca temporal LinkBio también en el form */}
            <div className="mb-8 flex flex-col items-center text-center lg:items-start lg:text-left">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-neon text-white shadow-[0_0_24px_-8px_rgba(236,72,153,0.9)]">
                  <Link2 className="size-5" />
                </span>
                <span className="font-display text-xl font-extrabold tracking-tight">
                  Link<span className="text-amber">Bio</span>
                </span>
              </div>
              <h1 className="font-display text-2xl font-extrabold tracking-tight">Iniciar sesión</h1>
              <p className="mt-1.5 text-sm text-white/45">Accede a tu panel de creador</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form space-y-4" noValidate>
              {/* Correo */}
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-white/70">Correo</span>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/35" />
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="tu@email.com"
                    className="h-12 w-full cursor-text rounded-xl border border-white/10 bg-plum/70 py-2.5 pl-11 pr-4 text-sm outline-none transition placeholder:text-white/25 focus:border-neon"
                  />
                </div>
              </label>

              {/* Contraseña + ojo mostrar/ocultar + olvidé contraseña */}
              <div>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-white/70">Contraseña</span>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/35" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="••••••••"
                      className="h-12 w-full cursor-text rounded-xl border border-white/10 bg-plum/70 py-2.5 pl-11 pr-11 text-sm outline-none transition placeholder:text-white/25 focus:border-neon"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-white/40 transition hover:text-white"
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </label>
                {/* Estático: todavía no redirige a ninguna página */}
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    className="cursor-pointer text-sm font-semibold text-neon-soft transition hover:text-neon"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              </div>

              {/* Toggle de Uiverse (colores del diseño: neon) */}
              <div className="flex items-center justify-between gap-3 pt-0.5">
                <p className="text-sm font-semibold text-white/75">Recordar sesión</p>
                <div className="toggle">
                  <input
                    id="toggle-switch"
                    type="checkbox"
                    checked={remember}
                    onChange={(event) => handleRememberChange(event.target.checked)}
                    aria-label="Recordar sesión"
                  />
                  <label htmlFor="toggle-switch" />
                </div>
              </div>

              {error && (
                <p className="rounded-xl border border-red-400/25 bg-red-400/10 px-3 py-2.5 text-sm text-red-200" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-1 h-12 w-full cursor-pointer rounded-xl bg-neon text-sm font-extrabold text-white transition hover:bg-neon-soft disabled:cursor-wait disabled:opacity-70"
              >
                {loading ? 'Entrando…' : 'Entrar'}
              </button>
            </form>

            {/* Links estáticos de registro / legales (sin navegación por ahora) */}
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-white/10" />
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/30">o</span>
                <span className="h-px flex-1 bg-white/10" />
              </div>

              <p className="text-center text-sm text-white/50">
                ¿No tienes cuenta?{' '}
                <button type="button" className="cursor-pointer font-bold text-amber transition hover:text-amber-hot">
                  Regístrate
                </button>
              </p>

              <p className="text-center text-[11px] leading-relaxed text-white/30">
                Al continuar, aceptas los{' '}
                <button type="button" className="cursor-pointer underline decoration-white/25 underline-offset-2 transition hover:text-white/50">
                  Términos
                </button>{' '}
                y la{' '}
                <button type="button" className="cursor-pointer underline decoration-white/25 underline-offset-2 transition hover:text-white/50">
                  Privacidad
                </button>
                .
              </p>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  )
}

// Redes que muestro DENTRO del iPhone (colores oficiales de cada marca)
const PREVIEW_LINKS = [
  { label: 'YouTube', Icon: FaYoutube, iconClass: 'bg-[#FF0000] text-white', accent: '#FF0000' },
  { label: 'TikTok', Icon: FaTiktok, iconClass: 'bg-black text-white ring-1 ring-[#25F4EE]/50', accent: '#FE2C55' },
  {
    label: 'Instagram',
    Icon: FaInstagram,
    iconClass: 'bg-[linear-gradient(45deg,#f9ce34_0%,#ee2a7b_45%,#6228d7_100%)] text-white',
    accent: '#E1306C',
  },
  { label: 'Spotify', Icon: FaSpotify, iconClass: 'bg-[#1DB954] text-white', accent: '#1DB954' },
  { label: 'Facebook', Icon: FaFacebook, iconClass: 'bg-[#1877F2] text-white', accent: '#1877F2' },
] as const

/**
 * LoginShowcase
 * Preview del producto: iPhone de frente + tarjetas flotantes.
 * Frame PNG: public/mockify/devices/iPhone 17 Pro - Silver.png
 * login-float = animación suave (index.css)
 */
function LoginShowcase() {
  return (
    <div className="relative h-[min(52vh,32rem)] w-full max-w-2xl">
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="login-float login-float-a">
          {/* De frente, sin rotación 3D */}
          <div className="login-iphone-front">
            <div className="login-iphone-glow" aria-hidden />
            <DeviceMockup
              device={iPhone17Pro}
              color="Silver"
              width={240}
              basePath="/mockify"
              showStatusBar={false} // status bar la dibujo yo en blanco
              screenColor="#070014"
            >
              <div className="login-iphone-screen relative flex h-full min-h-full flex-col overflow-hidden px-3.5 pb-5 pt-1">
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_10%,#481064_0%,#18042d_40%,#070014_88%)]"
                />
                <div className="login-iphone-shine" aria-hidden />

                {/* Hora / señal / wifi / batería en blanco (la isla la trae el PNG) */}
                <div className="relative z-20 flex items-center justify-between px-1 pt-2 text-[9px] font-semibold text-white">
                  <span className="w-12 pl-1">9:41</span>
                  <span className="w-12" aria-hidden />
                  <span className="flex w-12 items-center justify-end gap-0.5 pr-0.5 text-white">
                    <svg width="12" height="8" viewBox="0 0 14 10" fill="currentColor" aria-hidden>
                      <rect x="0" y="6" width="2.2" height="4" rx="0.4" />
                      <rect x="3.2" y="4" width="2.2" height="6" rx="0.4" />
                      <rect x="6.4" y="2" width="2.2" height="8" rx="0.4" />
                      <rect x="9.6" y="0" width="2.2" height="10" rx="0.4" opacity="0.35" />
                    </svg>
                    <svg width="11" height="8" viewBox="0 0 13 10" fill="currentColor" aria-hidden>
                      <path d="M6.5 3.2c1.5 0 2.9.6 3.9 1.6l-1.1 1.1A3.7 3.7 0 0 0 6.5 4.7c-1 0-1.9.4-2.6 1.1L2.8 4.7A5.2 5.2 0 0 1 6.5 3.2Zm0-3.2c2.4 0 4.6 1 6.2 2.6L11.6 3.7A7.3 7.3 0 0 0 6.5 1.5 7.3 7.3 0 0 0 1.4 3.7L.3 2.6A9 9 0 0 1 6.5 0Zm0 6.4c.8 0 1.5.3 2 .9L6.5 10 4.5 7.3c.5-.6 1.2-.9 2-.9Z" />
                    </svg>
                    <span className="relative h-[7px] w-[14px] rounded-[2px] border border-white p-px">
                      <span className="block h-full w-[72%] rounded-[0.5px] bg-white" />
                      <span className="absolute -right-[2px] top-[1px] h-[3px] w-[1.5px] rounded-r-[1px] bg-white" />
                    </span>
                  </span>
                </div>

                {/* Contenido tipo perfil: avatar + bio + links */}
                <div className="relative z-10 mt-8 flex flex-col items-center text-center">
                  <div className="avatar-glow rounded-full p-[2px]">
                    <img
                      src="/avatar.png"
                      alt=""
                      className="size-14 rounded-full object-cover"
                      draggable={false}
                    />
                  </div>
                  <h3 className="mt-3 font-display text-[0.95rem] font-extrabold tracking-tight text-neon-soft">
                    Tu página
                  </h3>
                  <p className="mt-1 max-w-[11rem] text-[10px] font-medium leading-snug text-white/55">
                    Contenido, ritmo y vibes diarias
                  </p>

                  <div className="mt-3.5 w-full space-y-1.5">
                    {PREVIEW_LINKS.map(({ label, Icon, iconClass, accent }) => (
                      <div
                        key={label}
                        className="flex min-h-[2.35rem] items-center gap-2 rounded-xl border border-white/15 bg-plum/70 px-2.5 backdrop-blur-md"
                      >
                        <span
                          className={`flex size-6 shrink-0 items-center justify-center rounded-md shadow-sm ${iconClass}`}
                        >
                          <Icon className="size-3" />
                        </span>
                        <span className="flex-1 text-left text-[10px] font-extrabold tracking-wide">{label}</span>
                        <ArrowUpRight className="size-3" style={{ color: accent }} strokeWidth={2.5} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </DeviceMockup>
          </div>
        </div>
      </div>

      {/* Tarjetas decorativas alrededor del teléfono (también flotan) */}
      <div className="login-float login-float-b absolute left-[10%] top-[14%] flex items-center gap-3 rounded-2xl border border-white/10 bg-plum/90 px-3.5 py-2.5 shadow-xl backdrop-blur-md">
        <span className="flex size-8 items-center justify-center rounded-lg bg-sky-400/15 text-sky-300">
          <Eye className="size-3.5" />
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Visitas</p>
          <p className="font-display text-base font-extrabold">24.8k</p>
        </div>
      </div>

      <div className="login-float login-float-c absolute bottom-[16%] left-[8%] flex items-center gap-3 rounded-2xl border border-white/10 bg-plum/90 px-3.5 py-2.5 shadow-xl backdrop-blur-md">
        <span className="flex size-8 items-center justify-center rounded-lg bg-amber/15 text-amber">
          <MousePointerClick className="size-3.5" />
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Clicks</p>
          <p className="font-display text-base font-extrabold">8.4k</p>
        </div>
      </div>

      <div className="login-float login-float-d absolute right-[8%] top-[16%] flex items-center gap-3 rounded-2xl border border-white/10 bg-plum/90 px-3.5 py-2.5 shadow-xl backdrop-blur-md">
        <span className="flex size-8 items-center justify-center rounded-lg bg-neon/15 text-neon-soft">
          <BarChart3 className="size-3.5" />
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Alcance</p>
          <p className="font-display text-base font-extrabold">+18%</p>
        </div>
      </div>

      <div className="login-float login-float-e absolute bottom-[18%] right-[6%] flex items-center gap-2 rounded-2xl border border-amber/25 bg-amber/15 px-3.5 py-2.5 text-xs font-bold text-amber shadow-xl backdrop-blur-md">
        <Sparkles className="size-3.5" />
        Listo para compartir
      </div>
    </div>
  )
}

// Fondo con orbes del diseño del proyecto
function LoginBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_35%_25%,#3b0764_0%,#0d0221_48%,#070014_82%)]" />
      <div className="orb absolute -left-10 top-20 size-56 rounded-full bg-neon/20 blur-3xl" />
      <div className="orb orb-delay absolute right-10 top-[40%] size-44 rounded-full bg-amber/10 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 size-[22rem] rounded-full bg-fuchsia-700/15 blur-[100px]" />
    </div>
  )
}
