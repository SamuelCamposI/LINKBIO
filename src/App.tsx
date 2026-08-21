import { motion } from 'framer-motion'
import { BookOpen, ChevronRight, Link2 } from 'lucide-react'
import type { ReactNode } from 'react'

type SocialLink = {
  id: string
  label: string
  href: string
  icon: ReactNode
}

const PROFILE = {
  name: 'fckn.daybeat',
  bio: 'Contenido, ritmo y vibes diarias',
  avatar: '/avatar.png',
  featured: {
    label: 'Algo Bien',
    href: 'https://www.youtube.com',
  },
}

const LINKS: SocialLink[] = [
  {
    id: 'youtube',
    label: 'YouTube',
    href: 'https://www.youtube.com',
    icon: <YouTubeIcon />,
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    href: 'https://www.tiktok.com',
    icon: <TikTokIcon />,
  },
  {
    id: 'instagram',
    label: 'Instagram',
    href: 'https://www.instagram.com',
    icon: <InstagramIcon />,
  },
  {
    id: 'blog',
    label: 'Blog personal',
    href: 'https://www.google.com',
    icon: <BookOpen className="size-6" strokeWidth={2.25} />,
  },
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.25 },
  },
}

const item = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 320, damping: 24 },
  },
}

export default function App() {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-midnight text-white">
      <BackgroundFx />

      <main className="relative z-10 mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-10 pt-12 sm:px-6">
        <motion.header
          className="flex flex-col items-center text-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="avatar-glow relative rounded-full p-[3px]">
            <img
              src={PROFILE.avatar}
              alt={PROFILE.name}
              width={128}
              height={128}
              className="size-28 rounded-full object-cover sm:size-32"
              draggable={false}
            />
          </div>

          <h1 className="mt-5 font-display text-3xl font-extrabold tracking-tight text-amber sm:text-4xl">
            {PROFILE.name}
          </h1>
          <p className="mt-2 max-w-[16rem] text-sm font-medium text-white/55">
            {PROFILE.bio}
          </p>

          <motion.a
            href={PROFILE.featured.href}
            target="_blank"
            rel="noopener noreferrer"
            className="cta-shimmer mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-white via-white to-pink-100 px-5 py-2.5 text-sm font-bold text-ink shadow-[0_10px_30px_-12px_rgba(255,255,255,0.65)] transition will-change-transform hover:scale-[1.04] active:scale-[0.98]"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link2 className="size-4 text-sky-500" strokeWidth={2.5} />
            {PROFILE.featured.label}
          </motion.a>
        </motion.header>

        <motion.nav
          className="mt-8 flex flex-1 flex-col gap-3.5"
          variants={container}
          initial="hidden"
          animate="show"
          aria-label="Enlaces principales"
        >
          {LINKS.map((link) => (
            <motion.a
              key={link.id}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              variants={item}
              whileHover={{ scale: 1.03, x: 2 }}
              whileTap={{ scale: 0.985 }}
              className="group flex items-center gap-4 rounded-3xl border border-neon/35 bg-plum/55 px-4 py-3.5 backdrop-blur-md transition-colors hover:border-neon/80 hover:bg-plum/80 hover:shadow-[0_0_28px_-8px_rgba(236,72,153,0.55)]"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-midnight/80 text-amber ring-1 ring-amber/25 transition group-hover:text-amber-hot group-hover:ring-neon/40">
                {link.icon}
              </span>
              <span className="flex-1 text-left text-base font-bold tracking-wide text-white">
                {link.label}
              </span>
              <ChevronRight
                className="size-5 text-amber transition group-hover:translate-x-0.5 group-hover:text-neon-soft"
                strokeWidth={2.5}
              />
            </motion.a>
          ))}
        </motion.nav>

        <motion.footer
          className="mt-10 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
        >
          <p className="font-display text-[11px] font-bold uppercase tracking-[0.18em] text-amber/90">
            Creado para creadores de contenido
          </p>
        </motion.footer>
      </main>
    </div>
  )
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

function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6 fill-current" aria-hidden>
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8ZM9.75 15.5v-7l6.2 3.5-6.2 3.5Z" />
    </svg>
  )
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6 fill-current" aria-hidden>
      <path d="M19.6 7.4a6.5 6.5 0 0 1-3.8-1.2v8.1a5.7 5.7 0 1 1-5.7-5.7c.3 0 .6 0 .9.1v2.8a2.9 2.9 0 1 0 2 2.8V2h2.8a6.5 6.5 0 0 0 3.8 3.6v1.8Z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6 fill-current" aria-hidden>
      <path d="M12 7.2A4.8 4.8 0 1 0 12 16.8 4.8 4.8 0 0 0 12 7.2Zm0 7.9a3.1 3.1 0 1 1 0-6.2 3.1 3.1 0 0 1 0 6.2Zm6.3-8.2a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0ZM21.5 8.1a6.5 6.5 0 0 0-1.8-4.6 6.5 6.5 0 0 0-4.6-1.8c-1.8-.1-7.3-.1-9.1 0a6.5 6.5 0 0 0-4.6 1.8 6.5 6.5 0 0 0-1.8 4.6c-.1 1.8-.1 7.3 0 9.1a6.5 6.5 0 0 0 1.8 4.6 6.5 6.5 0 0 0 4.6 1.8c1.8.1 7.3.1 9.1 0a6.5 6.5 0 0 0 4.6-1.8 6.5 6.5 0 0 0 1.8-4.6c.1-1.8.1-7.3 0-9.1Zm-2.3 11a3.8 3.8 0 0 1-2.1 2.1c-1.5.6-5 .5-6.6.5s-5.1.1-6.6-.5a3.8 3.8 0 0 1-2.1-2.1c-.6-1.5-.5-5-.5-6.6s-.1-5.1.5-6.6a3.8 3.8 0 0 1 2.1-2.1c1.5-.6 5-.5 6.6-.5s5.1-.1 6.6.5a3.8 3.8 0 0 1 2.1 2.1c.6 1.5.5 5 .5 6.6s.1 5.1-.5 6.6Z" />
    </svg>
  )
}
