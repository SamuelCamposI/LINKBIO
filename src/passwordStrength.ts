/**
 * passwordStrength.ts
 * -------------------
 * Acá puse las reglas de la contraseña y unas validaciones extras
 * (correo, usuario, nombre, edad) para no llenar auth.ts de todo.
 *
 * La idea: cada regla que se cumple suma 1 punto (de 0 a 5)
 * y con eso armo la barrita de "qué tan segura está".
 */

export type PasswordRuleId = 'length' | 'upper' | 'lower' | 'number' | 'symbol'

export type PasswordRule = {
  id: PasswordRuleId
  label: string
  test: (password: string) => boolean
}

// Estas son las reglas que muestro en el checklist del registro
export const PASSWORD_RULES: PasswordRule[] = [
  { id: 'length', label: 'Mínimo 8 caracteres', test: (p) => p.length >= 8 },
  { id: 'upper', label: 'Una mayúscula', test: (p) => /[A-ZÁÉÍÓÚÑ]/.test(p) },
  { id: 'lower', label: 'Una minúscula', test: (p) => /[a-záéíóúñ]/.test(p) },
  { id: 'number', label: 'Un número', test: (p) => /\d/.test(p) },
  { id: 'symbol', label: 'Un símbolo (!@#$…)', test: (p) => /[^A-Za-zÁÉÍÓÚÑáéíóúñ0-9\s]/.test(p) },
]

export type PasswordStrength = {
  score: number
  max: number
  percent: number
  label: 'Débil' | 'Media' | 'Fuerte' | 'Muy fuerte'
  tone: 'weak' | 'fair' | 'good' | 'strong'
  checks: Record<PasswordRuleId, boolean>
  isStrongEnough: boolean
}

/** Revisa la contraseña y me devuelve el score + labels para la UI */
export function evaluatePassword(password: string): PasswordStrength {
  // Marco true/false por cada regla
  const checks = Object.fromEntries(
    PASSWORD_RULES.map((rule) => [rule.id, rule.test(password)]),
  ) as Record<PasswordRuleId, boolean>

  const score = PASSWORD_RULES.reduce((total, rule) => total + (checks[rule.id] ? 1 : 0), 0)
  const max = PASSWORD_RULES.length
  // Si está vacío, la barra queda en 0 (no quiero que se vea "débil" de una)
  const percent = password.length === 0 ? 0 : Math.round((score / max) * 100)

  let label: PasswordStrength['label'] = 'Débil'
  let tone: PasswordStrength['tone'] = 'weak'
  if (score >= 5) {
    label = 'Muy fuerte'
    tone = 'strong'
  } else if (score >= 4) {
    label = 'Fuerte'
    tone = 'good'
  } else if (score >= 3) {
    label = 'Media'
    tone = 'fair'
  }

  return {
    score,
    max,
    percent,
    label,
    tone,
    checks,
    // Con 4 de 5 ya dejo pasar (no quiero ser tan estricto)
    isStrongEnough: score >= 4,
  }
}

/** Chequeo básico de correo (nada fancy, pero sirve) */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())
}

/** Usuario para el link público: 3–20 chars, letras/números/. /_ */
export function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9._]{3,20}$/.test(username.trim())
}

/** Nombre o apellido: permite acentos y un espacio/guion raro */
export function isValidPersonName(name: string): boolean {
  return /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]{1,39}$/.test(name.trim())
}

/**
 * Saca la edad a partir de una fecha ISO (yyyy-mm-dd).
 * Si la fecha está mal o es del futuro, devuelvo null.
 */
export function getAgeFromBirthDate(isoDate: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null
  const birth = new Date(`${isoDate}T00:00:00`)
  if (Number.isNaN(birth.getTime())) return null
  const today = new Date()
  if (birth > today) return null
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  // Si todavía no cumplió este año, le resto 1
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age -= 1
  return age
}

// Edad mínima tipo redes sociales / COPPA
export const MIN_REGISTER_AGE = 13
