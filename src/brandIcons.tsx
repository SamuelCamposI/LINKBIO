/**
 * brandIcons.tsx
 * ---------------
 * Separé los iconos de marcas (YouTube, TikTok, etc.) pa' no tenerlos
 * mezclados en App / PublicProfile. Simple Icons + colores oficiales.
 */
import { FaGlobe, FaLink, FaLinkedin, FaMusic } from 'react-icons/fa6'
import {
  SiDiscord,
  SiFacebook,
  SiGithub,
  SiInstagram,
  SiSpotify,
  SiTelegram,
  SiTiktok,
  SiTwitch,
  SiWhatsapp,
  SiX,
  SiYoutube,
} from 'react-icons/si'
import type { ProfileIcon } from './profileConfig'

export const BRAND_ICON_MAP = {
  youtube: SiYoutube,
  tiktok: SiTiktok,
  instagram: SiInstagram,
  facebook: SiFacebook,
  x: SiX,
  linkedin: FaLinkedin,
  spotify: SiSpotify,
  twitch: SiTwitch,
  github: SiGithub,
  discord: SiDiscord,
  whatsapp: SiWhatsapp,
  telegram: SiTelegram,
  blog: FaGlobe,
  music: FaMusic,
  globe: FaGlobe,
  link: FaLink,
} as const

/** Fondo + color del glifo como se ven en las apps */
export const BRAND_BADGE: Record<ProfileIcon, { bg: string; fg: string }> = {
  youtube: { bg: '#FF0000', fg: '#FFFFFF' },
  tiktok: { bg: '#010101', fg: '#FFFFFF' },
  instagram: {
    bg: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)',
    fg: '#FFFFFF',
  },
  facebook: { bg: '#1877F2', fg: '#FFFFFF' },
  x: { bg: '#000000', fg: '#FFFFFF' },
  linkedin: { bg: '#0A66C2', fg: '#FFFFFF' },
  spotify: { bg: '#1DB954', fg: '#FFFFFF' },
  twitch: { bg: '#9146FF', fg: '#FFFFFF' },
  github: { bg: '#24292F', fg: '#FFFFFF' },
  discord: { bg: '#5865F2', fg: '#FFFFFF' },
  whatsapp: { bg: '#25D366', fg: '#FFFFFF' },
  telegram: { bg: '#26A5E4', fg: '#FFFFFF' },
  blog: { bg: '#0EA5E9', fg: '#FFFFFF' },
  music: { bg: '#F59E0B', fg: '#FFFFFF' },
  globe: { bg: '#38BDF8', fg: '#0B1220' },
  link: { bg: '#A78BFA', fg: '#FFFFFF' },
}

const SIZE_CLASS = {
  sm: { box: 'size-5 rounded-md', glyph: 'size-2.5' },
  md: { box: 'size-8 rounded-lg', glyph: 'size-4' },
  lg: { box: 'size-10 rounded-xl', glyph: 'size-5' },
} as const

/** Badge de color + logo de la red */
export function BrandIcon({
  icon,
  size = 'md',
  className = '',
}: {
  icon: ProfileIcon
  size?: keyof typeof SIZE_CLASS
  className?: string
}) {
  const Icon = BRAND_ICON_MAP[icon]
  const badge = BRAND_BADGE[icon]
  const dims = SIZE_CLASS[size]

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${dims.box} ${className}`}
      style={{ background: badge.bg, color: badge.fg }}
      aria-hidden
    >
      <Icon className={dims.glyph} />
    </span>
  )
}
