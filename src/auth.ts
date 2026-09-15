/**
 * auth.ts
 * ---------------
 * Autenticación con Supabase
 * - Login con email/password
 * - Registro con datos adicionales
 * - Recuperar contraseña con email
 * - Gestión de sesiones
 */

import { supabase } from './utils/supabase'
import {
  evaluatePassword,
  getAgeFromBirthDate,
  isValidEmail,
  isValidPersonName,
  MIN_REGISTER_AGE,
} from './passwordStrength'

// Keys para localStorage
const AUTH_STORAGE_KEY = 'linkbio-auth-session'
const REMEMBER_KEY = 'linkbio-auth-remember'

// Tiempos para reset de contraseña
const RESEND_COOLDOWN_SEC = 45

// Tipos de datos
export type AuthSession = {
  email: string
  username?: string
  firstName?: string
  lastName?: string
  loggedInAt: string
  remember: boolean
}

export type LoginResult = { ok: true } | { ok: false; error: string }

export type RegisterResult = { ok: true } | { ok: false; error: string }

export type ResetRequestResult =
  | { ok: true; maskedEmail: string; cooldownSec: number }
  | { ok: false; error: string }

export type ResetVerifyResult = { ok: true } | { ok: false; error: string }

// ============================================================================
// FUNCIONES AUXILIARES
// ============================================================================

/** Enmascara el correo tipo sa***@gmail.com */
export function maskEmail(email: string): string {
  const normalized = email.trim().toLowerCase()
  const [local, domain] = normalized.split('@')
  if (!local || !domain) return normalized
  const visible = local.slice(0, Math.min(2, local.length))
  return `${visible}${'*'.repeat(Math.max(3, local.length - visible.length))}@${domain}`
}

/** Genera username desde nombre y apellido */
function generateUsername(firstName: string, lastName: string): string {
  const base = `${firstName.toLowerCase()}-${lastName.toLowerCase()}`
    .replace(/[^a-z0-9-]/g, '')
    .substring(0, 20)
  return base
}

/** Guardar sesión en localStorage o sessionStorage */
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

/** Leer sesión desde storage */
function readStore(store: Storage): AuthSession | null {
  try {
    const raw = store.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthSession
  } catch {
    return null
  }
}

// ============================================================================
// GESTIÓN DE SESIÓN
// ============================================================================

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

export function logout() {
  // Limpiar sesión en Supabase
  supabase.auth.signOut().catch(console.error)

  // Limpiar datos locales
  localStorage.removeItem(AUTH_STORAGE_KEY)
  sessionStorage.removeItem(AUTH_STORAGE_KEY)
}

// ============================================================================
// LOGIN
// ============================================================================

export async function login(
  email: string,
  password: string,
  remember: boolean = true
): Promise<LoginResult> {
  // Validar email
  const normalized = email.trim().toLowerCase()
  if (!normalized) return { ok: false, error: 'Ingresa tu correo.' }
  if (!isValidEmail(normalized)) {
    return { ok: false, error: 'Ingresa un correo válido.' }
  }

  // Validar password
  if (!password) return { ok: false, error: 'Ingresa tu contraseña.' }

  // Autenticar con Supabase
  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalized,
    password,
  })

  if (error) {
    console.error('Login error:', error)
    if (error.message.includes('Invalid login credentials')) {
      return { ok: false, error: 'Credenciales inválidas.' }
    }
    return { ok: false, error: error.message }
  }

  if (!data.user) {
    return { ok: false, error: 'Error en el login. Intenta de nuevo.' }
  }

  // Guardar sesión localmente
  saveSession(
    {
      email: data.user.email || normalized,
      username: data.user.user_metadata?.username,
      firstName: data.user.user_metadata?.firstName,
      lastName: data.user.user_metadata?.lastName,
      loggedInAt: new Date().toISOString(),
      remember,
    },
    remember
  )

  return { ok: true }
}

// ============================================================================
// REGISTRO
// ============================================================================

export async function register(
  email: string,
  password: string,
  confirmPassword: string,
  firstName: string,
  lastName: string,
  birthDate: string,
  remember: boolean = true
): Promise<RegisterResult> {
  // Validar email
  const normalized = email.trim().toLowerCase()
  if (!normalized) return { ok: false, error: 'Ingresa tu correo.' }
  if (!isValidEmail(normalized)) {
    return { ok: false, error: 'Ingresa un correo válido.' }
  }

  // Validar nombre
  if (!isValidPersonName(firstName)) {
    return { ok: false, error: 'Ingresa tu nombre.' }
  }

  // Validar apellido
  if (!isValidPersonName(lastName)) {
    return { ok: false, error: 'Ingresa tu apellido.' }
  }

  // Validar edad
  const age = getAgeFromBirthDate(birthDate)
  if (age === null || age < MIN_REGISTER_AGE) {
    return {
      ok: false,
      error: `Debes tener al menos ${MIN_REGISTER_AGE} años.`,
    }
  }

  // Validar contraseña
  if (!password || !confirmPassword) {
    return { ok: false, error: 'Completa y confirma tu contraseña.' }
  }
  if (password !== confirmPassword) {
    return { ok: false, error: 'Las contraseñas no coinciden.' }
  }

  const strength = evaluatePassword(password)
  if (!strength.isStrongEnough) {
    return { ok: false, error: 'La contraseña aún no es lo bastante segura.' }
  }

  // Generar username
  const username = generateUsername(firstName, lastName)

  // Registrar en Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email: normalized,
    password,
    options: {
      data: {
        firstName,
        lastName,
        birthDate,
        username,
      },
    },
  })

  if (error) {
    console.error('Register error:', error)
    if (error.message.includes('already registered')) {
      return { ok: false, error: 'Este correo ya tiene una cuenta.' }
    }
    if (error.message.includes('User already exists')) {
      return { ok: false, error: 'Este correo ya está registrado.' }
    }
    return { ok: false, error: error.message }
  }

  if (!data.user) {
    return { ok: false, error: 'Error en el registro. Intenta de nuevo.' }
  }

  // Guardar sesión
  saveSession(
    {
      email: data.user.email || normalized,
      username,
      firstName,
      lastName,
      loggedInAt: new Date().toISOString(),
      remember,
    },
    remember
  )

  return { ok: true }
}

// ============================================================================
// RECUPERAR CONTRASEÑA
// ============================================================================

export async function requestPasswordReset(
  email: string
): Promise<ResetRequestResult> {
  const normalized = email.trim().toLowerCase()
  if (!normalized) return { ok: false, error: 'Ingresa tu correo.' }
  if (!isValidEmail(normalized)) {
    return { ok: false, error: 'Ingresa un correo válido.' }
  }

  // Solicitar reset a Supabase
  const { error } = await supabase.auth.resetPasswordForEmail(normalized)

  // Siempre responder ok (seguridad: no revelar si existe la cuenta)
  const maskedEmail = maskEmail(normalized)

  if (error) {
    console.error('Reset request error:', error)
    // Aún así responder ok para no revelar si existe
  }

  return {
    ok: true,
    maskedEmail,
    cooldownSec: RESEND_COOLDOWN_SEC,
  }
}

export async function completePasswordReset(
  password: string,
  confirmPassword: string
): Promise<ResetVerifyResult> {
  if (!password || !confirmPassword) {
    return { ok: false, error: 'Completa y confirma tu contraseña.' }
  }

  if (password !== confirmPassword) {
    return { ok: false, error: 'Las contraseñas no coinciden.' }
  }

  const strength = evaluatePassword(password)
  if (!strength.isStrongEnough) {
    return { ok: false, error: 'La contraseña aún no es lo bastante segura.' }
  }

  // Cambiar contraseña en Supabase
  const { error } = await supabase.auth.updateUser({
    password,
  })

  if (error) {
    console.error('Reset complete error:', error)
    return { ok: false, error: error.message }
  }

  return { ok: true }
}

// ============================================================================
// VERIFICACIÓN DE ESTADO DE AUTH
// ============================================================================

export async function verifySession(): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.getSession()
    return !error && !!data.session
  } catch {
    return false
  }
}

export async function getCurrentUser() {
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user) return null
    return data.user
  } catch {
    return null
  }
}