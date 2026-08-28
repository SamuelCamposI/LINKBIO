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
  Trash2,
  UserRound,
  X,
} from 'lucide-react'
import { useState } from 'react'
// Auth: si no hay sesión muestro Login; si hay, el dashboard
import { getSession, isAuthenticated, logout } from './auth'
import Login from './Login'
import { loadProfile, saveProfile, type ProfileConfig, type ProfileIcon } from './profileConfig'
import { FaDiscord, FaFacebook, FaGithub, FaGlobe, FaInstagram, FaLink, FaLinkedin, FaMusic, FaTelegram, FaTiktok, FaTwitch, FaWhatsapp, FaYoutube } from 'react-icons/fa6'
import { SiSpotify, SiX } from 'react-icons/si'

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
  // Arranco preguntando si ya hay sesión guardada (localStorage/sessionStorage)
  const [authed, setAuthed] = useState(() => isAuthenticated())
  const [activeTab, setActiveTab] = useState('Estadisticas')
  const [profileOpen, setProfileOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const session = getSession()

  const selectTab = (label: string) => {
    setActiveTab(label)
    setMobileNavOpen(false)
  }

  // Cerrar sesión: limpio storage y vuelvo al Login
  const handleLogout = () => {
    logout()
    setProfileOpen(false)
    setAuthed(false)
  }

  // Gate de auth: sin login no se ve el dashboard
  if (!authed) return <Login onSuccess={() => setAuthed(true)} />

  if (activeTab === 'Personalizacion') return <LinksCustomizationPanel onBack={() => setActiveTab('Inicio')} />

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
          <header className="flex items-center justify-between border-b border-white/10 pb-5"><button type="button" onClick={() => setMobileNavOpen(true)} className="text-white/70 lg:hidden" aria-label="Abrir menu"><Menu className="size-6" /></button><div className="hidden lg:block"><p className="text-sm text-white/45">Domingo, 23 de agosto</p><h1 className="mt-1 font-display text-2xl font-extrabold">Hola, fckn.daybeat <Sparkles className="ml-1 inline size-5 text-amber" /></h1></div><div className="ml-auto flex items-center gap-3"><button type="button" className="relative flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/60 hover:text-white" aria-label="Notificaciones"><Bell className="size-4" /><span className="absolute right-2 top-2 size-1.5 rounded-full bg-neon" /></button><div className="relative"><button type="button" onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-1.5 pr-3 hover:border-neon/40" aria-expanded={profileOpen} aria-label="Abrir perfil"><img src={PROFILE.avatar} alt="" className="size-7 rounded-lg object-cover" /><span className="hidden text-sm font-semibold sm:block">Creador</span><ChevronDown className="size-3.5 text-white/45" /></button>{profileOpen && <div className="absolute right-0 top-12 z-40 w-52 rounded-xl border border-white/10 bg-plum p-2 shadow-2xl">{session?.email && <p className="truncate px-3 py-2 text-xs text-white/40">{session.email}</p>}<button type="button" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-white/75 hover:bg-white/10"><UserRound className="size-4" /> Mi perfil</button><button type="button" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-white/75 hover:bg-white/10"><Settings className="size-4" /> Ajustes</button><button type="button" onClick={handleLogout} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-300 hover:bg-red-400/10">Cerrar sesión</button></div>}</div></div></header>
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

export function CustomizationPanel({ onBack }: { onBack: () => void }) {
  const [displayName, setDisplayName] = useState('fckn.daybeat')
  const [bio, setBio] = useState('Contenido, ritmo y vibes diarias')
  const [accent, setAccent] = useState('#ec4899')
  const [buttonStyle, setButtonStyle] = useState<'soft' | 'outline'>('soft')

  return (
    <div className="relative min-h-dvh overflow-hidden bg-midnight text-white">
      <BackgroundFx />
      <main className="relative z-10 mx-auto max-w-6xl px-5 py-6 sm:px-8 lg:px-12 lg:py-8">
        <header className="flex items-center justify-between border-b border-white/10 pb-5">
          <div><p className="text-sm font-semibold text-neon-soft">Personalización</p><h1 className="mt-1 font-display text-2xl font-extrabold">Diseña tu página</h1></div>
          <button type="button" onClick={onBack} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white/70 hover:text-white">Volver al resumen</button>
        </header>
        <div className="grid gap-6 pt-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-2xl border border-white/10 bg-plum/55 p-5 backdrop-blur-sm sm:p-7">
            <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-neon/15 text-neon-soft"><Palette className="size-5" /></span><div><h2 className="font-display text-lg font-bold">Identidad del perfil</h2><p className="text-sm text-white/45">Haz que tu primera impresión se sienta tuya.</p></div></div>
            <div className="mt-8 space-y-6">
              <label className="block"><span className="mb-2 block text-sm font-semibold text-white/70">Nombre visible</span><input value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="w-full rounded-xl border border-white/10 bg-void/60 px-4 py-3 text-sm outline-none transition focus:border-neon" /></label>
              <label className="block"><span className="mb-2 block text-sm font-semibold text-white/70">Descripción</span><textarea value={bio} onChange={(event) => setBio(event.target.value)} rows={3} className="w-full resize-none rounded-xl border border-white/10 bg-void/60 px-4 py-3 text-sm outline-none transition focus:border-neon" /></label>
              <div><span className="mb-3 block text-sm font-semibold text-white/70">Color de acento</span><div className="flex flex-wrap gap-3">{['#ec4899', '#fbbf24', '#38bdf8', '#a78bfa'].map((color) => <button key={color} type="button" onClick={() => setAccent(color)} aria-label={`Elegir color ${color}`} className={`size-9 rounded-full border-2 transition ${accent === color ? 'scale-110 border-white' : 'border-transparent'}`} style={{ backgroundColor: color }} />)}</div></div>
              <div><span className="mb-3 block text-sm font-semibold text-white/70">Estilo de enlaces</span><div className="grid grid-cols-2 gap-3">{(['soft', 'outline'] as const).map((style) => <button key={style} type="button" onClick={() => setButtonStyle(style)} className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${buttonStyle === style ? 'border-neon bg-neon/15 text-white' : 'border-white/10 bg-white/5 text-white/50 hover:text-white'}`}>{style === 'soft' ? 'Suave' : 'Contorno'}</button>)}</div></div>
            </div>
          </section>
          <section className="lg:sticky lg:top-8 lg:self-start"><div className="mb-3 flex items-center justify-between"><div><h2 className="font-display text-lg font-bold">Vista previa</h2><p className="text-sm text-white/45">Así lo verá tu audiencia.</p></div><span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300"><span className="size-1.5 rounded-full bg-emerald-300" /> En vivo</span></div><div className="mx-auto max-w-sm rounded-[2rem] border border-white/10 bg-void p-4 shadow-2xl"><div className="rounded-[1.5rem] px-4 py-10 text-center" style={{ background: `radial-gradient(circle at 50% 10%, ${accent}55, #18042d 44%, #070014 90%)` }}><img src="/avatar.png" alt="" className="mx-auto size-20 rounded-full object-cover ring-4 ring-white/20" /><h3 className="mt-5 font-display text-2xl font-extrabold" style={{ color: accent }}>{displayName || 'Tu nombre'}</h3><p className="mt-2 text-sm text-white/65">{bio || 'Añade una descripción'}</p><div className="mt-7 space-y-3">{['YouTube', 'TikTok', 'Instagram'].map((link) => <div key={link} className={`rounded-xl px-4 py-3 text-sm font-bold ${buttonStyle === 'soft' ? 'bg-white/10' : 'border border-white/25'}`}>{link}</div>)}</div></div></div></section>
        </div>
      </main>
    </div>
  )
}

export function AdvancedCustomizationPanel({ onBack }: { onBack: () => void }) {
  const [profile, setProfile] = useState<ProfileConfig>(() => loadProfile())
  const updateProfile = (changes: Partial<ProfileConfig>) => {
    setProfile((current) => {
      const next = { ...current, ...changes }
      saveProfile(next)
      return next
    })
  }
  const updateLink = (id: string, changes: Partial<ProfileConfig['links'][number]>) => updateProfile({ links: profile.links.map((link) => link.id === id ? { ...link, ...changes } : link) })
  const addLink = () => updateProfile({ links: [...profile.links, { id: `${Date.now()}`, label: 'Nuevo enlace', href: 'https://', icon: 'link' }] })
  const removeLink = (id: string) => updateProfile({ links: profile.links.filter((link) => link.id !== id) })

  const handleAvatar = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => updateProfile({ avatar: String(reader.result) })
    reader.readAsDataURL(file)
  }

  return (
    <div className="relative min-h-dvh overflow-hidden bg-midnight text-white">
      <BackgroundFx />
      <main className="relative z-10 mx-auto max-w-6xl px-5 py-6 sm:px-8 lg:px-12 lg:py-8">
        <header className="flex items-center justify-between border-b border-white/10 pb-5"><div><p className="text-sm font-semibold text-neon-soft">Personalización</p><h1 className="mt-1 font-display text-2xl font-extrabold">Construye tu página</h1></div><button type="button" onClick={onBack} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white/70 hover:text-white">Volver al resumen</button></header>
        <div className="grid gap-6 pt-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-white/10 bg-plum/55 p-5 backdrop-blur-sm sm:p-7"><div className="flex items-center gap-4"><img src={profile.avatar} alt="" className="size-16 rounded-2xl object-cover" /><div><h2 className="font-display text-lg font-bold">Foto de perfil</h2><p className="text-sm text-white/45">Usa una imagen cuadrada para obtener el mejor resultado.</p></div><label className="ml-auto cursor-pointer rounded-xl bg-white px-3 py-2 text-xs font-bold text-ink hover:bg-amber">Cambiar<input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatar} className="sr-only" /></label></div></section>
            <section className="rounded-2xl border border-white/10 bg-plum/55 p-5 backdrop-blur-sm sm:p-7"><h2 className="font-display text-lg font-bold">Información pública</h2><div className="mt-5 grid gap-5 sm:grid-cols-2"><label><span className="mb-2 block text-sm font-semibold text-white/70">Nombre visible</span><input value={profile.displayName} onChange={(event) => updateProfile({ displayName: event.target.value })} className="w-full rounded-xl border border-white/10 bg-void/60 px-4 py-3 text-sm outline-none focus:border-neon" /></label><label><span className="mb-2 block text-sm font-semibold text-white/70">Descripción</span><input value={profile.bio} onChange={(event) => updateProfile({ bio: event.target.value })} className="w-full rounded-xl border border-white/10 bg-void/60 px-4 py-3 text-sm outline-none focus:border-neon" /></label></div><div className="mt-6"><span className="mb-3 block text-sm font-semibold text-white/70">Color de acento</span><div className="flex gap-3">{['#ec4899', '#fbbf24', '#38bdf8', '#a78bfa'].map((color) => <button key={color} type="button" onClick={() => updateProfile({ accent: color })} aria-label={`Elegir color ${color}`} className={`size-9 rounded-full border-2 ${profile.accent === color ? 'scale-110 border-white' : 'border-transparent'}`} style={{ backgroundColor: color }} />)}</div></div></section>
            <section className="rounded-2xl border border-white/10 bg-plum/55 p-5 backdrop-blur-sm sm:p-7"><div className="flex items-center justify-between"><div><h2 className="font-display text-lg font-bold">Tus enlaces</h2><p className="text-sm text-white/45">Añade hasta 6 destinos y elige su icono.</p></div><span className="text-xs font-bold text-white/45">{profile.links.length}/6</span></div><div className="mt-5 space-y-3">{profile.links.map((link) => <div key={link.id} className="grid gap-3 rounded-xl border border-white/10 bg-void/35 p-3 sm:grid-cols-[44px_minmax(0,1fr)_minmax(0,1fr)_180px_36px]"><div className="flex size-11 items-center justify-center rounded-lg bg-white/10 text-lg" title={`Icono: ${link.icon}`}>{iconGlyph(link.icon)}</div><input aria-label="Nombre del enlace" value={link.label} onChange={(event) => updateLink(link.id, { label: event.target.value })} className="rounded-lg border border-white/10 bg-void/60 px-3 py-2 text-sm outline-none focus:border-neon" /><input aria-label="URL del enlace" value={link.href} onChange={(event) => updateLink(link.id, { href: event.target.value })} className="rounded-lg border border-white/10 bg-void/60 px-3 py-2 text-sm outline-none focus:border-neon" /><select aria-label="Icono del enlace" value={link.icon} onChange={(event) => updateLink(link.id, { icon: event.target.value as ProfileIcon })} className="rounded-lg border border-white/10 bg-void/60 px-3 py-2 text-sm text-white outline-none focus:border-neon"><optgroup label="Redes sociales"><option value="youtube">YouTube</option><option value="tiktok">TikTok</option><option value="instagram">Instagram</option><option value="facebook">Facebook</option><option value="x">X</option><option value="linkedin">LinkedIn</option><option value="twitch">Twitch</option></optgroup><optgroup label="Comunidades"><option value="discord">Discord</option><option value="whatsapp">WhatsApp</option><option value="telegram">Telegram</option></optgroup><optgroup label="Contenido y web"><option value="spotify">Spotify</option><option value="github">GitHub</option><option value="blog">Blog</option><option value="music">Música</option><option value="globe">Sitio web</option><option value="link">Enlace</option></optgroup></select><button type="button" onClick={() => removeLink(link.id)} aria-label={`Eliminar ${link.label}`} className="flex size-9 items-center justify-center rounded-lg text-white/40 hover:bg-red-400/10 hover:text-red-300"><Trash2 className="size-4" /></button></div>)}</div><button type="button" disabled={profile.links.length >= 6} onClick={addLink} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-neon/30 px-4 py-2.5 text-sm font-bold text-neon-soft enabled:hover:bg-neon/10 disabled:cursor-not-allowed disabled:opacity-35"><Plus className="size-4" /> Agregar enlace</button></section>
          </div>
          <section className="lg:sticky lg:top-8 lg:self-start"><div className="mb-3 flex items-center justify-between"><div><h2 className="font-display text-lg font-bold">Vista previa</h2><p className="text-sm text-white/45">Se actualiza automáticamente.</p></div><span className="text-xs font-semibold text-emerald-300">En vivo</span></div><div className="mx-auto max-w-sm rounded-[2rem] border border-white/10 bg-void p-4 shadow-2xl"><div className="rounded-[1.5rem] px-4 py-9 text-center" style={{ background: `radial-gradient(circle at 50% 10%, ${profile.accent}55, #18042d 44%, #070014 90%)` }}><img src={profile.avatar} alt="" className="mx-auto size-20 rounded-full object-cover ring-4 ring-white/20" /><h3 className="mt-5 font-display text-2xl font-extrabold" style={{ color: profile.accent }}>{profile.displayName || 'Tu nombre'}</h3><p className="mt-2 text-sm text-white/65">{profile.bio || 'Añade una descripción'}</p><div className="mt-7 space-y-3">{profile.links.map((link) => <div key={link.id} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-bold ${profile.buttonStyle === 'soft' ? 'bg-white/10' : 'border border-white/25'}`}><span className="text-base">{iconGlyph(link.icon)}</span>{link.label}</div>)}</div></div></div></section>
        </div>
      </main>
    </div>
  )
}

function LinksCustomizationPanel({ onBack }: { onBack: () => void }) {
  const [profile, setProfile] = useState<ProfileConfig>(() => loadProfile())
  const updateProfile = (changes: Partial<ProfileConfig>) => setProfile((current) => { const next = { ...current, ...changes }; saveProfile(next); return next })
  const updateLink = (id: string, changes: Partial<ProfileConfig['links'][number]>) => updateProfile({ links: profile.links.map((link) => link.id === id ? { ...link, ...changes } : link) })
  const addLink = () => updateProfile({ links: [...profile.links, { id: `${Date.now()}`, label: 'Nuevo enlace', href: 'https://', icon: 'link' }] })
  const removeLink = (id: string) => updateProfile({ links: profile.links.filter((link) => link.id !== id) })
  const handleAvatar = (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => updateProfile({ avatar: String(reader.result) }); reader.readAsDataURL(file) }

  return (
    <div className="relative min-h-dvh overflow-hidden bg-midnight text-white">
      <BackgroundFx />
      <main className="relative z-10 mx-auto max-w-6xl px-5 py-6 sm:px-8 lg:px-12 lg:py-8">
        <header className="flex items-center justify-between border-b border-white/10 pb-5"><div><p className="text-sm font-semibold text-neon-soft">Personalización</p><h1 className="mt-1 font-display text-2xl font-extrabold">Construye tu página</h1></div><button type="button" onClick={onBack} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white/70 hover:text-white">Volver al resumen</button></header>
        <div className="grid gap-6 pt-8 lg:grid-cols-[minmax(0,1fr)_360px]"><div className="customization-sections space-y-6">
          <section className="rounded-2xl border border-white/10 bg-plum/55 p-5 backdrop-blur-sm sm:p-7"><h2 className="font-display text-lg font-bold">Color de los enlaces</h2><p className="mt-1 text-sm text-white/45">Elige el color que identificará tus botones y enlaces.</p><div className="mt-5 flex flex-wrap gap-3">{['#ec4899', '#fbbf24', '#38bdf8', '#a78bfa', '#34d399', '#fb7185'].map((color) => <button key={color} type="button" onClick={() => updateProfile({ accent: color })} aria-label={`Elegir color ${color}`} className={`size-10 rounded-full border-2 transition hover:scale-110 ${profile.accent === color ? 'scale-110 border-white shadow-[0_0_18px_-3px_currentColor]' : 'border-transparent'}`} style={{ backgroundColor: color, color }} />)}</div></section>
          <section className="rounded-2xl border border-white/10 bg-plum/55 p-5 backdrop-blur-sm sm:p-7"><div className="flex items-center gap-4"><img src={profile.avatar} alt="" className="size-16 rounded-2xl object-cover" /><div><h2 className="font-display text-lg font-bold">Foto de perfil</h2><p className="text-sm text-white/45">Configura la imagen que verá tu audiencia.</p></div><label className="ml-auto cursor-pointer rounded-xl bg-white px-3 py-2 text-xs font-bold text-ink hover:bg-amber">Cambiar<input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatar} className="sr-only" /></label></div></section>
          <section className="rounded-2xl border border-white/10 bg-plum/55 p-5 backdrop-blur-sm sm:p-7"><h2 className="font-display text-lg font-bold">Información pública</h2><div className="mt-5 grid gap-5 sm:grid-cols-2"><label><span className="mb-2 block text-sm font-semibold text-white/70">Nombre visible</span><input value={profile.displayName} onChange={(event) => updateProfile({ displayName: event.target.value })} className="w-full rounded-xl border border-white/10 bg-void/60 px-4 py-3 text-sm outline-none focus:border-neon" /></label><label><span className="mb-2 block text-sm font-semibold text-white/70">Descripción</span><input value={profile.bio} onChange={(event) => updateProfile({ bio: event.target.value })} className="w-full rounded-xl border border-white/10 bg-void/60 px-4 py-3 text-sm outline-none focus:border-neon" /></label></div></section>
          <section className="rounded-2xl border border-white/10 bg-plum/55 p-5 backdrop-blur-sm sm:p-7"><div className="flex items-center justify-between"><div><h2 className="font-display text-lg font-bold">Tus enlaces</h2><p className="text-sm text-white/45">Añade hasta 6 destinos y elige su icono.</p></div><span className="text-xs font-bold text-white/45">{profile.links.length}/6</span></div><div className="mt-5 hidden grid-cols-[minmax(0,1fr)_minmax(0,1fr)_180px_44px_36px] gap-3 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-white/40 sm:grid"><span>Título del enlace</span><span>Link de destino</span><span>Seleccionar icono</span><span>Icono</span><span aria-hidden="true" /></div><div className="mt-2 space-y-3">{profile.links.map((link) => <div key={link.id} className="grid gap-3 rounded-xl border border-white/10 bg-void/35 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_180px_44px_36px]"><input aria-label="Título del enlace" value={link.label} onChange={(event) => updateLink(link.id, { label: event.target.value })} className="order-1 rounded-lg border border-white/10 bg-void/60 px-3 py-2 text-sm outline-none focus:border-neon" /><input aria-label="Link de destino" value={link.href} onChange={(event) => updateLink(link.id, { href: event.target.value })} className="order-2 rounded-lg border border-white/10 bg-void/60 px-3 py-2 text-sm outline-none focus:border-neon" /><select aria-label="Seleccionar icono" value={link.icon} onChange={(event) => updateLink(link.id, { icon: event.target.value as ProfileIcon })} className="order-3 rounded-lg border border-white/10 bg-void/60 px-3 py-2 text-sm text-white outline-none focus:border-neon"><optgroup label="Redes sociales"><option value="youtube">YouTube</option><option value="tiktok">TikTok</option><option value="instagram">Instagram</option><option value="facebook">Facebook</option><option value="x">X</option><option value="linkedin">LinkedIn</option><option value="twitch">Twitch</option></optgroup><optgroup label="Comunidades"><option value="discord">Discord</option><option value="whatsapp">WhatsApp</option><option value="telegram">Telegram</option></optgroup><optgroup label="Contenido y web"><option value="spotify">Spotify</option><option value="github">GitHub</option><option value="blog">Blog</option><option value="music">Música</option><option value="globe">Sitio web</option><option value="link">Enlace</option></optgroup></select><div className="order-4 flex size-11 items-center justify-center rounded-lg bg-white/10 text-lg" title={`Icono seleccionado: ${link.icon}`}>{iconGlyph(link.icon)}</div><button type="button" onClick={() => removeLink(link.id)} aria-label={`Eliminar ${link.label}`} className="order-5 flex size-9 items-center justify-center self-center rounded-lg text-red-400 hover:bg-red-400/15 hover:text-red-300"><Trash2 className="size-4" /></button></div>)}</div><button type="button" disabled={profile.links.length >= 6} onClick={addLink} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-neon/30 px-4 py-2.5 text-sm font-bold text-neon-soft enabled:hover:bg-neon/10 disabled:cursor-not-allowed disabled:opacity-35"><Plus className="size-4" /> Agregar enlace</button> <div className="fixed bottom-6 right-5 z-30 sm:right-8 lg:right-[max(3rem,calc((100vw-72rem)/2+3rem))]"><button type="button" onClick={() => { saveProfile(profile); onBack() }} className="inline-flex items-center justify-center rounded-xl bg-amber px-7 py-3 text-sm font-extrabold text-ink shadow-[0_8px_30px_-8px_rgba(251,191,36,0.8)] transition hover:bg-amber-hot">Guardar</button></div></section>
        </div><section className="lg:sticky lg:top-8 lg:self-start"><h2 className="mb-3 font-display text-lg font-bold">Vista previa</h2><div className="mx-auto max-w-sm rounded-[2rem] border border-white/10 bg-void p-4 shadow-2xl"><div className="rounded-[1.5rem] px-4 py-9 text-center" style={{ background: `radial-gradient(circle at 50% 10%, ${profile.accent}55, #18042d 44%, #070014 90%)` }}><img src={profile.avatar} alt="" className="mx-auto size-20 rounded-full object-cover ring-4 ring-white/20" /><h3 className="mt-5 font-display text-2xl font-extrabold" style={{ color: profile.accent }}>{profile.displayName}</h3><p className="mt-2 text-sm text-white/65">{profile.bio}</p><div className="mt-7 space-y-3">{profile.links.map((link) => <div key={link.id} className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 text-left text-sm font-bold"><span>{iconGlyph(link.icon)}</span>{link.label}</div>)}</div></div></div></section></div>

      </main>
    </div>
  )
}

function iconGlyph(icon: ProfileIcon) {
  const icons = { youtube: FaYoutube, tiktok: FaTiktok, instagram: FaInstagram, facebook: FaFacebook, x: SiX, linkedin: FaLinkedin, spotify: SiSpotify, twitch: FaTwitch, github: FaGithub, discord: FaDiscord, whatsapp: FaWhatsapp, telegram: FaTelegram, blog: FaGlobe, music: FaMusic, globe: FaGlobe, link: FaLink }
  const Icon = icons[icon]
  return <Icon className="size-5" />
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



