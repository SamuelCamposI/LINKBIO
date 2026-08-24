import { motion } from 'framer-motion'
import { ArrowUpRight, BookOpen, Camera } from 'lucide-react'

const PROFILE_LINKS = [
    { label: 'YouTube', href: 'https://www.youtube.com', icon: 'youtube' },
    { label: 'TikTok', href: 'https://www.tiktok.com', icon: 'tiktok' },
    { label: 'Instagram', href: 'https://www.instagram.com', icon: 'instagram' },
    { label: 'Blog personal', href: 'https://www.google.com', icon: 'blog' },
]

export default function PublicProfile() {
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
                        <img src="/avatar.png" alt="fckn.daybeat" width={150} height={150} className="size-32 rounded-full object-cover sm:size-36" draggable={false} />
                    </div>
                    <h1 className="mt-6 font-display text-[2.4rem] font-extrabold leading-none tracking-[-0.06em] text-amber sm:text-5xl">fckn.daybeat</h1>
                    <p className="mt-4 text-base font-semibold text-white/55 sm:text-lg">Contenido, ritmo y vibes diarias</p>
                </motion.header>

                <motion.nav
                    className="mt-12 space-y-4 sm:mt-14"
                    initial="hidden"
                    animate="show"
                    variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1, delayChildren: 0.3 } } }}
                    aria-label="Enlaces públicos"
                >
                    {PROFILE_LINKS.map((link) => (
                        <motion.a
                            key={link.label}
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                            className="group flex min-h-28 items-center gap-5 rounded-[2rem] border border-neon/40 bg-plum/60 px-6 backdrop-blur-md transition hover:-translate-y-1 hover:border-neon hover:bg-plum/85 hover:shadow-[0_0_32px_-10px_rgba(236,72,153,0.8)] sm:px-7"
                        >
                            <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl border border-amber/40 bg-midnight/75 text-amber transition group-hover:border-amber group-hover:text-amber-hot">{getIcon(link.icon)}</span>
                            <span className="flex-1 text-left text-lg font-extrabold tracking-wide sm:text-xl">{link.label}</span>
                            <ArrowUpRight className="size-6 text-amber transition group-hover:-translate-y-1 group-hover:translate-x-1" strokeWidth={2.5} />
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

function getIcon(icon: string) {
    if (icon === 'blog') return <BookOpen className="size-8" strokeWidth={2} />
    if (icon === 'instagram') return <Camera className="size-8" strokeWidth={2} />
    if (icon === 'youtube') return <span className="text-2xl font-black">▶</span>
    return <span className="text-3xl font-bold">♪</span>
}

function PublicBackground() {
    return <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden"><div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_18%,#481064_0%,#18042d_43%,#070014_82%)]" /><div className="absolute -left-24 top-48 size-80 rounded-full bg-neon/15 blur-[100px]" /><div className="absolute -right-24 top-[55%] size-80 rounded-full bg-amber/10 blur-[110px]" /><div className="absolute inset-0 opacity-[0.03] [background-image:linear-gradient(90deg,rgba(255,255,255,0.45)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.45)_1px,transparent_1px)] [background-size:64px_64px]" /></div>
}
