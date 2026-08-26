export type ProfileIcon = 'youtube' | 'tiktok' | 'instagram' | 'facebook' | 'x' | 'linkedin' | 'spotify' | 'twitch' | 'github' | 'discord' | 'whatsapp' | 'telegram' | 'blog' | 'music' | 'globe' | 'link'

export type ProfileLink = {
  id: string
  label: string
  href: string
  icon: ProfileIcon
}

export type ProfileConfig = {
  displayName: string
  bio: string
  avatar: string
  accent: string
  buttonStyle: 'soft' | 'outline'
  links: ProfileLink[]
}

export const DEFAULT_PROFILE: ProfileConfig = {
  displayName: 'fckn.daybeat',
  bio: 'Contenido, ritmo y vibes diarias',
  avatar: '/avatar.png',
  accent: '#ec4899',
  buttonStyle: 'soft',
  links: [
    { id: 'youtube', label: 'YouTube', href: 'https://www.youtube.com', icon: 'youtube' },
    { id: 'tiktok', label: 'TikTok', href: 'https://www.tiktok.com', icon: 'tiktok' },
    { id: 'instagram', label: 'Instagram', href: 'https://www.instagram.com', icon: 'instagram' },
    { id: 'blog', label: 'Blog personal', href: 'https://www.google.com', icon: 'blog' },
  ],
}

const STORAGE_KEY = 'linkbio-profile'

export function loadProfile(): ProfileConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return DEFAULT_PROFILE
    return { ...DEFAULT_PROFILE, ...JSON.parse(saved), links: JSON.parse(saved).links ?? DEFAULT_PROFILE.links }
  } catch {
    return DEFAULT_PROFILE
  }
}

export function saveProfile(profile: ProfileConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
}