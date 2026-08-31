/**
 * PublicProfile — mundo del creador (carta pública)
 * ---------------
 * Notas:
 * - Reorganicé esta página porque se sentía muy vacía
 * - Armé un bento más denso: hero, now playing, showcase, links, playlist, drop, hangout y cita
 * - Va más a discovery pa' quien llega (no analytics de creador)
 * - Por ahora todo estático / mock, sin pelearme con lo funcional
 */
import { motion, useReducedMotion } from 'framer-motion'
import {
  ArrowUpRight,
  Clock3,
  Disc3,
  Headphones,
  Link2,
  MessageCircle,
  Music2,
  Play,
  Radio,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react'
import { memo, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { BrandIcon } from './brandIcons'
import { loadProfile, type ProfileConfig, type ProfileLink } from './profileConfig'

// Showcase mock — pa' llenar la sección y que se vea con vida
const SHOWCASE = [
  {
    id: 'live',
    title: 'Sesión en vivo',
    blurb: 'Ritmo & drops · ahora mismo',
    cta: 'Entrar al stream',
    href: 'https://www.twitch.tv',
    tone: 'live' as const,
    Icon: Play,
    featured: true,
  },
  {
    id: 'set',
    title: 'Set nocturno',
    blurb: '90 min crudos',
    cta: 'Escuchar',
    href: 'https://www.twitch.tv',
    tone: 'a' as const,
    Icon: Headphones,
    featured: false,
  },
  {
    id: 'drop',
    title: 'Drop de la semana',
    blurb: 'No te lo pierdas',
    cta: 'Ver',
    href: 'https://www.youtube.com',
    tone: 'b' as const,
    Icon: Zap,
    featured: false,
  },
  {
    id: 'reel',
    title: 'Behind the vibes',
    blurb: 'Tras el set',
    cta: 'Mirar',
    href: 'https://www.instagram.com',
    tone: 'c' as const,
    Icon: Sparkles,
    featured: false,
  },
]

const PLAYLIST = [
  { title: 'Midnight Drive', meta: '3:42' },
  { title: 'Neon Floor', meta: '4:08' },
  { title: 'Afterglow', meta: '2:55' },
]

const VIBE_TAGS = ['Noche', 'Bass', 'Live', 'Lo-fi', 'Drops', 'Club', 'Chill', 'Raw']

const LINK_BLURBS: Partial<Record<ProfileLink['icon'], string>> = {
  youtube: 'Videos y drops',
  tiktok: 'Clips del momento',
  instagram: 'Fotos y reels',
  twitch: 'Sesiones en vivo',
  telegram: 'Comunidad',
  x: 'Notas rápidas',
  spotify: 'Playlists',
  discord: 'Sala de fans',
  music: 'Pistas nuevas',
  blog: 'Bitácora',
  facebook: 'Updates',
  whatsapp: 'Directo',
  github: 'Proyectos',
  linkedin: 'Pro',
  globe: 'Web',
  link: 'Más',
}

export default function PublicProfile() {
  const [profile, setProfile] = useState<ProfileConfig>(() => loadProfile())
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const onStorage = () => setProfile(loadProfile())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const theme = useMemo(
    () =>
      ({
        ['--pp-accent' as string]: profile.accent,
      }) as CSSProperties,
    [profile.accent],
  )

  return (
    <div className="public-profile" style={theme}>
      <PublicBackground />
      <div className="public-profile-shell">
        <div className="public-profile-frame">
          <PublicTopBar />

          <main className="public-profile-bento">
            <PublicHero profile={profile} accent={profile.accent} reduceMotion={!!reduceMotion} />
            <PublicNowPlaying accent={profile.accent} reduceMotion={!!reduceMotion} />
            <PublicShowcase accent={profile.accent} reduceMotion={!!reduceMotion} />
            <PublicLinkRail
              links={profile.links}
              accent={profile.accent}
              soft={profile.buttonStyle === 'soft'}
              reduceMotion={!!reduceMotion}
            />
            <PublicPlaylist accent={profile.accent} reduceMotion={!!reduceMotion} />
            <PublicNextDrop accent={profile.accent} reduceMotion={!!reduceMotion} />
            <PublicHangout accent={profile.accent} reduceMotion={!!reduceMotion} />
            <PublicQuote reduceMotion={!!reduceMotion} />
          </main>

          <footer className="public-profile-footer">
            <Sparkles className="size-3 text-amber" aria-hidden />
            <span>fckn.daybeat</span>
            <span className="text-white/25">·</span>
            <span className="text-white/40">Tu ritmo, un solo link</span>
          </footer>
        </div>
      </div>
    </div>
  )
}

function PublicTopBar() {
  return (
    <header className="public-profile-topbar">
      <span className="public-profile-mark">
        <span className="public-profile-mark-icon">
          <Link2 className="size-3.5" />
        </span>
        fckn<span className="text-amber">.</span>daybeat
      </span>
      <span className="public-profile-live">
        <span className="public-profile-live-dot" aria-hidden />
        En vivo · 1.2k
      </span>
    </header>
  )
}

function FadeIn({
  children,
  className,
  delay = 0,
  reduceMotion,
}: {
  children: ReactNode
  className?: string
  delay?: number
  reduceMotion: boolean
}) {
  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: reduceMotion ? 0 : delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

/** Hero: avatar, bio, tags y CTA de “Ver en vivo” */
function PublicHero({
  profile,
  accent,
  reduceMotion,
}: {
  profile: ProfileConfig
  accent: string
  reduceMotion: boolean
}) {
  return (
    <FadeIn className="pp-panel pp-hero" delay={0.02} reduceMotion={reduceMotion}>
      <div className="pp-hero-art" aria-hidden>
        <span className="pp-hero-orb a" />
        <span className="pp-hero-orb b" />
        <span className="pp-hero-wave" />
      </div>
      <div className="pp-hero-main">
        <div className="public-profile-avatar-ring" style={{ background: accent }}>
          <img src={profile.avatar} alt="" className="public-profile-avatar" draggable={false} />
        </div>
        <div className="pp-hero-copy">
          <p className="public-profile-kicker">Conoce al creador</p>
          <h1 className="public-profile-title">{profile.displayName}</h1>
          <p className="public-profile-bio">{profile.bio}</p>
          <div className="pp-identity-tags">
            <span className="pp-chip pp-chip-accent">
              <Music2 className="size-3.5" /> Ritmo diario
            </span>
            <span className="pp-chip">
              <Sparkles className="size-3.5" /> Vibes
            </span>
            <span className="pp-chip">
              <Radio className="size-3.5" /> Live sets
            </span>
          </div>
        </div>
      </div>
      <div className="pp-hero-side">
        <p className="pp-hero-side-label">
          <span className="public-profile-live-dot" /> Empieza aquí
        </p>
        <a
          href="https://www.twitch.tv"
          target="_blank"
          rel="noopener noreferrer"
          className="pp-hero-cta"
          style={{ background: accent }}
        >
          <Play className="size-4" fill="currentColor" />
          Ver en vivo
          <ArrowUpRight className="size-4" />
        </a>
        <p className="pp-hero-side-note">Online ahora · pásate un rato</p>
      </div>
    </FadeIn>
  )
}

/** “Sonando ahora” + marquee de vibes — pa' llenar espacio y dar vibe */
function PublicNowPlaying({ accent, reduceMotion }: { accent: string; reduceMotion: boolean }) {
  return (
    <FadeIn className="pp-panel pp-now" delay={0.05} reduceMotion={reduceMotion}>
      <div className="pp-now-left">
        <span className="pp-now-disc" style={{ color: accent }} aria-hidden>
          <Disc3 className="size-5 pp-now-spin" />
        </span>
        <div>
          <p className="pp-now-kicker">Sonando ahora</p>
          <p className="pp-now-title">Neon Floor — Live Edit</p>
        </div>
      </div>
      <div className="pp-now-bars" aria-hidden>
        {Array.from({ length: 16 }, (_, i) => (
          <span key={i} className="pp-now-bar" style={{ animationDelay: `${i * 0.08}s`, background: accent }} />
        ))}
      </div>
      <div className="pp-vibe-marquee" aria-hidden>
        <div className="pp-vibe-track">
          {[...VIBE_TAGS, ...VIBE_TAGS].map((tag, i) => (
            <span key={`${tag}-${i}`} className="pp-vibe-pill">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </FadeIn>
  )
}

/** Mosaic de cards (live grande + 3 tiles) — aprovecha mejor el ancho */
function PublicShowcase({ accent, reduceMotion }: { accent: string; reduceMotion: boolean }) {
  const featured = SHOWCASE.find((item) => item.featured)!
  const rest = SHOWCASE.filter((item) => !item.featured)

  return (
    <FadeIn className="pp-showcase" delay={0.08} reduceMotion={reduceMotion}>
      <a
        href={featured.href}
        target="_blank"
        rel="noopener noreferrer"
        className="pp-panel pp-show-card is-live is-featured"
        style={{ ['--show-accent' as string]: accent }}
      >
        <div className="pp-show-visual" aria-hidden>
          <featured.Icon className="pp-show-icon" />
          <span className="pp-show-glow" />
        </div>
        <div className="pp-show-copy">
          <span className="pp-show-badge">
            <span className="public-profile-live-dot" /> Destacado
          </span>
          <p className="pp-show-title">{featured.title}</p>
          <p className="pp-show-blurb">{featured.blurb}</p>
          <span className="pp-show-cta">
            {featured.cta}
            <ArrowUpRight className="size-3.5" />
          </span>
        </div>
      </a>
      {rest.map((item, index) => (
        <motion.a
          key={item.id}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`pp-panel pp-show-card is-${item.tone}`}
          style={{ ['--show-accent' as string]: accent }}
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: reduceMotion ? 0 : 0.1 + index * 0.04 }}
        >
          <div className="pp-show-visual" aria-hidden>
            <item.Icon className="pp-show-icon" />
            <span className="pp-show-glow" />
          </div>
          <div className="pp-show-copy">
            <p className="pp-show-title">{item.title}</p>
            <p className="pp-show-blurb">{item.blurb}</p>
            <span className="pp-show-cta">
              {item.cta}
              <ArrowUpRight className="size-3.5" />
            </span>
          </div>
        </motion.a>
      ))}
    </FadeIn>
  )
}

function PublicLinkRail({
  links,
  accent,
  soft,
  reduceMotion,
}: {
  links: ProfileLink[]
  accent: string
  soft: boolean
  reduceMotion: boolean
}) {
  return (
    <FadeIn className="pp-panel pp-rail" delay={0.1} reduceMotion={reduceMotion}>
      <div className="pp-section-head is-inline">
        <div>
          <p className="public-profile-rail-label">Explora</p>
          <span className="pp-section-note">Elige tu puerta de entrada</span>
        </div>
        <span className="pp-mini-chip">{links.length} links</span>
      </div>
      <ul className="public-profile-links">
        {links.map((link, index) => (
          <li key={link.id}>
            <PublicLinkRow link={link} accent={accent} soft={soft} index={index} reduceMotion={reduceMotion} />
          </li>
        ))}
      </ul>
    </FadeIn>
  )
}

const PublicLinkRow = memo(function PublicLinkRow({
  link,
  accent,
  soft,
  index,
  reduceMotion,
}: {
  link: ProfileLink
  accent: string
  soft: boolean
  index: number
  reduceMotion: boolean
}) {
  return (
    <motion.a
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      className={`public-profile-link ${soft ? 'is-soft' : 'is-outline'}`}
      style={{ ['--link-accent' as string]: accent }}
      initial={reduceMotion ? false : { opacity: 0, x: 6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: reduceMotion ? 0 : 0.08 + index * 0.03 }}
    >
      <BrandIcon icon={link.icon} size="md" />
      <span className="public-profile-link-copy">
        <span className="public-profile-link-label">{link.label}</span>
        <span className="public-profile-link-meta">{LINK_BLURBS[link.icon] ?? 'Descubre más'}</span>
      </span>
      <span className="public-profile-link-go" aria-hidden>
        <ArrowUpRight strokeWidth={2.5} />
      </span>
    </motion.a>
  )
})

function PublicPlaylist({ accent, reduceMotion }: { accent: string; reduceMotion: boolean }) {
  return (
    <FadeIn className="pp-panel pp-playlist" delay={0.12} reduceMotion={reduceMotion}>
      <div className="pp-section-head is-inline">
        <p className="public-profile-rail-label">Playlist</p>
        <span className="pp-mini-chip" style={{ color: accent }}>
          <Headphones className="size-3" /> Hot
        </span>
      </div>
      <ul className="pp-playlist-list">
        {PLAYLIST.map((track, index) => (
          <li key={track.title} className="pp-playlist-row">
            <span className="pp-playlist-num">{index + 1}</span>
            <span className="pp-playlist-title">{track.title}</span>
            <span className="pp-playlist-meta">{track.meta}</span>
          </li>
        ))}
      </ul>
      <a
        href="https://open.spotify.com"
        target="_blank"
        rel="noopener noreferrer"
        className="pp-soft-cta"
        style={{ color: accent, borderColor: accent }}
      >
        Abrir playlist
        <ArrowUpRight className="size-3.5" />
      </a>
    </FadeIn>
  )
}

function PublicNextDrop({ accent, reduceMotion }: { accent: string; reduceMotion: boolean }) {
  return (
    <FadeIn className="pp-panel pp-next" delay={0.13} reduceMotion={reduceMotion}>
      <div className="pp-section-head is-inline">
        <p className="public-profile-rail-label">Próximo drop</p>
        <span className="pp-mini-chip">
          <Clock3 className="size-3" /> 2d
        </span>
      </div>
      <div className="pp-next-body">
        <p className="pp-next-day" style={{ color: accent }}>
          Vie
        </p>
        <div className="pp-next-copy">
          <p className="pp-next-title">Midnight Session #14</p>
          <p className="pp-next-meta">21:00 · Twitch · guests</p>
        </div>
      </div>
      <div className="pp-next-chips">
        <span className="pp-mini-chip">Live set</span>
        <span className="pp-mini-chip">Invitados</span>
      </div>
      <a
        href="https://www.twitch.tv"
        target="_blank"
        rel="noopener noreferrer"
        className="pp-soft-cta"
        style={{ color: accent, borderColor: accent }}
      >
        Quiero enterarme
        <ArrowUpRight className="size-3.5" />
      </a>
    </FadeIn>
  )
}

function PublicHangout({ accent, reduceMotion }: { accent: string; reduceMotion: boolean }) {
  return (
    <FadeIn className="pp-panel pp-hangout" delay={0.14} reduceMotion={reduceMotion}>
      <div className="pp-section-head is-inline">
        <p className="public-profile-rail-label">Hangout</p>
        <span className="pp-mini-chip">
          <Users className="size-3" /> 128
        </span>
      </div>
      <div className="pp-hangout-row">
        <div className="pp-hangout-visual" style={{ ['--hang-accent' as string]: accent }}>
          <MessageCircle className="pp-hangout-icon" />
        </div>
        <div className="pp-hangout-copy">
          <p className="pp-hangout-title">Sala Discord</p>
          <p className="pp-hangout-blurb">Chat post-set y adelantos.</p>
        </div>
      </div>
      <a
        href="https://discord.com"
        target="_blank"
        rel="noopener noreferrer"
        className="pp-hangout-cta"
        style={{ background: accent }}
      >
        Entrar
        <ArrowUpRight className="size-3.5" />
      </a>
    </FadeIn>
  )
}

function PublicQuote({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <FadeIn className="pp-panel pp-quote" delay={0.15} reduceMotion={reduceMotion}>
      <p className="pp-quote-text">“Si llegas temprano, te quedas hasta el final.”</p>
      <p className="pp-quote-meta">— fckn.daybeat</p>
    </FadeIn>
  )
}

function PublicBackground() {
  return (
    <div aria-hidden className="public-profile-bg">
      <div className="public-profile-bg-base" />
      <div
        className="public-profile-bg-beam"
        style={{
          background: 'radial-gradient(ellipse at 28% 18%, var(--pp-accent-glow, #fbbf2444), transparent 55%)',
        }}
      />
      <div className="public-profile-bg-orb public-profile-bg-orb-a" />
      <div className="public-profile-bg-orb public-profile-bg-orb-b" />
      <div className="public-profile-bg-grid" />
    </div>
  )
}
