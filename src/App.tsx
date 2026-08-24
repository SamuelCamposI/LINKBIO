import { motion } from 'framer-motion'
import {
  ArrowUpRight,
  BarChart3,
  Bell,
  Check,
  ChevronDown,
  CreditCard,
  ExternalLink,
  Eye,
  LayoutDashboard,
  Link2,
  Menu,
  Palette,
  Plus,
  Settings,
  Sparkles,
  TrendingUp,
  UserRound,
  X,
} from 'lucide-react'
import { useState } from 'react'

const PROFILE = {
  name: 'fckn.daybeat',
  avatar: '/avatar.png',
  featured: '/fckn.daybeat',
}

const NAV_ITEMS = [
  { label: 'Estadisticas', icon: BarChart3 },
  { label: 'Personalizacion', icon: Palette },
  { label: 'Suscripciones', icon: CreditCard },
]

const STATS = [
  { label: 'Visitas totales', value: '24,892', change: '+18.4%', icon: Eye, color: 'text-sky-300' },
  { label: 'Clicks en enlaces', value: '8,406', change: '+12.8%', icon: Link2, color: 'text-neon-soft' },
  { label: 'Conversiones', value: '1,284', change: '+8.2%', icon: TrendingUp, color: 'text-amber' },
]

const TOP_LINKS = [
  { name: 'YouTube', clicks: '3,204', percent: 78, color: 'bg-neon' },
  { name: 'TikTok', clicks: '2,510', percent: 61, color: 'bg-amber' },
  { name: 'Instagram', clicks: '1,692', percent: 43, color: 'bg-sky-400' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('Estadisticas')
  const [profileOpen, setProfileOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const selectTab = (label: string) => {
    setActiveTab(label)
    setMobileNavOpen(false)
  }

  return (
    <div className="relative min-h-dvh overflow-hidden bg-midnight text-white">
      <BackgroundFx />
      <div className="relative z-10 flex min-h-dvh">
        <aside className={`fixed inset-y-0 left-0 z-30 w-72 border-r border-white/10 bg-void/95 px-5 py-6 backdrop-blur-xl transition-transform lg:static lg:translate-x-0 ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center justify-between"><a href="#inicio" className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-neon text-white shadow-[0_0_24px_-8px_rgba(236,72,153,0.9)]"><Link2 className="size-5" /></span><span className="font-display text-lg font-extrabold tracking-tight">fckn<span className="text-amber">.</span>daybeat</span></a><button type="button" onClick={() => setMobileNavOpen(false)} className="text-white/60 lg:hidden" aria-label="Cerrar menu"><X className="size-5" /></button></div>
          <div className="mt-12 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Workspace</div>
          <nav className="mt-3 space-y-2" aria-label="Navegacion del dashboard"><NavButton active={activeTab === 'Inicio'} icon={LayoutDashboard} onClick={() => selectTab('Inicio')}>Inicio</NavButton>{NAV_ITEMS.map(({ label, icon: Icon }) => <NavButton key={label} active={activeTab === label} icon={Icon} onClick={() => selectTab(label)}>{label}</NavButton>)}</nav>
          <div className="absolute bottom-6 left-5 right-5 rounded-2xl border border-amber/20 bg-amber/10 p-4"><Sparkles className="size-5 text-amber" /><p className="mt-3 text-sm font-bold">Desbloquea más alcance</p><p className="mt-1 text-xs leading-relaxed text-white/50">Conoce mejor a tu audiencia y crece más rápido.</p><button type="button" onClick={() => selectTab('Suscripciones')} className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-amber">Ver planes <ArrowUpRight className="size-3" /></button></div>
        </aside>
        {mobileNavOpen && <button type="button" onClick={() => setMobileNavOpen(false)} className="fixed inset-0 z-20 bg-black/60 lg:hidden" aria-label="Cerrar menu" />}
        <main className="min-w-0 flex-1 px-5 py-5 sm:px-8 lg:px-12 lg:py-7">
          <header className="flex items-center justify-between border-b border-white/10 pb-5"><button type="button" onClick={() => setMobileNavOpen(true)} className="text-white/70 lg:hidden" aria-label="Abrir menu"><Menu className="size-6" /></button><div className="hidden lg:block"><p className="text-sm text-white/45">Domingo, 23 de agosto</p><h1 className="mt-1 font-display text-2xl font-extrabold">Hola, fckn.daybeat <Sparkles className="ml-1 inline size-5 text-amber" /></h1></div><div className="ml-auto flex items-center gap-3"><button type="button" className="relative flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/60 hover:text-white" aria-label="Notificaciones"><Bell className="size-4" /><span className="absolute right-2 top-2 size-1.5 rounded-full bg-neon" /></button><div className="relative"><button type="button" onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-1.5 pr-3 hover:border-neon/40" aria-expanded={profileOpen} aria-label="Abrir perfil"><img src={PROFILE.avatar} alt="" className="size-7 rounded-lg object-cover" /><span className="hidden text-sm font-semibold sm:block">Creador</span><ChevronDown className="size-3.5 text-white/45" /></button>{profileOpen && <div className="absolute right-0 top-12 z-40 w-44 rounded-xl border border-white/10 bg-plum p-2 shadow-2xl"><button type="button" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-white/75 hover:bg-white/10"><UserRound className="size-4" /> Mi perfil</button><button type="button" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-white/75 hover:bg-white/10"><Settings className="size-4" /> Ajustes</button></div>}</div></div></header>
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="mx-auto max-w-6xl pt-8"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold text-neon-soft">Resumen de rendimiento</p><h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Tu contenido está <span className="text-amber">creciendo.</span></h2><p className="mt-2 text-sm text-white/45">Mira cómo está funcionando tu link en bio esta semana.</p></div><a href={PROFILE.featured} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-ink transition hover:bg-amber"><ExternalLink className="size-4" /> Ver mi página</a></div>
            <section className="mt-8 grid gap-4 md:grid-cols-3">{STATS.map(({ label, value, change, icon: Icon, color }) => <div key={label} className="rounded-2xl border border-white/10 bg-plum/55 p-5 backdrop-blur-sm"><div className="flex items-center justify-between"><span className="flex size-9 items-center justify-center rounded-lg bg-white/5"><Icon className={`size-4 ${color}`} /></span><span className="flex items-center gap-1 text-xs font-bold text-emerald-300"><TrendingUp className="size-3" /> {change}</span></div><p className="mt-5 text-sm text-white/45">{label}</p><p className="mt-1 font-display text-3xl font-extrabold">{value}</p></div>)}</section>
            <section className="mt-4 grid gap-4 xl:grid-cols-[1.45fr_1fr]"><div className="rounded-2xl border border-white/10 bg-plum/55 p-5 sm:p-6"><div className="flex items-start justify-between"><div><h3 className="font-display text-lg font-bold">Actividad</h3><p className="mt-1 text-xs text-white/40">Visitas a tu página · últimos 7 días</p></div><button type="button" className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-white/60 hover:text-white">Esta semana <ChevronDown className="ml-1 inline size-3" /></button></div><div className="mt-8 flex h-48 items-end gap-2 sm:gap-4">{[38, 54, 48, 72, 64, 86, 100].map((height, index) => <div key={index} className="flex flex-1 flex-col items-center gap-3"><div className={`w-full rounded-t-lg ${index === 6 ? 'bg-gradient-to-t from-neon to-neon-soft shadow-[0_0_22px_-5px_rgba(244,114,182,0.8)]' : 'bg-white/10'}`} style={{ height: `${height}%` }} /><span className="text-[10px] text-white/35">{['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Hoy'][index]}</span></div>)}</div></div><div className="rounded-2xl border border-white/10 bg-plum/55 p-5 sm:p-6"><div className="flex items-center justify-between"><div><h3 className="font-display text-lg font-bold">Enlaces top</h3><p className="mt-1 text-xs text-white/40">Los que más conectan</p></div><button type="button" className="flex size-8 items-center justify-center rounded-lg bg-white/5 text-white/60 hover:text-white" aria-label="Agregar enlace"><Plus className="size-4" /></button></div><div className="mt-6 space-y-5">{TOP_LINKS.map((link) => <div key={link.name}><div className="mb-2 flex justify-between text-sm"><span className="font-semibold">{link.name}</span><span className="text-white/45">{link.clicks}</span></div><div className="h-2 rounded-full bg-white/10"><div className={`h-full rounded-full ${link.color}`} style={{ width: `${link.percent}%` }} /></div></div>)}</div><button type="button" onClick={() => selectTab('Personalizacion')} className="mt-8 w-full rounded-xl border border-white/10 py-3 text-xs font-bold text-white/60 transition hover:border-neon/50 hover:text-white">Gestionar enlaces <ArrowUpRight className="ml-1 inline size-3" /></button></div></section>
            <section className="mt-4 flex flex-col gap-4 rounded-2xl border border-neon/20 bg-gradient-to-r from-neon/15 via-plum/65 to-amber/10 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"><div className="flex items-start gap-4"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber text-ink"><Check className="size-5" /></span><div><h3 className="font-display font-bold">Tu perfil está listo para compartir</h3><p className="mt-1 text-sm text-white/50">Todo se ve bien. Sigue agregando contenido para mantener a tu comunidad cerca.</p></div></div><button type="button" onClick={() => selectTab('Personalizacion')} className="whitespace-nowrap rounded-xl bg-white px-4 py-3 text-sm font-bold text-ink hover:bg-amber">Editar perfil</button></section>
          </motion.div>
        </main>
      </div>
    </div>
  )
}

function NavButton({ active, icon: Icon, onClick, children }: { active: boolean; icon: typeof LayoutDashboard; onClick: () => void; children: string }) {
  return <button type="button" onClick={onClick} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${active ? 'bg-neon/15 text-neon-soft ring-1 ring-neon/25' : 'text-white/55 hover:bg-white/5 hover:text-white'}`}><Icon className="size-4" /> {children}</button>
}

function BackgroundFx() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_18%,#3b0764_0%,#0d0221_42%,#070014_78%)]" />
      <div className="orb absolute -left-16 top-24 size-56 rounded-full bg-neon/25 blur-3xl" />
      <div className="orb orb-delay absolute -right-10 top-[42%] size-48 rounded-full bg-amber/15 blur-3xl" />
      <div className="absolute bottom-0 left-1/2 size-[28rem] -translate-x-1/2 rounded-full bg-fuchsia-700/20 blur-[100px]" />
      <div className="absolute inset-0 opacity-[0.035] mix-blend-overlay [background-image:url('data:image/svg+xml,%3Csvg viewBox=%270 0 200 200%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.85%27 numOctaves=%274%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27/%3E%3C/svg%3E')]" />
    </div>
  )
}



