/**
 * auth.ts
 * ---------------
 * Auth mock por ahora (sin MongoDB todavía).
 * - Login / registro
 * - Recuperar contraseña con código de 6 dígitos
 * - Todo se guarda en localStorage / sessionStorage
 *
 * Demo: samuel@gmail.com / 1234
 */

import {
  evaluatePassword,
  getAgeFromBirthDate,
  isValidEmail,
  isValidPersonName,
  isValidUsername,
  MIN_REGISTER_AGE,
} from './passwordStrength'

// Keys para no hardcodear strings por todos lados
const AUTH_STORAGE_KEY = 'linkbio-auth-session'
const REMEMBER_KEY = 'linkbio-auth-remember'
const USERS_KEY = 'linkbio-mock-users'
const RESET_KEY = 'linkbio-mock-reset'
// Si alguien cambia la pass del demo desde "olvidé contraseña", la guardo acá
const DEMO_PASSWORD_KEY = 'linkbio-mock-demo-password'

// Config del código de recuperación (como hacen las páginas top)
const RESET_CODE_TTL_MS = 10 * 60 * 1000 // 10 min
const RESET_MAX_ATTEMPTS = 5
const RESEND_COOLDOWN_SEC = 45

export const AUTH_MODE = (import.meta.env.VITE_AUTH_MODE as string | undefined) ?? 'mock'
export const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? ''

const DEMO_EMAIL = (import.meta.env.VITE_DEMO_EMAIL as string | undefined) ?? 'samuel@gmail.com'
const DEMO_PASSWORD = (import.meta.env.VITE_DEMO_PASSWORD as string | undefined) ?? '1234'

export type AuthSession = {
  email: string
  username?: string
  firstName?: string
  lastName?: string
  loggedInAt: string
  remember: boolean
}

type MockUser = {
  email: string
  username: string
  password: string
  firstName: string
  lastName: string
  birthDate: string
}

function readStore(store: Storage): AuthSession | null {
  try {
    const raw = store.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthSession
  } catch {
    return null
  }
}

export function getRememberPreference(): boolean {
  try {
    return localStorage.getItem(REMEMBER_KEY) === '1'
  } catch {
    return true
  }
}

export function setRememberPreference(remember: boolean) {
  localStorage.setItem(REMEMBER_KEY, remember ? '1' : '0')
}

export function getSession(): AuthSession | null {
  return readStore(localStorage) ?? readStore(sessionStorage)
}

export function isAuthenticated(): boolean {
  return getSession() !== null
}

function saveSession(session: AuthSession, remember: boolean) {
  const payload = JSON.stringify({ ...session, remember })
  if (remember) {
    localStorage.setItem(AUTH_STORAGE_KEY, payload)
    sessionStorage.removeItem(AUTH_STORAGE_KEY)
  } else {
    sessionStorage.setItem(AUTH_STORAGE_KEY, payload)
    localStorage.removeItem(AUTH_STORAGE_KEY)
  }
  setRememberPreference(remember)
}

export function logout() {
  localStorage.removeItem(AUTH_STORAGE_KEY)
  sessionStorage.removeItem(AUTH_STORAGE_KEY)
}

function readUsers(): MockUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as MockUser[]
  } catch {
    return []
  }
}

function writeUsers(users: MockUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function findUser(email: string): MockUser | undefined {
  const normalized = email.trim().toLowerCase()
  return readUsers().find((user) => user.email === normalized)
}

// Pass del usuario demo (puede cambiarse si hizo reset)
function getDemoPassword(): string {
  try {
    return localStorage.getItem(DEMO_PASSWORD_KEY) ?? DEMO_PASSWORD
  } catch {
    return DEMO_PASSWORD
  }
}

export function getCurrentDemoPassword(): string {
  return getDemoPassword()
}

function setDemoPassword(password: string) {
  localStorage.setItem(DEMO_PASSWORD_KEY, password)
}

function accountExists(email: string): boolean {
  const normalized = email.trim().toLowerCase()
  return normalized === DEMO_EMAIL.toLowerCase() || Boolean(findUser(normalized))
}

/** Enmascara el correo tipo sa***@gmail.com para mostrarlo en la UI */
export function maskEmail(email: string): string {
  const normalized = email.trim().toLowerCase()
  const [local, domain] = normalized.split('@')
  if (!local || !domain) return normalized
  const visible = local.slice(0, Math.min(2, local.length))
  return `${visible}${'*'.repeat(Math.max(3, local.length - visible.length))}@${domain}`
}

// Datos del "desafío" de recuperar pass (vive en sessionStorage)
type ResetChallenge = {
  email: string
  code: string
  expiresAt: number
  attempts: number
  verified: boolean
}

function readReset(): ResetChallenge | null {
  try {
    const raw = sessionStorage.getItem(RESET_KEY)
    if (!raw) return null
    return JSON.parse(raw) as ResetChallenge
  } catch {
    return null
  }
}

function writeReset(challenge: ResetChallenge | null) {
  if (!challenge) {
    sessionStorage.removeItem(RESET_KEY)
    return
  }
  sessionStorage.setItem(RESET_KEY, JSON.stringify(challenge))
}

// Código random de 6 dígitos (100000–999999)
function generateResetCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

export type ResetRequestResult =
  | { ok: true; maskedEmail: string; cooldownSec: number; mockCode?: string }
  | { ok: false; error: string }

/**
 * Paso 1 de recuperar contraseña: "enviamos" el código.
 * Ojo: siempre respondo OK si el correo está bien escrito,
 * para no decirle a nadie si la cuenta existe o no (anti-enumeración).
 * En modo mock también devuelvo mockCode para poder probar sin email real.
 */
export async function requestPasswordReset(email: string): Promise<ResetRequestResult> {
  const normalized = email.trim().toLowerCase()
  if (!normalized) return { ok: false, error: 'Ingresa tu correo.' }
  if (!isValidEmail(normalized)) return { ok: false, error: 'Ingresa un correo válido.' }

  const maskedEmail = maskEmail(normalized)
  if (accountExists(normalized)) {
    const code = generateResetCode()
    writeReset({
      email: normalized,
      code,
      expiresAt: Date.now() + RESET_CODE_TTL_MS,
      attempts: 0,
      verified: false,
    })
    return {
      ok: true,
      maskedEmail,
      cooldownSec: RESEND_COOLDOWN_SEC,
      mockCode: AUTH_MODE === 'mock' ? code : undefined,
    }
  }

  // Aunque no exista, finjo que sí (mismo mensaje)
  writeReset(null)
  return { ok: true, maskedEmail, cooldownSec: RESEND_COOLDOWN_SEC }
}

export type ResetVerifyResult = { ok: true } | { ok: false; error: string }

/** Paso 2: el usuario mete el código de 6 dígitos */
export async function verifyPasswordResetCode(email: string, code: string): Promise<ResetVerifyResult> {
  const normalized = email.trim().toLowerCase()
  const cleaned = code.replace(/\D/g, '')
  if (cleaned.length !== 6) return { ok: false, error: 'Ingresa el código de 6 dígitos.' }

  const challenge = readReset()
  if (!challenge || challenge.email !== normalized) {
    return { ok: false, error: 'Solicita un código nuevo e inténtalo de nuevo.' }
  }
  if (Date.now() > challenge.expiresAt) {
    writeReset(null)
    return { ok: false, error: 'El código expiró. Solicita uno nuevo.' }
  }
  if (challenge.attempts >= RESET_MAX_ATTEMPTS) {
    writeReset(null)
    return { ok: false, error: 'Demasiados intentos. Solicita un código nuevo.' }
  }
  if (challenge.code !== cleaned) {
    writeReset({ ...challenge, attempts: challenge.attempts + 1 })
    const left = RESET_MAX_ATTEMPTS - challenge.attempts - 1
    return {
      ok: false,
      error: left > 0 ? `Código incorrecto. Te quedan ${left} intentos.` : 'Código incorrecto. Solicita uno nuevo.',
    }
  }

  // Código ok → marco verified para poder cambiar la pass
  writeReset({ ...challenge, verified: true, attempts: 0 })
  return { ok: true }
}

/**
 * Paso 3: ya verificó el código, ahora sí cambia la contraseña.
 * Si es el user demo, guardo la pass nueva en localStorage.
 */
export async function completePasswordReset(
  email: string,
  password: string,
  confirmPassword: string,
): Promise<ResetVerifyResult> {
  const normalized = email.trim().toLowerCase()
  if (!password || !confirmPassword) return { ok: false, error: 'Completa y confirma tu contraseña.' }
  if (password !== confirmPassword) return { ok: false, error: 'Las contraseñas no coinciden.' }

  const strength = evaluatePassword(password)
  if (!strength.isStrongEnough) {
    return { ok: false, error: 'La contraseña aún no es lo bastante segura.' }
  }

  const challenge = readReset()
  if (!challenge || challenge.email !== normalized || !challenge.verified) {
    return { ok: false, error: 'Verifica el código antes de cambiar la contraseña.' }
  }
  if (Date.now() > challenge.expiresAt) {
    writeReset(null)
    return { ok: false, error: 'La sesión de recuperación expiró. Empieza de nuevo.' }
  }

  if (normalized === DEMO_EMAIL.toLowerCase()) {
    setDemoPassword(password)
    writeReset(null)
    return { ok: true }
  }

  const users = readUsers()
  const index = users.findIndex((user) => user.email === normalized)
  if (index === -1) {
    writeReset(null)
    return { ok: false, error: 'No se pudo actualizar la contraseña.' }
  }

  users[index] = { ...users[index], password }
  writeUsers(users)
  writeReset(null)
  return { ok: true }
}

/** Limpia el challenge si el user se sale del flujo */
export function clearPasswordReset() {
  writeReset(null)
}

export { RESEND_COOLDOWN_SEC }

export type AuthResult = { ok: true; session: AuthSession } | { ok: false; error: string }
export type LoginResult = AuthResult

export async function login(
  email: string,
  password: string,
  remember = true,
): Promise<LoginResult> {
  const normalizedEmail = email.trim().toLowerCase()

  if (!normalizedEmail || !password) {
    return { ok: false, error: 'Ingresa tu correo y contraseña.' }
  }

  if (AUTH_MODE === 'api' && API_URL) {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password, remember }),
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string } | null
        return { ok: false, error: data?.message ?? 'Credenciales incorrectas.' }
      }

      const data = (await response.json()) as { email: string; username?: string }
      const session: AuthSession = {
        email: data.email,
        username: data.username,
        loggedInAt: new Date().toISOString(),
        remember,
      }
      saveSession(session, remember)
      return { ok: true, session }
    } catch {
      return { ok: false, error: 'No se pudo conectar con el servidor.' }
    }
  }

  if (normalizedEmail === DEMO_EMAIL.toLowerCase() && password === getDemoPassword()) {
    const session: AuthSession = {
      email: normalizedEmail,
      username: 'samuel',
      loggedInAt: new Date().toISOString(),
      remember,
    }
    saveSession(session, remember)
    return { ok: true, session }
  }

  const user = findUser(normalizedEmail)
  if (user && user.password === password) {
    const session: AuthSession = {
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      loggedInAt: new Date().toISOString(),
      remember,
    }
    saveSession(session, remember)
    return { ok: true, session }
  }

  return { ok: false, error: 'Correo o contraseña incorrectos.' }
}

export type RegisterInput = {
  email: string
  firstName: string
  lastName: string
  username: string
  birthDate: string
  password: string
  confirmPassword: string
  acceptTerms: boolean
}

/** Registro mock: valido todo, guardo el user en localStorage y abro sesión */
export async function register(input: RegisterInput): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase()
  const firstName = input.firstName.trim()
  const lastName = input.lastName.trim()
  const username = input.username.trim()
  const birthDate = input.birthDate.trim()
  const { password, confirmPassword, acceptTerms } = input

  if (!email || !firstName || !lastName || !username || !birthDate || !password || !confirmPassword) {
    return { ok: false, error: 'Completa todos los campos.' }
  }
  if (!acceptTerms) {
    return { ok: false, error: 'Debes aceptar los Términos y la Privacidad.' }
  }
  if (!isValidEmail(email)) {
    return { ok: false, error: 'Ingresa un correo válido.' }
  }
  if (!isValidPersonName(firstName)) {
    return { ok: false, error: 'Ingresa un nombre válido.' }
  }
  if (!isValidPersonName(lastName)) {
    return { ok: false, error: 'Ingresa un apellido válido.' }
  }
  if (!isValidUsername(username)) {
    return { ok: false, error: 'Usuario: 3–20 caracteres (letras, números, . o _).' }
  }

  const age = getAgeFromBirthDate(birthDate)
  if (age === null) {
    return { ok: false, error: 'Ingresa una fecha de nacimiento válida.' }
  }
  if (age < MIN_REGISTER_AGE) {
    return { ok: false, error: `Debes tener al menos ${MIN_REGISTER_AGE} años para registrarte.` }
  }

  if (password !== confirmPassword) {
    return { ok: false, error: 'Las contraseñas no coinciden.' }
  }

  const strength = evaluatePassword(password)
  if (!strength.isStrongEnough) {
    return { ok: false, error: 'La contraseña aún no es lo bastante segura.' }
  }

  if (email === DEMO_EMAIL.toLowerCase()) {
    return { ok: false, error: 'Ese correo ya está en uso.' }
  }

  const users = readUsers()
  if (users.some((user) => user.email === email)) {
    return { ok: false, error: 'Ese correo ya está registrado.' }
  }
  if (users.some((user) => user.username.toLowerCase() === username.toLowerCase())) {
    return { ok: false, error: 'Ese nombre de usuario ya existe.' }
  }

  if (AUTH_MODE === 'api' && API_URL) {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, firstName, lastName, username, birthDate, password }),
      })
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string } | null
        return { ok: false, error: data?.message ?? 'No se pudo crear la cuenta.' }
      }
      const data = (await response.json()) as {
        email: string
        username?: string
        firstName?: string
        lastName?: string
      }
      const session: AuthSession = {
        email: data.email,
        username: data.username ?? username,
        firstName: data.firstName ?? firstName,
        lastName: data.lastName ?? lastName,
        loggedInAt: new Date().toISOString(),
        remember: true,
      }
      saveSession(session, true)
      return { ok: true, session }
    } catch {
      return { ok: false, error: 'No se pudo conectar con el servidor.' }
    }
  }

  users.push({ email, username, password, firstName, lastName, birthDate })
  writeUsers(users)

  const session: AuthSession = {
    email,
    username,
    firstName,
    lastName,
    loggedInAt: new Date().toISOString(),
    remember: true,
  }
  saveSession(session, true)
  return { ok: true, session }
}
