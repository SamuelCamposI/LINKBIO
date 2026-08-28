/**
 * auth.ts
 * ---------------
 * Aquí manejo el login de la app.
 * Por ahora NO hay base de datos real (MongoDB Atlas viene después),
 * entonces uso un login "mock" con usuario de prueba del .env.
 *
 * Cómo probar que funciona:
 * - correo: samuel@gmail.com
 * - contraseña: 1234
 * Si coinciden, guardo la sesión y el dashboard se abre.
 */

// Claves que uso en el navegador para guardar la sesión
const AUTH_STORAGE_KEY = 'linkbio-auth-session'
const REMEMBER_KEY = 'linkbio-auth-remember'

// "mock" = login local de prueba | "api" = cuando ya exista backend
export const AUTH_MODE = (import.meta.env.VITE_AUTH_MODE as string | undefined) ?? 'mock'

// URL del API futuro (solo se usa si AUTH_MODE = api)
export const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? ''

// Credenciales de demo que salen del .env (así no las dejo hardcodeadas a lo loco)
const DEMO_EMAIL = (import.meta.env.VITE_DEMO_EMAIL as string | undefined) ?? 'samuel@gmail.com'
const DEMO_PASSWORD = (import.meta.env.VITE_DEMO_PASSWORD as string | undefined) ?? '1234'

// Lo que guardo cuando el usuario entra
export type AuthSession = {
  email: string
  loggedInAt: string
  remember: boolean
}

// Leo la sesión desde localStorage o sessionStorage
function readStore(store: Storage): AuthSession | null {
  try {
    const raw = store.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthSession
  } catch {
    // Si el JSON está roto, mejor devolver null y pedir login otra vez
    return null
  }
}

// Si el usuario activó "Recordar sesión" la última vez
export function getRememberPreference(): boolean {
  try {
    return localStorage.getItem(REMEMBER_KEY) === '1'
  } catch {
    return true
  }
}

// Guardo si quiere recordar o no (para la próxima vez que abra el login)
export function setRememberPreference(remember: boolean) {
  localStorage.setItem(REMEMBER_KEY, remember ? '1' : '0')
}

// Busco sesión primero en localStorage y si no, en sessionStorage
export function getSession(): AuthSession | null {
  return readStore(localStorage) ?? readStore(sessionStorage)
}

// Si hay sesión = está logueado
export function isAuthenticated(): boolean {
  return getSession() !== null
}

/**
 * Guardo la sesión según el toggle:
 * - remember = true  -> localStorage (queda aunque cierre el navegador)
 * - remember = false -> sessionStorage (se borra al cerrar la pestaña)
 */
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

// Cerrar sesión limpia los dos storages por si acaso
export function logout() {
  localStorage.removeItem(AUTH_STORAGE_KEY)
  sessionStorage.removeItem(AUTH_STORAGE_KEY)
}

export type LoginResult = { ok: true; session: AuthSession } | { ok: false; error: string }

/**
 * Función principal de login.
 * Hoy: compara con el usuario demo del .env.
 * Después: cuando ponga VITE_AUTH_MODE=api, pega al backend y ahí sí MongoDB Atlas.
 * OJO: MONGODB_URI NUNCA va con VITE_ porque se filtraría al navegador.
 */
export async function login(
  email: string,
  password: string,
  remember = true,
): Promise<LoginResult> {
  const normalizedEmail = email.trim().toLowerCase()

  if (!normalizedEmail || !password) {
    return { ok: false, error: 'Ingresa tu correo y contraseña.' }
  }

  // Camino futuro: API real + MongoDB
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

      const data = (await response.json()) as { email: string }
      const session: AuthSession = {
        email: data.email,
        loggedInAt: new Date().toISOString(),
        remember,
      }
      saveSession(session, remember)
      return { ok: true, session }
    } catch {
      return { ok: false, error: 'No se pudo conectar con el servidor.' }
    }
  }

  // Camino actual (mock): simulo un poquito de delay como si fuera red
  await new Promise((resolve) => setTimeout(resolve, 450))

  // Si el correo y password coinciden con el demo -> éxito
  if (normalizedEmail === DEMO_EMAIL.toLowerCase() && password === DEMO_PASSWORD) {
    const session: AuthSession = {
      email: normalizedEmail,
      loggedInAt: new Date().toISOString(),
      remember,
    }
    saveSession(session, remember)
    return { ok: true, session }
  }

  return { ok: false, error: 'Correo o contraseña incorrectos.' }
}
