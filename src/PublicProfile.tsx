import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { FaDiscord, FaFacebook, FaGithub, FaGlobe, FaInstagram, FaLink, FaLinkedin, FaMusic, FaTelegram, FaTiktok, FaTwitch, FaWhatsapp, FaYoutube } from 'react-icons/fa6'
import { SiSpotify, SiX } from 'react-icons/si'
import { useEffect, useState } from 'react'
import { loadProfile, type ProfileConfig, type ProfileIcon } from './profileConfig'

export default function PublicProfile() {
    const [profile, setProfile] = useState<ProfileConfig>(() => loadProfile())

    useEffect(() => {
        const refreshProfile = () => setProfile(loadProfile())
        window.addEventListener('storage', refreshProfile)
        return () => window.removeEventListener('storage', refreshProfile)
    }, [])

    return (
        <div className="relative min-h-dvh overflow-hidden bg-void text-white">
            <PublicBackground />
            <main className="relative z-10 mx-auto flex min-h-dvh w-full max-w-xl flex-col px-5 pb-10 pt-10 sm:px-8 sm:pt-14">
                <motion.header
                    className="flex flex-col items-center text-center"
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                    <div className="avatar-glow rounded-full p-[3px]">
                        <img src={profile.avatar} alt={profile.displayName} width={150} height={150} className="size-32 rounded-full object-cover sm:size-36" draggable={false} />
                    </div>
                    <h1 className="mt-6 font-display text-[2.4rem] font-extrabold leading-none tracking-[-0.06em] sm:text-5xl" style={{ color: profile.accent }}>{profile.displayName}</h1>
                    <p className="mt-4 text-base font-semibold text-white/55 sm:text-lg">{profile.bio}</p>
                </motion.header>

                <motion.nav
                    className="mt-12 space-y-4 sm:mt-14"
                    initial="hidden"
                    animate="show"
                    variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.3 } } }}
                    aria-label="Enlaces públicos"
                >
                    {profile.links.map((link) => (
                        <motion.a
                            key={link.label}
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                            className={`group flex min-h-28 items-center gap-5 rounded-[2rem] px-6 backdrop-blur-md transition hover:-translate-y-1 sm:px-7 ${profile.buttonStyle === 'soft' ? 'border border-white/15 bg-plum/60' : 'border border-white/35 bg-transparent'}`}
                        >
                            <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-midnight/75 transition" style={{ color: profile.accent, borderColor: `${profile.accent}66` }}>{getIcon(link.icon)}</span>
                            <span className="flex-1 text-left text-lg font-extrabold tracking-wide sm:text-xl">{link.label}</span>
                            <ArrowUpRight className="size-6 transition group-hover:-translate-y-1 group-hover:translate-x-1" style={{ color: profile.accent }} strokeWidth={2.5} />
                        </motion.a>
                    ))}
                </motion.nav>

                <motion.footer className="mt-auto pt-16 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 0.5 }}>
                    <p className="font-display text-[11px] font-bold uppercase tracking-[0.2em] text-amber/90 sm:text-xs">Creado para creadores de contenido</p>
                </motion.footer>
            </main>
        </div>
    )
}

function getIcon(icon: ProfileIcon) {
    const icons = { youtube: FaYoutube, tiktok: FaTiktok, instagram: FaInstagram, facebook: FaFacebook, x: SiX, linkedin: FaLinkedin, spotify: SiSpotify, twitch: FaTwitch, github: FaGithub, discord: FaDiscord, whatsapp: FaWhatsapp, telegram: FaTelegram, blog: FaGlobe, music: FaMusic, globe: FaGlobe, link: FaLink }
    const Icon = icons[icon]
    return <Icon className="size-8" />
}

function PublicBackground() {
    return <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden"><div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_18%,#481064_0%,#18042d_43%,#070014_82%)]" /><div className="absolute -left-24 top-48 size-80 rounded-full bg-neon/15 blur-[100px]" /><div className="absolute -right-24 top-[55%] size-80 rounded-full bg-amber/10 blur-[110px]" /><div className="absolute inset-0 opacity-[0.03] [background-image:linear-gradient(90deg,rgba(255,255,255,0.45)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.45)_1px,transparent_1px)] [background-size:64px_64px]" /></div>
}
