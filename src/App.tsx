/**
 * App.tsx — Dashboard post-login
 * ---------------
 * Notas:
 * - Armé el shell del dashboard (sidebar + main) con las pestañas
 * - Realicé Suscripciones con un checkout demo (no es pago real)
 * - Configuré la campanita de notificaciones mock
 * - En Mi página metí el botón Ver para abrir el perfil público
 * - Densidad adaptativa por altura; fondo estático pa' que no pese tanto
 */
import {
  ArrowUpRight,
  BarChart3,
  Bell,
  Check,
  ChevronDown,
  Copy,
  CreditCard,
  ExternalLink,
  Eye,
  LayoutDashboard,
  Link2,
  LogOut,
  Menu,
  MousePointerClick,
  Palette,
  Plus,
  Settings,
  Share2,
  Sparkles,
  TrendingUp,
  Trash2,
  UserRound,
  X,
  LoaderCircle,
  type LucideIcon,
} from 'lucide-react'
import { startTransition, useEffect, useMemo, useRef, useState, memo, type ChangeEvent, type FormEvent } from 'react'
import { DeviceMockup, iPhone17Pro } from '@mockifydev/react'
import { getSession, isAuthenticated, logout } from './auth'
import Login from './Login'
import { supabase } from './utils/supabase'
import { BrandIcon } from './brandIcons'
import { loadProfile, saveProfile, type ProfileConfig, type ProfileIcon } from './profileConfig'
import type { IconType } from 'react-icons'
import { FaGlobe, FaLinkedin } from 'react-icons/fa6'
import {
  SiDiscord,
  SiFacebook,
  SiInstagram,
  SiSpotify,
  SiTelegram,
  SiTiktok,
  SiTwitch,
  SiWhatsapp,
  SiX,
  SiYoutube,
} from 'react-icons/si'




type TabId = 'inicio' | 'estadisticas' | 'personalizacion' | 'suscripciones'

const PROFILE = {
  name: 'fckn.daybeat',
  avatar: '/avatar.png',
  featured: '/fckn.daybeat',
}

const NAV_ITEMS: { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'inicio', label: 'Inicio', icon: LayoutDashboard },
  { id: 'estadisticas', label: 'Estadísticas', icon: BarChart3 },
  { id: 'personalizacion', label: 'Mi página', icon: Palette },
  { id: 'suscripciones', label: 'Suscripciones', icon: CreditCard },
]

/** KPIs cortos del Inicio (overview) */
const OVERVIEW_KPIS = [
  { label: 'Visitas (7 días)', value: '3,842', change: '+18%', icon: Eye },
  { label: 'Clicks', value: '1,206', change: '+12%', icon: MousePointerClick },
  { label: 'CTR', value: '31.4%', change: '+2.1%', icon: TrendingUp },
]

const STATS_RANGE_OPTIONS = ['7 días', '30 días', '90 días'] as const
type StatsRange = (typeof STATS_RANGE_OPTIONS)[number]

type SocialTrafficRow = {
  name: string
  visitas: number
  color: string
  Icon: IconType
}

/** Redes con colores de marca + visitas mock por rango */
const SOCIAL_META: Omit<SocialTrafficRow, 'visitas'>[] = [
  { name: 'Instagram', color: '#E4405F', Icon: SiInstagram },
  { name: 'TikTok', color: '#FE2C55', Icon: SiTiktok },
  { name: 'YouTube', color: '#FF0000', Icon: SiYoutube },
  { name: 'Facebook', color: '#1877F2', Icon: SiFacebook },
  { name: 'X', color: '#E7E9EA', Icon: SiX },
  { name: 'LinkedIn', color: '#0A66C2', Icon: FaLinkedin },
  { name: 'WhatsApp', color: '#25D366', Icon: SiWhatsapp },
  { name: 'Telegram', color: '#26A5E4', Icon: SiTelegram },
  { name: 'Discord', color: '#5865F2', Icon: SiDiscord },
  { name: 'Spotify', color: '#1DB954', Icon: SiSpotify },
  { name: 'Twitch', color: '#9146FF', Icon: SiTwitch },
  { name: 'Directo', color: '#38BDF8', Icon: FaGlobe },
]

const SOCIAL_VISITS_BASE = [920, 780, 540, 410, 360, 290, 250, 210, 180, 140, 120, 95]

function buildSocialTraffic(multiplier: number): SocialTrafficRow[] {
  return SOCIAL_META.map((meta, index) => ({
    ...meta,
    visitas: Math.round(SOCIAL_VISITS_BASE[index] * multiplier),
  })).sort((a, b) => b.visitas - a.visitas)
}

const SOCIAL_TRAFFIC_BY_RANGE: Record<StatsRange, SocialTrafficRow[]> = {
  '7 días': buildSocialTraffic(1),
  '30 días': buildSocialTraffic(3.8),
  '90 días': buildSocialTraffic(11.2),
}

/** KPIs detallados de Estadísticas */
const STATS_KPIS = [
  { label: 'Visitas a la página', value: '3,842', change: '+18.4%', icon: Eye, color: 'text-sky-300' },
  { label: 'Clicks en enlaces', value: '1,206', change: '+12.8%', icon: Link2, color: 'text-neon-soft' },
  { label: 'CTR medio', value: '31.4%', change: '+2.1%', icon: TrendingUp, color: 'text-amber' },
  { label: 'Visitantes únicos', value: '2,910', change: '+9.6%', icon: UserRound, color: 'text-violet-300' },
]

const TOP_LINKS = [
  { name: 'YouTube', clicks: 486, color: '#EC4899' },
  { name: 'TikTok', clicks: 352, color: '#F59E0B' },
  { name: 'Instagram', clicks: 248, color: '#38BDF8' },
  { name: 'Blog personal', clicks: 120, color: '#A78BFA' },
]

const PLANS = [
  {
    id: 'free' as const,
    name: 'Free',
    price: '$0',
    desc: 'Para empezar tu link en bio',
    features: ['Hasta 4 enlaces', 'Tema básico', 'Página pública lista', 'Comparte cuando quieras'],
    cta: 'Plan actual',
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    price: '$9',
    desc: 'Más espacio para destacar tu contenido',
    features: ['Enlaces ilimitados', 'Temas avanzados', 'Bloques destacados', 'Sin marca en tu página'],
    cta: 'Mejorar a Pro',
  },
]

const PLAN_REASONS = [
  { icon: Palette, title: 'Se ve como tú', desc: 'Colores, estilo y vibes que representan tu marca' },
  { icon: Share2, title: 'Listo para compartir', desc: 'Un solo link para bio, stories y mensajes' },
  { icon: Sparkles, title: 'Crece sin fricción', desc: 'Sube o baja de plan cuando te convenga' },
]

// Plan demo en localStorage (free / pro) — se recuerda al recargar
const DEMO_PLAN_KEY = 'linkbio-demo-plan'

// Notis falsas pa' la campanita, solo UI por ahora
type DemoNotification = {
  id: string
  title: string
  body: string
  time: string
  unread: boolean
  Icon: LucideIcon
  tone: 'neon' | 'amber' | 'sky' | 'emerald' | 'violet'
}

const DEMO_NOTIFICATIONS: DemoNotification[] = [
  {
    id: 'n1',
    title: 'Tu página superó 500 visitas',
    body: 'Esta semana tu link recibió más tráfico desde Instagram.',
    time: 'Hace 12 min',
    unread: true,
    Icon: TrendingUp,
    tone: 'emerald',
  },
  {
    id: 'n2',
    title: 'Nuevo récord de clicks',
    body: 'Tu enlace de TikTok acumuló 86 clicks en las últimas 24 h.',
    time: 'Hace 1 h',
    unread: true,
    Icon: MousePointerClick,
    tone: 'neon',
  },
  {
    id: 'n3',
    title: 'Alguien abrió tu página en vivo',
    body: 'Hay actividad ahora mismo en /fckn.daybeat.',
    time: 'Hace 3 h',
    unread: true,
    Icon: Eye,
    tone: 'sky',
  },
  {
    id: 'n4',
    title: 'Tip: destaca un drop',
    body: 'Agrega un bloque destacado para subir el CTR de tus enlaces.',
    time: 'Ayer',
    unread: false,
    Icon: Sparkles,
    tone: 'amber',
  },
  {
    id: 'n5',
    title: 'Plan Free cerca del límite',
    body: 'Llevas 4 de 4 enlaces. Mejora a Pro para seguir creciendo.',
    time: 'Ayer',
    unread: false,
    Icon: CreditCard,
    tone: 'violet',
  },
  {
    id: 'n6',
    title: 'Bienvenido a LinkBio',
    body: 'Tu página pública ya está lista para compartir en tus redes.',
    time: 'Hace 2 días',
    unread: false,
    Icon: Link2,
    tone: 'neon',
  },
]

const NOTIF_TONE: Record<DemoNotification['tone'], string> = {
  neon: 'bg-neon/15 text-neon-soft',
  amber: 'bg-amber/15 text-amber',
  sky: 'bg-sky-400/15 text-sky-300',
  emerald: 'bg-emerald-400/15 text-emerald-300',
  violet: 'bg-violet-400/15 text-violet-300',
}

function loadDemoPlan(): 'free' | 'pro' {
  try {
    const saved = localStorage.getItem(DEMO_PLAN_KEY)
    return saved === 'pro' ? 'pro' : 'free'
  } catch {
    return 'free'
  }
}

function saveDemoPlan(plan: 'free' | 'pro') {
  localStorage.setItem(DEMO_PLAN_KEY, plan)
}

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 16)
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim()
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length <= 2) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

const ICON_OPTIONS: { value: ProfileIcon; label: string }[] = [
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'x', label: 'X' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'twitch', label: 'Twitch' },
  { value: 'discord', label: 'Discord' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'spotify', label: 'Spotify' },
  { value: 'github', label: 'GitHub' },
  { value: 'blog', label: 'Blog' },
  { value: 'music', label: 'Música' },
  { value: 'globe', label: 'Sitio web' },
  { value: 'link', label: 'Enlace' },
]

function todayLabel() {
  try {
    return new Intl.DateTimeFormat('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date())
  } catch {
    return 'Hoy'
  }
}

export default function App() {
  const [authed, setAuthed] = useState(() => isAuthenticated())
  const [activeTab, setActiveTab] = useState<TabId>('inicio')
  const [profileOpen, setProfileOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const session = getSession()
  const profileMenuRef = useRef<HTMLDivElement>(null)

  const selectTab = (id: TabId) => {
    startTransition(() => {
      setActiveTab(id)
    setMobileNavOpen(false)
      setProfileOpen(false)
    })
  }

  const handleLogout = () => {
    logout()
    setProfileOpen(false)
    setAuthed(false)
  }

  useEffect(() => {
    if (!profileOpen) return
    const onPointer = (event: MouseEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    return () => document.removeEventListener('mousedown', onPointer)
  }, [profileOpen])
//USEEFFECT PARA PROBAR CONEXION A SUPABASE
  useEffect(() => {
  async function testSupabaseConnection() {
    const { data, error } = await supabase
      .from('prueba')
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

  if (!authed) return <Login onSuccess={() => setAuthed(true)} />

  const tabTitle =
    activeTab === 'inicio'
      ? 'Inicio'
      : activeTab === 'estadisticas'
        ? 'Estadísticas'
        : activeTab === 'personalizacion'
          ? 'Mi página'
          : 'Suscripciones'

  return (
    <div className="dash-screen relative bg-midnight text-white">
      <BackgroundFx />

      <div className="dash-shell relative z-10">
        <aside className={`dash-aside ${mobileNavOpen ? 'is-open' : ''}`} aria-label="Navegación del dashboard">
          <div className="flex items-center justify-between gap-3">
            <a href="#inicio" className="flex min-w-0 items-center gap-3" onClick={() => selectTab('inicio')}>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-neon text-white shadow-[0_0_24px_-8px_rgba(236,72,153,0.9)]">
                <Link2 className="size-5" />
              </span>
              <span className="font-display truncate text-lg font-extrabold tracking-tight">
                fckn<span className="text-amber">.</span>daybeat
              </span>
            </a>
            <button type="button" onClick={() => setMobileNavOpen(false)} className="text-white/60 lg:hidden" aria-label="Cerrar menú">
              <X className="size-5" />
            </button>
          </div>

          <div className="dash-aside-nav">
            <p className="px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Workspace</p>
            <nav className="mt-2 space-y-1" aria-label="Secciones">
              {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                <NavButton key={id} active={activeTab === id} icon={Icon} onClick={() => selectTab(id)}>
                  {label}
                </NavButton>
              ))}
            </nav>
          </div>

          <div className="dash-aside-user relative" ref={profileMenuRef}>
            <div
              className={`dash-user-menu ${profileOpen ? 'is-open' : ''}`}
              role="menu"
              aria-hidden={!profileOpen}
            >
              {session?.email && (
                <p className="truncate border-b border-white/10 px-3 py-2.5 text-[11px] text-white/40">{session.email}</p>
              )}
              <div className="p-1.5">
                <button
                  type="button"
                  role="menuitem"
                  tabIndex={profileOpen ? 0 : -1}
                  onClick={() => selectTab('personalizacion')}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-white/75 hover:bg-white/10"
                >
                  <UserRound className="size-4 shrink-0" /> Mi perfil
                </button>
                <button
                  type="button"
                  role="menuitem"
                  tabIndex={profileOpen ? 0 : -1}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-white/75 hover:bg-white/10"
                >
                  <Settings className="size-4 shrink-0" /> Ajustes
                </button>
                <button
                  type="button"
                  role="menuitem"
                  tabIndex={profileOpen ? 0 : -1}
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-red-300 hover:bg-red-400/10"
                >
                  <LogOut className="size-4 shrink-0" /> Cerrar sesión
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setProfileOpen((open) => !open)}
              className="flex w-full items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] p-2 text-left transition hover:border-white/20 hover:bg-white/[0.07]"
              aria-expanded={profileOpen}
              aria-haspopup="menu"
              aria-label="Menú de cuenta"
            >
              <img src={PROFILE.avatar} alt="" className="size-8 shrink-0 rounded-lg object-cover" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold leading-tight">
                  {session?.firstName || session?.username || 'Creador'}
                </span>
                <span className="block truncate text-[11px] text-white/40">Plan Free</span>
              </span>
              <ChevronDown
                className={`size-3.5 shrink-0 text-white/40 transition-transform duration-200 ease-out ${profileOpen ? 'rotate-180' : ''}`}
              />
            </button>
          </div>
        </aside>

        {mobileNavOpen && (
          <button type="button" onClick={() => setMobileNavOpen(false)} className="fixed inset-0 z-20 bg-black/55 lg:hidden" aria-label="Cerrar menú" />
        )}

        <div className="dash-main">
          <header className="dash-header">
            <button type="button" onClick={() => setMobileNavOpen(true)} className="text-white/70 lg:hidden" aria-label="Abrir menú">
              <Menu className="size-6" />
            </button>

            <div className="min-w-0 flex-1">
              <p className="hidden text-sm capitalize text-white/45 sm:block">{todayLabel()}</p>
              <h1 className="font-display text-lg font-extrabold tracking-tight sm:mt-0.5 sm:text-xl">
                <span className="sm:hidden">{tabTitle}</span>
                <span className="hidden sm:inline">
                  Hola, {session?.firstName || session?.username || 'fckn.daybeat'}{' '}
                  <Sparkles className="ml-1 inline size-4 text-amber sm:size-5" />
                </span>
              </h1>
            </div>

            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => selectTab('suscripciones')}
                className="hidden items-center gap-2 rounded-xl border border-amber/25 bg-amber/10 px-3 py-2 text-left transition hover:border-amber/40 hover:bg-amber/15 sm:flex"
              >
                <Sparkles className="size-3.5 shrink-0 text-amber" />
                <span className="min-w-0">
                  <span className="block text-xs font-bold leading-tight text-amber">Desbloquea más alcance</span>
                  <span className="block text-[10px] text-white/45">Ver planes Pro</span>
                </span>
                <ArrowUpRight className="size-3 shrink-0 text-amber/70" />
              </button>
              <button
                type="button"
                onClick={() => selectTab('suscripciones')}
                className="flex size-9 items-center justify-center rounded-xl border border-amber/25 bg-amber/10 text-amber transition hover:bg-amber/15 sm:hidden"
                aria-label="Ver planes Pro"
              >
                <Sparkles className="size-4" />
              </button>
              <NotificationsBell />
            </div>
          </header>

          <div className={`dash-content${activeTab === 'personalizacion' ? ' is-edit-lock' : ''}`} key={activeTab}>
            {activeTab === 'inicio' && (
              <InicioView
                onGoStats={() => selectTab('estadisticas')}
                onGoEdit={() => selectTab('personalizacion')}
                onGoPlans={() => selectTab('suscripciones')}
              />
            )}
            {activeTab === 'estadisticas' && <EstadisticasView onGoEdit={() => selectTab('personalizacion')} />}
            {activeTab === 'personalizacion' && <PersonalizacionView />}
            {activeTab === 'suscripciones' && <SuscripcionesView />}
          </div>
        </div>
      </div>
    </div>
  )
}

function InicioView({
  onGoStats,
  onGoEdit,
  onGoPlans,
}: {
  onGoStats: () => void
  onGoEdit: () => void
  onGoPlans: () => void
}) {
  const [copied, setCopied] = useState(false)
  const displayUrl = `linkbio.com${PROFILE.featured}`
  const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}${PROFILE.featured}`
  const shareText = 'Mira mi página'

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  const shareNative = async () => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: PROFILE.name, text: shareText, url: publicUrl })
      } catch {
        /* cancelado */
      }
      return
    }
    await copyLink()
  }

  return (
    <div className="dash-page mx-auto max-w-6xl">
      <div className="dash-hero">
        <p className="text-sm font-semibold text-neon-soft">Centro de control</p>
        <h2 className="dash-title mt-1 font-display font-extrabold tracking-tight">
          ¿Qué quieres hacer <span className="text-amber">hoy?</span>
        </h2>
        <p className="dash-sub mt-1 text-white/45">Resumen rápido de tu página y atajos para crecer.</p>
      </div>

      <section className="mt-[var(--dash-section-gap)] grid gap-3 lg:grid-cols-[1.35fr_1fr]">
        <div className="dash-card rounded-2xl border border-neon/25 bg-gradient-to-br from-neon/15 via-plum/70 to-plum/40 p-[var(--dash-card-pad)]">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber text-ink">
              <Check className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-lg font-bold">Tu página está lista</h3>
              <p className="mt-1 text-sm text-white/55">
                Compártela en tus redes. Cada visita y click se verá en Estadísticas.
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <div className="inline-flex max-w-full items-stretch overflow-hidden rounded-xl border border-white/10 bg-void/55">
                  <code className="max-w-[16rem] truncate px-2.5 py-2 text-[11px] text-white/70 sm:max-w-[20rem] sm:text-xs">
                    {displayUrl}
                  </code>
                  <button
                    type="button"
                    onClick={copyLink}
                    className="inline-flex shrink-0 items-center gap-1 border-l border-white/10 px-2.5 text-[11px] font-bold text-white/80 transition hover:bg-white/10 hover:text-white sm:text-xs"
                    aria-label="Copiar link"
                  >
                    <Copy className="size-3.5" />
                    {copied ? 'Listo' : 'Copiar'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => void shareNative()}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2.5 py-2 text-[11px] font-bold text-white/80 transition hover:bg-white/10 sm:text-xs"
                >
                  <Share2 className="size-3.5" />
                  Compartir
                </button>

                <a
                  href={PROFILE.featured}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white px-2.5 py-2 text-[11px] font-bold text-ink transition hover:bg-amber sm:text-xs"
                >
                  <ExternalLink className="size-3.5" /> Ver
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="dash-card rounded-2xl border border-white/10 bg-plum/60 p-[var(--dash-card-pad)]">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/35">Plan actual</p>
          <p className="mt-2 font-display text-xl font-extrabold">Free</p>
          <p className="mt-1 text-sm text-white/50">Hasta 4 enlaces · estadísticas semanales</p>
          <button
            type="button"
            onClick={onGoPlans}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-amber transition hover:text-amber-hot"
          >
            Mejorar plan <ArrowUpRight className="size-3.5" />
          </button>
            </div>
          </section>

      <section className="mt-[var(--dash-section-gap)]">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-white/70">Esta semana</h3>
          <button type="button" onClick={onGoStats} className="text-xs font-bold text-neon-soft transition hover:text-neon">
            Ver análisis completo <ArrowUpRight className="ml-0.5 inline size-3" />
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {OVERVIEW_KPIS.map(({ label, value, change, icon: Icon }) => (
            <button
              key={label}
              type="button"
              onClick={onGoStats}
              className="dash-card rounded-2xl border border-white/10 bg-plum/60 p-[var(--dash-card-pad)] text-left transition hover:border-neon/35 hover:bg-plum/80"
            >
              <div className="flex items-center justify-between">
                <span className="flex size-8 items-center justify-center rounded-lg bg-white/5">
                  <Icon className="size-4 text-neon-soft" />
                </span>
                <span className="text-xs font-bold text-emerald-300">{change}</span>
              </div>
              <p className="mt-3 text-xs text-white/45">{label}</p>
              <p className="mt-0.5 font-display text-2xl font-extrabold">{value}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-[var(--dash-section-gap)]">
        <h3 className="mb-2 text-sm font-bold text-white/70">Acciones rápidas</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction icon={Palette} title="Editar mi página" desc="Avatar, bio y enlaces" onClick={onGoEdit} />
          <QuickAction icon={BarChart3} title="Ver estadísticas" desc="Tráfico por redes" onClick={onGoStats} />
          <QuickAction
            icon={Share2}
            title="Compartir link"
            desc="Opciones del dispositivo"
            onClick={() => void shareNative()}
          />
          <QuickAction icon={CreditCard} title="Planes" desc="Free vs Pro" onClick={onGoPlans} />
        </div>
      </section>
    </div>
  )
}

function QuickAction({
  icon: Icon,
  title,
  desc,
  onClick,
}: {
  icon: typeof Palette
  title: string
  desc: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="dash-card flex items-start gap-3 rounded-2xl border border-white/10 bg-plum/60 p-[var(--dash-card-pad)] text-left transition hover:border-neon/35 hover:bg-plum/80"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/5 text-neon-soft">
        <Icon className="size-4" />
      </span>
      <span>
        <span className="block text-sm font-bold">{title}</span>
        <span className="mt-0.5 block text-xs text-white/45">{desc}</span>
      </span>
    </button>
  )
}

function EstadisticasView({ onGoEdit }: { onGoEdit: () => void }) {
  const [range, setRange] = useState<StatsRange>('7 días')
  const socialData = useMemo(() => SOCIAL_TRAFFIC_BY_RANGE[range], [range])

  return (
    <div className="dash-page mx-auto max-w-6xl">
      <div className="dash-hero flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-neon-soft">Análisis</p>
          <h2 className="dash-title mt-1 font-display font-extrabold tracking-tight">
            De dónde viene tu <span className="text-amber">tráfico.</span>
          </h2>
          <p className="dash-sub mt-1 text-white/45">Visitas por red social y clicks por enlace.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {STATS_RANGE_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setRange(option)}
              className={`rounded-xl px-3 py-2 text-xs font-bold transition ${
                range === option
                  ? 'bg-neon/20 text-neon-soft ring-1 ring-neon/30'
                  : 'border border-white/10 bg-white/5 text-white/55 hover:text-white'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <section className="dash-stats mt-[var(--dash-section-gap)] grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {STATS_KPIS.map(({ label, value, change, icon: Icon, color }) => (
          <div key={label} className="dash-card rounded-2xl border border-white/10 bg-plum/60 p-[var(--dash-card-pad)]">
            <div className="flex items-center justify-between">
              <span className="flex size-8 items-center justify-center rounded-lg bg-white/5">
                <Icon className={`size-4 ${color}`} />
              </span>
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-300">
                <TrendingUp className="size-3" /> {change}
              </span>
            </div>
            <p className="mt-3 text-xs text-white/45">{label}</p>
            <p className="mt-0.5 font-display text-2xl font-extrabold">{value}</p>
          </div>
        ))}
      </section>

      <section className="mt-[var(--dash-section-gap)] dash-card rounded-2xl border border-white/10 bg-plum/60 p-[var(--dash-card-pad)]">
        <div className="mb-1">
          <h3 className="font-display text-base font-bold sm:text-lg">Visitas por red social</h3>
          <p className="mt-0.5 text-xs text-white/40">Últimos {range} · todas las plataformas</p>
        </div>
        <div className="mt-2.5">
          <SocialTrafficChart data={socialData} />
        </div>
      </section>

      <section className="mt-[var(--dash-section-gap)] dash-card rounded-2xl border border-white/10 bg-plum/60 p-[var(--dash-card-pad)]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-base font-bold sm:text-lg">Clicks por enlace</h3>
            <p className="mt-0.5 text-xs text-white/40">Qué destinos convierten más</p>
          </div>
          <button
            type="button"
            onClick={onGoEdit}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-neon-soft transition hover:text-neon"
          >
            Editar enlaces <ArrowUpRight className="size-3" />
          </button>
        </div>
        <div className="mt-2.5">
          <LinkClicksChart data={TOP_LINKS} />
        </div>
      </section>
    </div>
  )
}

/** Vista de planes: cards Free/Pro; el upgrade abre el modal demo */
function SuscripcionesView() {
  const [currentPlan, setCurrentPlan] = useState<'free' | 'pro'>(() => loadDemoPlan())
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  const handleUpgradeComplete = () => {
    setCurrentPlan('pro')
    saveDemoPlan('pro')
    setCheckoutOpen(false)
  }

  return (
    <div className="dash-page mx-auto max-w-6xl">
      <div className="dash-hero">
        <p className="text-sm font-semibold text-neon-soft">Planes</p>
        <h2 className="dash-title mt-1 font-display font-extrabold tracking-tight">
          Elige cómo quieres <span className="text-amber">crecer.</span>
        </h2>
        <p className="dash-sub mt-1 text-white/45">Empieza por el plan. Todo lo demás viene después.</p>
      </div>

      <section className="mt-[var(--dash-section-gap)] grid items-stretch gap-3 md:grid-cols-2">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlan
          const isUpgrade = plan.id === 'pro' && currentPlan === 'free'
          return (
            <div
              key={plan.id}
              className={`dash-card flex h-full flex-col rounded-2xl border p-[var(--dash-card-pad)] ${
                isCurrent && plan.id === 'pro'
                  ? 'border-amber/30 bg-gradient-to-br from-amber/15 via-plum/70 to-plum/50'
                  : isCurrent
                    ? 'border-white/10 bg-plum/60'
                    : plan.id === 'pro'
                      ? 'border-amber/30 bg-gradient-to-br from-amber/15 via-plum/70 to-plum/50'
                      : 'border-white/10 bg-plum/60'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg font-bold">{plan.name}</h3>
                  <p className="mt-1 text-sm text-white/45">{plan.desc}</p>
                </div>
                {isCurrent ? (
                  <span className="rounded-md bg-white/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white/55">
                    Actual
                  </span>
                ) : plan.id === 'pro' ? (
                  <span className="rounded-md bg-amber/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber">
                    Recomendado
                  </span>
                ) : null}
              </div>

              <p className="mt-4 font-display text-3xl font-extrabold">
                {plan.price}
                <span className="text-sm font-semibold text-white/40">/mes</span>
              </p>

              <ul className="mt-4 flex-1 space-y-2">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-white/70">
                    <Check className="size-4 shrink-0 text-emerald-300" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                disabled={isCurrent}
                onClick={() => {
                  if (isUpgrade) setCheckoutOpen(true)
                }}
                className={`mt-5 w-full rounded-xl py-2.5 text-sm font-bold transition ${
                  isCurrent
                    ? 'cursor-default border border-white/10 text-white/40'
                    : 'bg-white text-ink hover:bg-amber'
                }`}
              >
                {isCurrent ? 'Plan actual' : plan.cta}
              </button>
            </div>
          )
        })}
      </section>

      <section className="mt-[var(--dash-section-gap)] grid gap-3 sm:grid-cols-3">
        {PLAN_REASONS.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-plum/40 px-3.5 py-3">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-amber">
              <Icon className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white/85">{title}</p>
              <p className="mt-0.5 text-xs text-white/45">{desc}</p>
            </div>
          </div>
        ))}
      </section>

      {checkoutOpen ? (
        <DemoCheckoutModal onClose={() => setCheckoutOpen(false)} onComplete={handleUpgradeComplete} />
      ) : null}
    </div>
  )
}

type CheckoutStep = 'form' | 'processing' | 'success'

/**
 * Modal de checkout demo pa' simular el upgrade a Pro.
 * Flujo: form → “procesando” → éxito. La tarjeta es de prueba.
 */
function DemoCheckoutModal({ onClose, onComplete }: { onClose: () => void; onComplete: () => void }) {
  const [step, setStep] = useState<CheckoutStep>('form')
  const [name, setName] = useState('Alex Rivera')
  const [email, setEmail] = useState('alex@email.com')
  const [card, setCard] = useState('4242 4242 4242 4242')
  const [expiry, setExpiry] = useState('12/28')
  const [cvc, setCvc] = useState('123')
  const [error, setError] = useState('')
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && step === 'form') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose, step])

  useEffect(() => {
    dialogRef.current?.querySelector<HTMLElement>('input')?.focus()
  }, [])

  const validate = () => {
    const digits = card.replace(/\s/g, '')
    if (!name.trim()) return 'Escribe el nombre de la tarjeta.'
    if (!email.includes('@')) return 'Revisa el correo.'
    if (digits.length < 16) return 'El número de tarjeta debe tener 16 dígitos.'
    if (!/^\d{2}\/\d{2}$/.test(expiry)) return 'Usa el formato MM/AA en la fecha.'
    if (cvc.replace(/\D/g, '').length < 3) return 'El CVC necesita 3 dígitos.'
    return ''
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const message = validate()
    if (message) {
      setError(message)
      return
    }
    setError('')
    setStep('processing')
    window.setTimeout(() => setStep('success'), 1400)
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" aria-label="Cerrar checkout" onClick={step === 'processing' ? undefined : onClose} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-title"
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-white/12 bg-[#140a22] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.85)]"
      >
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber">Checkout demo</p>
            <h3 id="checkout-title" className="mt-0.5 font-display text-lg font-extrabold tracking-tight">
              Mejorar a Pro
            </h3>
          </div>
          {step !== 'processing' ? (
            <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-white/45 hover:bg-white/5 hover:text-white" aria-label="Cerrar">
              <X className="size-4" />
            </button>
          ) : null}
        </div>

        {step === 'form' ? (
          <form onSubmit={handleSubmit} className="space-y-3.5 px-5 py-4">
            <div className="rounded-xl border border-amber/20 bg-amber/10 px-3.5 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-white/90">Plan Pro</p>
                  <p className="mt-0.5 text-xs text-white/45">Facturación mensual · cancelable</p>
                </div>
                <p className="font-display text-xl font-extrabold text-amber">
                  $9<span className="text-sm font-semibold text-white/40">/mes</span>
                </p>
              </div>
            </div>

            <p className="rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2 text-xs text-white/45">
              Modo demo: no se cobra nada real. Usa los datos precargados o escribe los tuyos de prueba.
            </p>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-white/45">Nombre en la tarjeta</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-void/50 px-3 py-2.5 text-sm outline-none focus:border-neon/50"
                autoComplete="cc-name"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-white/45">Correo del recibo</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-void/50 px-3 py-2.5 text-sm outline-none focus:border-neon/50"
                autoComplete="email"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-white/45">Número de tarjeta</span>
              <div className="relative">
                <CreditCard className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/35" />
                <input
                  value={card}
                  onChange={(e) => setCard(formatCardNumber(e.target.value))}
                  inputMode="numeric"
                  className="w-full rounded-xl border border-white/10 bg-void/50 py-2.5 pl-10 pr-3 text-sm tracking-wider outline-none focus:border-neon/50"
                  autoComplete="cc-number"
                  placeholder="4242 4242 4242 4242"
                />
              </div>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-white/45">Vencimiento</span>
                <input
                  value={expiry}
                  onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  inputMode="numeric"
                  className="w-full rounded-xl border border-white/10 bg-void/50 px-3 py-2.5 text-sm outline-none focus:border-neon/50"
                  autoComplete="cc-exp"
                  placeholder="MM/AA"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-white/45">CVC</span>
                <input
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  inputMode="numeric"
                  className="w-full rounded-xl border border-white/10 bg-void/50 px-3 py-2.5 text-sm outline-none focus:border-neon/50"
                  autoComplete="cc-csc"
                  placeholder="123"
                />
              </label>
            </div>

            {error ? <p className="text-xs font-semibold text-rose-300">{error}</p> : null}

            <button type="submit" className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-sm font-bold text-ink transition hover:bg-amber">
              Pagar $9 y activar Pro
              <ArrowUpRight className="size-4" />
            </button>
          </form>
        ) : null}

        {step === 'processing' ? (
          <div className="flex flex-col items-center justify-center gap-3 px-5 py-14 text-center">
            <LoaderCircle className="size-8 animate-spin text-amber" />
            <p className="font-display text-lg font-bold">Procesando pago demo…</p>
            <p className="text-sm text-white/45">Simulando confirmación del banco</p>
          </div>
        ) : null}

        {step === 'success' ? (
          <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
              <Check className="size-6" />
            </span>
            <div>
              <p className="font-display text-xl font-extrabold tracking-tight">¡Ya eres Pro!</p>
              <p className="mt-1 text-sm text-white/50">Pago demo completado. Tu plan quedó actualizado.</p>
            </div>
            <button
              type="button"
              onClick={onComplete}
              className="mt-2 w-full rounded-xl bg-white py-2.5 text-sm font-bold text-ink transition hover:bg-amber"
            >
              Ver mi plan Pro
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

/**
 * Editor de avatar, bio, links, etc.
 * Configuré Guardar + Ver (Ver abre /fckn.daybeat en otra pestaña).
 */
function PersonalizacionView() {
  const [profile, setProfile] = useState<ProfileConfig>(() => loadProfile())
  const [savedFlash, setSavedFlash] = useState(false)
  const [openIconId, setOpenIconId] = useState<string | null>(null)
  const saveTimer = useRef<number | null>(null)

  const updateProfile = (changes: Partial<ProfileConfig>) => {
    setProfile((current) => {
      const next = { ...current, ...changes }
      if (saveTimer.current != null) window.clearTimeout(saveTimer.current)
      saveTimer.current = window.setTimeout(() => saveProfile(next), 450)
      return next
    })
  }

  useEffect(() => {
    return () => {
      if (saveTimer.current != null) window.clearTimeout(saveTimer.current)
    }
  }, [])

  const updateLink = (id: string, changes: Partial<ProfileConfig['links'][number]>) =>
    updateProfile({ links: profile.links.map((link) => (link.id === id ? { ...link, ...changes } : link)) })

  const addLink = () =>
    updateProfile({
      links: [...profile.links, { id: `${Date.now()}`, label: 'Nuevo enlace', href: 'https://', icon: 'link' }],
    })

  const removeLink = (id: string) => updateProfile({ links: profile.links.filter((link) => link.id !== id) })

  const handleAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => updateProfile({ avatar: String(reader.result) })
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    if (saveTimer.current != null) window.clearTimeout(saveTimer.current)
    saveProfile(profile)
    setSavedFlash(true)
    window.setTimeout(() => setSavedFlash(false), 1800)
  }

  return (
    <div className="dash-page dash-edit-page mx-auto w-full max-w-7xl">
        <div className="dash-edit-hero flex shrink-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-neon-soft">Mi página</p>
          <h2 className="dash-title mt-1 font-display font-extrabold tracking-tight">Construye tu link en bio</h2>
          <p className="dash-sub mt-1 text-white/45">Los cambios se reflejan al instante en la vista previa.</p>
          </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href="/fckn.daybeat"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-extrabold text-white/85 transition hover:bg-white/10 hover:text-white"
          >
            <ExternalLink className="size-4" />
            Ver
          </a>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center justify-center rounded-xl bg-amber px-5 py-2.5 text-sm font-extrabold text-ink shadow-[0_8px_30px_-8px_rgba(251,191,36,0.65)] transition hover:bg-amber-hot"
          >
            {savedFlash ? 'Guardado' : 'Guardar'}
          </button>
        </div>
      </div>

      <div className="dash-edit-body">
        <div className="dash-edit-form space-y-3 sm:space-y-4">
          <section className="dash-card rounded-2xl border border-white/10 bg-plum/60 p-[var(--dash-card-pad)]">
            <h3 className="font-display text-base font-bold sm:text-lg">Color de los enlaces</h3>
            <p className="mt-1 text-sm text-white/45">Identidad visual de tus botones.</p>
            <div className="mt-3 flex flex-wrap gap-2.5">
              {['#ec4899', '#fbbf24', '#38bdf8', '#a78bfa', '#34d399', '#fb7185'].map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => updateProfile({ accent: color })}
                  aria-label={`Elegir color ${color}`}
                  className={`size-9 rounded-full border-2 transition hover:scale-105 ${
                    profile.accent === color ? 'scale-105 border-white' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </section>

          <section className="dash-card rounded-2xl border border-white/10 bg-plum/60 p-[var(--dash-card-pad)]">
            <div className="flex flex-wrap items-center gap-3">
              <img src={profile.avatar} alt="" className="size-14 rounded-2xl object-cover sm:size-16" />
              <div className="min-w-0 flex-1">
                <h3 className="font-display text-base font-bold sm:text-lg">Foto de perfil</h3>
                <p className="text-sm text-white/45">Mejor resultado con imagen cuadrada.</p>
              </div>
              <label className="cursor-pointer rounded-xl bg-white px-3 py-2 text-xs font-bold text-ink transition hover:bg-amber">
                Cambiar
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatar} className="sr-only" />
              </label>
            </div>
          </section>

          <section className="dash-card rounded-2xl border border-white/10 bg-plum/60 p-[var(--dash-card-pad)]">
            <h3 className="font-display text-base font-bold sm:text-lg">Información pública</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label>
                <span className="mb-1.5 block text-sm font-semibold text-white/70">Nombre visible</span>
                <input
                  value={profile.displayName}
                  onChange={(event) => updateProfile({ displayName: event.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-void/60 px-3 py-2.5 text-sm outline-none transition focus:border-neon"
                />
              </label>
              <label>
                <span className="mb-1.5 block text-sm font-semibold text-white/70">Descripción</span>
                <input
                  value={profile.bio}
                  onChange={(event) => updateProfile({ bio: event.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-void/60 px-3 py-2.5 text-sm outline-none transition focus:border-neon"
                />
              </label>
            </div>
          </section>

          <section className="dash-card rounded-2xl border border-white/10 bg-plum/60 p-[var(--dash-card-pad)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-base font-bold sm:text-lg">Tus enlaces</h3>
                <p className="text-sm text-white/45">Hasta 6 destinos con icono.</p>
              </div>
              <span className="text-xs font-bold text-white/45">{profile.links.length}/6</span>
            </div>

            <div className="mt-3 space-y-2.5">
              {profile.links.map((link) => (
                <div
                  key={link.id}
                  className="grid gap-2 rounded-xl border border-white/10 bg-void/35 p-2.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,11rem)_2.5rem_2rem] sm:items-center"
                >
                  <input
                    aria-label="Título del enlace"
                    value={link.label}
                    onChange={(event) => updateLink(link.id, { label: event.target.value })}
                    className="rounded-lg border border-white/10 bg-void/60 px-3 py-2 text-sm outline-none focus:border-neon"
                    placeholder="Título"
                  />
                  <input
                    aria-label="Link de destino"
                    value={link.href}
                    onChange={(event) => updateLink(link.id, { href: event.target.value })}
                    className="rounded-lg border border-white/10 bg-void/60 px-3 py-2 text-sm outline-none focus:border-neon"
                    placeholder="https://"
                  />
                  <LinkIconPicker
                    value={link.icon}
                    open={openIconId === link.id}
                    onOpen={() => setOpenIconId(link.id)}
                    onClose={() => setOpenIconId(null)}
                    onChange={(icon) => updateLink(link.id, { icon })}
                  />
                  <span className="justify-self-center">
                    <BrandIcon icon={link.icon} size="md" />
                  </span>
                  <button type="button" onClick={() => removeLink(link.id)} aria-label={`Eliminar ${link.label}`} className="flex size-9 items-center justify-center justify-self-center rounded-lg text-red-400 transition hover:bg-red-400/15">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              disabled={profile.links.length >= 6}
              onClick={addLink}
              className="mt-3 inline-flex items-center gap-2 rounded-xl border border-neon/30 px-3.5 py-2 text-sm font-bold text-neon-soft transition enabled:hover:bg-neon/10 disabled:cursor-not-allowed disabled:opacity-35"
            >
              <Plus className="size-4" /> Agregar enlace
            </button>
          </section>
        </div>

        <aside className="dash-edit-preview" aria-label="Vista previa en iPhone">
          <div className="dash-edit-preview-label mb-2 shrink-0 text-center lg:text-left">
            <h3 className="font-display text-base font-bold">Vista previa</h3>
          </div>
          <ProfilePhonePreview profile={profile} />
        </aside>
        </div>
    </div>
  )
}

/** Selector de icono — mismo estilo que el birth picker del registro */
function LinkIconPicker({
  value,
  open,
  onOpen,
  onClose,
  onChange,
}: {
  value: ProfileIcon
  open: boolean
  onOpen: () => void
  onClose: () => void
  onChange: (value: ProfileIcon) => void
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const selected = ICON_OPTIONS.find((option) => option.value === value)

  useEffect(() => {
    if (!open) return
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) onClose()
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        type="button"
        aria-label="Seleccionar icono"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => (open ? onClose() : onOpen())}
        className={`relative flex h-[2.375rem] w-full items-center gap-2 rounded-xl border bg-void/60 px-2.5 pr-8 text-left text-sm outline-none transition ${
          open ? 'border-neon' : 'border-white/10 hover:border-white/20'
        }`}
      >
        <BrandIcon icon={value} size="sm" />
        <span className="truncate text-white/85">{selected?.label ?? 'Icono'}</span>
        <ChevronDown
          className={`pointer-events-none absolute right-2.5 size-3.5 text-white/40 transition ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label="Iconos de red"
          className="birth-picker-menu absolute left-0 right-0 z-40 mt-1.5 max-h-44 overflow-y-auto rounded-xl border border-white/12 bg-[#1a0f28] py-1 shadow-[0_12px_28px_-8px_rgba(0,0,0,0.65)]"
        >
          {ICON_OPTIONS.map((option) => {
            const isSelected = option.value === value
            return (
              <li key={option.value} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option.value)
                    onClose()
                  }}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition ${
                    isSelected ? 'bg-neon/20 font-semibold text-white' : 'text-white/75 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <BrandIcon icon={option.value} size="sm" />
                  <span>{option.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/** Vista previa en mockup iPhone 17 Pro — escala para caber completo en el panel */
const PHONE_PREVIEW_WIDTH = 280
const PHONE_PREVIEW_HEIGHT = Math.round(PHONE_PREVIEW_WIDTH * (2760 / 1350))

const ProfilePhonePreview = memo(function ProfilePhonePreview({ profile }: { profile: ProfileConfig }) {
  const fitRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)

  useEffect(() => {
    const el = fitRef.current
    if (!el) return

    const updateScale = (width: number, height: number) => {
      if (width <= 0 || height <= 0) return
      setScale(Math.min(1, width / PHONE_PREVIEW_WIDTH, height / PHONE_PREVIEW_HEIGHT))
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      // contentRect = área útil sin padding → el margen arriba/abajo se respeta
      updateScale(entry.contentRect.width, entry.contentRect.height)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={fitRef} className="dash-phone-fit">
      <div
        className="dash-phone-slot"
        style={{
          width: PHONE_PREVIEW_WIDTH * scale,
          height: PHONE_PREVIEW_HEIGHT * scale,
          opacity: scale > 0 ? 1 : 0,
        }}
      >
        <div
          className="dash-phone-scale"
          style={{
            width: PHONE_PREVIEW_WIDTH,
            height: PHONE_PREVIEW_HEIGHT,
            transform: `scale(${scale})`,
          }}
        >
          <DeviceMockup
            className="dash-phone-shadow"
            device={iPhone17Pro}
            color="Silver"
            width={PHONE_PREVIEW_WIDTH}
            basePath="/mockify"
            showStatusBar={false}
            screenColor="#070014"
          >
            <div className="dash-phone-screen absolute inset-0 flex flex-col overflow-hidden px-3.5 pb-5 pt-1">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background: `radial-gradient(ellipse at 50% 8%, ${profile.accent}66 0%, #18042d 42%, #070014 88%)`,
                }}
              />
              <div className="dash-phone-shine" aria-hidden />

              <div className="relative z-20 flex shrink-0 items-center justify-between px-1 pt-2 text-[9px] font-semibold text-white">
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

              {/* Debajo del Dynamic Island; el bloque de links llena el resto */}
              <div className="relative z-10 mt-8 flex min-h-0 flex-1 flex-col items-center text-center">
                <div
                  className="dash-phone-avatar shrink-0 rounded-full p-[3px]"
                  style={{ background: profile.accent }}
                >
                  <img
                    src={profile.avatar}
                    alt=""
                    className="block size-16 rounded-full object-cover"
                    draggable={false}
                  />
                </div>
                <h4
                  className="mt-3 max-w-[12rem] shrink-0 truncate font-display text-[0.95rem] font-extrabold tracking-tight"
                  style={{ color: profile.accent }}
                >
                  {profile.displayName || 'Tu nombre'}
                </h4>
                <p className="mt-1.5 max-w-[11.5rem] shrink-0 text-[10px] font-medium leading-snug text-white/55">
                  {profile.bio || 'Añade una descripción'}
                </p>

                {profile.links.length === 0 ? (
                  <p className="mt-6 text-[10px] text-white/35">Agrega enlaces para verlos aquí</p>
                ) : (
                  <div
                    className={`mt-4 flex w-full min-h-0 flex-1 flex-col pb-1 ${
                      profile.links.length <= 4
                        ? 'justify-start gap-2'
                        : 'justify-start gap-1.5 overflow-y-auto'
                    }`}
                  >
                    {profile.links.map((link) => (
                      <div
                        key={link.id}
                        className="flex h-11 shrink-0 items-center gap-2.5 rounded-xl border border-white/15 bg-plum/70 px-2.5 backdrop-blur-md"
                      >
                        <BrandIcon icon={link.icon} size="sm" />
                        <span className="flex-1 truncate text-left text-[11px] font-extrabold tracking-wide">
                          {link.label || 'Enlace'}
                        </span>
                        <ArrowUpRight className="size-3.5 shrink-0" style={{ color: profile.accent }} strokeWidth={2.5} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </DeviceMockup>
        </div>
      </div>
    </div>
  )
})

function SocialTrafficChart({ data }: { data: SocialTrafficRow[] }) {
  const maxVisits = Math.max(...data.map((row) => row.visitas), 1)

  return (
    <ul className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2" aria-label="Visitas por red social">
      {data.map((row) => {
        const Icon = row.Icon
        const widthPct = Math.max(4, (row.visitas / maxVisits) * 100)
        return (
          <li key={row.name} className="flex items-center gap-2">
            <span
              className="flex size-5 shrink-0 items-center justify-center rounded-md"
              style={{ backgroundColor: `${row.color}1f`, color: row.color }}
              title={row.name}
            >
              <Icon className="size-3" />
            </span>
            <span className="w-[4.5rem] shrink-0 truncate text-[11px] font-medium text-white/65">{row.name}</span>
            <div className="min-w-0 flex-1">
              <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                <div
                  className="h-full rounded-full transition-[width] duration-300 ease-out"
                  style={{ width: `${widthPct}%`, backgroundColor: row.color }}
                />
              </div>
            </div>
            <span className="w-9 shrink-0 text-right text-[11px] font-semibold tabular-nums text-white/70">
              {row.visitas.toLocaleString('es-MX')}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

function LinkClicksChart({ data }: { data: typeof TOP_LINKS }) {
  const maxClicks = Math.max(...data.map((row) => row.clicks), 1)

  return (
    <ul className="space-y-1.5" aria-label="Clicks por enlace">
      {data.map((row) => {
        const widthPct = Math.max(4, (row.clicks / maxClicks) * 100)
        return (
          <li key={row.name} className="flex items-center gap-2">
            <span className="w-28 shrink-0 truncate text-[11px] font-medium text-white/65 sm:w-36">{row.name}</span>
            <div className="min-w-0 flex-1">
              <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                <div
                  className="h-full rounded-full transition-[width] duration-300 ease-out"
                  style={{ width: `${widthPct}%`, backgroundColor: row.color }}
                />
              </div>
            </div>
            <span className="w-10 shrink-0 text-right text-[11px] font-semibold tabular-nums text-white/70">
              {row.clicks.toLocaleString('es-MX')}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

/**
 * Campanita del topbar.
 * Dropdown con notis mock, badge de no leídas y marcar una/todas.
 */
function NotificationsBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState(DEMO_NOTIFICATIONS)
  const rootRef = useRef<HTMLDivElement>(null)
  const unreadCount = items.filter((item) => item.unread).length

  useEffect(() => {
    if (!open) return
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const markAllRead = () => {
    setItems((current) => current.map((item) => ({ ...item, unread: false })))
  }

  const markOneRead = (id: string) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, unread: false } : item)))
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative flex size-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/60 transition hover:border-white/20 hover:bg-white/10 hover:text-white sm:size-10"
        aria-label="Notificaciones"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <Bell className="size-4" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-neon px-1 text-[10px] font-extrabold leading-none text-white shadow-[0_0_12px_-2px_rgba(236,72,153,0.9)]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Panel de notificaciones"
          className="absolute right-0 top-[calc(100%+0.55rem)] z-50 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-white/12 bg-[#140a22] shadow-[0_24px_60px_-24px_rgba(0,0,0,0.85)]"
        >
          <div className="flex items-center justify-between gap-3 border-b border-white/8 px-4 py-3">
            <div>
              <p className="font-display text-sm font-extrabold tracking-tight">Notificaciones</p>
              <p className="text-[11px] text-white/40">
                {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo al día'}
              </p>
            </div>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={markAllRead}
                className="text-[11px] font-bold text-amber transition hover:text-amber-hot"
              >
                Marcar leídas
              </button>
            ) : (
              <span className="text-[11px] font-semibold text-white/30">Demo</span>
            )}
          </div>

          <ul className="max-h-[min(24rem,55vh)] overflow-y-auto overscroll-contain py-1.5" role="list">
            {items.map((item) => {
              const Icon = item.Icon
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => markOneRead(item.id)}
                    className={`flex w-full items-start gap-3 px-3.5 py-3 text-left transition hover:bg-white/[0.04] ${
                      item.unread ? 'bg-neon/[0.06]' : ''
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl ${NOTIF_TONE[item.tone]}`}
                    >
                      <Icon className="size-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className={`text-sm leading-snug ${item.unread ? 'font-bold text-white' : 'font-semibold text-white/70'}`}>
                          {item.title}
                        </span>
                        {item.unread ? (
                          <span className="mt-1 size-1.5 shrink-0 rounded-full bg-neon" aria-label="No leída" />
                        ) : null}
                      </span>
                      <span className={`mt-0.5 block text-xs leading-snug ${item.unread ? 'text-white/55' : 'text-white/35'}`}>
                        {item.body}
                      </span>
                      <span className="mt-1.5 block text-[10px] font-semibold uppercase tracking-wide text-white/30">
                        {item.time}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>

          <div className="border-t border-white/8 px-4 py-2.5">
            <p className="text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-white/25">
              Vista demo · sin backend
            </p>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function NavButton({
  active,
  icon: Icon,
  onClick,
  children,
}: {
  active: boolean
  icon: typeof LayoutDashboard
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
        active ? 'bg-neon/15 text-neon-soft ring-1 ring-neon/25' : 'text-white/55 hover:bg-white/5 hover:text-white'
      }`}
    >
      <Icon className="size-4 shrink-0" />
      {children}
    </button>
  )
}

/** Fondo estático (sin orbes animados) — más fluido en el dashboard */
function BackgroundFx() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_18%,#3b0764_0%,#0d0221_42%,#070014_78%)]" />
      <div className="absolute -left-16 top-24 size-56 rounded-full bg-neon/20 blur-3xl" />
      <div className="absolute -right-10 top-[42%] size-48 rounded-full bg-amber/12 blur-3xl" />
      <div className="absolute bottom-0 left-1/2 size-[28rem] -translate-x-1/2 rounded-full bg-fuchsia-700/15 blur-[100px]" />
    </div>
  )
}
