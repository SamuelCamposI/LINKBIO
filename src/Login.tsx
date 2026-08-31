/**
 * Login.tsx
 * ---------------
 * Pantalla de auth completa (mismo layout visual en todos los modos):
 * - Login
 * - Registro (2 pasos: datos + seguridad)
 * - Olvidé mi contraseña (correo → código OTP → nueva pass)
 *
 * Demo: samuel@gmail.com / 1234
 *
 * Notas:
 * - Fecha de nacimiento con dropdowns custom (el <select> nativo se ve feo)
 * - Errores/éxitos temporales con FlashAlert
 * - Configuré correo, pass y “Recordar sesión” precargados pa' la demo
 *   (así el compañero no anda adivinando credenciales)
 */
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
// Mockup real de iPhone (frame oficial). Solo uso el Silver en /public/mockify
import { DeviceMockup, iPhone17Pro } from '@mockifydev/react'
import { ArrowLeft, ArrowUpRight, AtSign, BarChart3, Check, ChevronDown, Eye, EyeOff, Link2, Lock, Mail, MousePointerClick, ShieldCheck, Sparkles, UserRound, X } from 'lucide-react'
import {
  FaFacebook,
  FaInstagram,
  FaSpotify,
  FaTiktok,
  FaYoutube,
} from 'react-icons/fa6'
import { useEffect, useRef, useState, memo, type FormEvent, type KeyboardEvent as ReactKeyboardEvent, type ClipboardEvent as ReactClipboardEvent } from 'react'
import {
  clearPasswordReset,
  completePasswordReset,
  getCurrentDemoPassword,
  login,
  register,
  requestPasswordReset,
  setRememberPreference,
  verifyPasswordResetCode,
} from './auth'
import {
  evaluatePassword,
  getAgeFromBirthDate,
  isValidEmail,
  isValidPersonName,
  isValidUsername,
  MIN_REGISTER_AGE,
  PASSWORD_RULES,
  type PasswordStrength,
} from './passwordStrength'

// Mismos datos del .env para simular que "ya hay DB" cuando recuerda sesión
const DEMO_EMAIL = (import.meta.env.VITE_DEMO_EMAIL as string | undefined) ?? 'samuel@gmail.com'

type AuthMode = 'login' | 'register' | 'forgot'

type LoginProps = {
  // Cuando sale bien el login/registro, le aviso a App para mostrar el dashboard
  onSuccess: () => void
}

// Clase repetida de los inputs (para no copiar/pegar 20 veces)
const inputClass =
  'login-input h-[var(--login-input-h)] w-full cursor-text rounded-xl border border-white/10 bg-plum/70 py-2 pl-11 pr-4 text-sm outline-none transition placeholder:text-white/25 focus:border-neon'

// Meses completos (nada de Ene/Feb)
const BIRTH_MONTHS = [
  { value: '1', label: 'Enero' },
  { value: '2', label: 'Febrero' },
  { value: '3', label: 'Marzo' },
  { value: '4', label: 'Abril' },
  { value: '5', label: 'Mayo' },
  { value: '6', label: 'Junio' },
  { value: '7', label: 'Julio' },
  { value: '8', label: 'Agosto' },
  { value: '9', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
] as const

type BirthField = 'day' | 'month' | 'year'

/** Años desde (hoy - 13) hasta (hoy - 100) */
function getBirthYearOptions() {
  const current = new Date().getFullYear()
  const maxYear = current - MIN_REGISTER_AGE
  const minYear = current - 100
  const years: number[] = []
  for (let year = maxYear; year >= minYear; year -= 1) years.push(year)
  return years
}

/** Cuántos días tiene el mes (ojo con febrero / años bisiestos) */
function daysInMonth(month: string, year: string) {
  const m = Number(month)
  const y = Number(year)
  if (!m) return 31
  if (!y) return new Date(2024, m, 0).getDate()
  return new Date(y, m, 0).getDate()
}

/** Dropdown custom del proyecto (no uso <select> nativo) */
function BirthPickerSelect({
  label,
  value,
  display,
  options,
  open,
  onOpen,
  onClose,
  onChange,
}: {
  label: string
  value: string
  display: string
  options: { value: string; label: string }[]
  open: boolean
  onOpen: () => void
  onClose: () => void
  onChange: (value: string) => void
}) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) onClose()
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  return (
    <div ref={rootRef} className="relative min-w-0">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => (open ? onClose() : onOpen())}
        className={`relative flex w-full items-center justify-center rounded-xl border bg-plum/70 px-7 text-center text-sm outline-none transition login-input h-[var(--login-input-h)] ${
          open ? 'border-neon' : 'border-white/10 hover:border-white/20'
        }`}
      >
        <span className={`truncate ${value ? 'text-white' : 'text-white/35'}`}>{display || label}</span>
        <ChevronDown
          className={`pointer-events-none absolute right-2.5 size-3.5 text-white/40 transition ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label={label}
          className="birth-picker-menu absolute left-0 right-0 z-30 mt-1.5 max-h-40 overflow-y-auto rounded-xl border border-white/12 bg-[#1a0f28] py-1 shadow-[0_12px_28px_-8px_rgba(0,0,0,0.65)]"
        >
          {options.map((option) => {
            const selected = option.value === value
            return (
              <li key={option.value} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option.value)
                    onClose()
                  }}
                  className={`flex w-full justify-center px-3 py-2 text-center text-sm transition ${
                    selected ? 'bg-neon/20 font-semibold text-white' : 'text-white/75 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {option.label}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/**
 * Alertitas temporales (error / éxito).
 * - Se van solas después de unos segundos
 * - Si pasas el mouse encima, pauso el timer para que puedas leer
 * - Tienen botón X por si quieres cerrarlas ya
 */
function FlashAlert({
  message,
  tone,
  onDismiss,
}: {
  message: string
  tone: 'error' | 'success'
  onDismiss: () => void
}) {
  const onDismissRef = useRef(onDismiss)
  onDismissRef.current = onDismiss
  const reduceMotion = useReducedMotion()
  const pausedRef = useRef(false)
  const remainingRef = useRef(0)
  const startedAtRef = useRef(0)
  const timerRef = useRef<number | null>(null)

  const durationMs =
    // Éxito un poco más corto; error escala según qué tan largo sea el texto
    tone === 'success' ? 3200 : Math.min(5500, Math.max(3500, message.length * 40))

  useEffect(() => {
    pausedRef.current = false
    remainingRef.current = durationMs
    startedAtRef.current = Date.now()

    const arm = (ms: number) => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => {
        if (!pausedRef.current) onDismissRef.current()
      }, ms)
    }

    arm(durationMs)
    return () => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current)
    }
  }, [message, tone, durationMs])

  const pause = () => {
    if (pausedRef.current) return
    pausedRef.current = true
    remainingRef.current = Math.max(0, remainingRef.current - (Date.now() - startedAtRef.current))
    if (timerRef.current != null) window.clearTimeout(timerRef.current)
  }

  const resume = () => {
    if (!pausedRef.current) return
    pausedRef.current = false
    startedAtRef.current = Date.now()
    const ms = Math.max(remainingRef.current, 1200)
    if (timerRef.current != null) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      if (!pausedRef.current) onDismissRef.current()
    }, ms)
  }

  const styles =
    tone === 'success'
      ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200'
      : 'border-red-400/25 bg-red-400/10 text-red-200'

  return (
    <motion.div
      role={tone === 'error' ? 'alert' : 'status'}
      aria-live={tone === 'error' ? 'assertive' : 'polite'}
      initial={reduceMotion ? false : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
      transition={{ duration: reduceMotion ? 0.12 : 0.28, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
    >
      <div className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm ${styles}`}>
        <p className="min-w-0 flex-1 leading-relaxed">{message}</p>
        <button
          type="button"
          onClick={() => onDismissRef.current()}
          className="mt-0.5 shrink-0 cursor-pointer rounded-md p-0.5 text-current/70 transition hover:bg-white/10 hover:text-current"
          aria-label="Cerrar mensaje"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </motion.div>
  )
}

/**
 * Input de código OTP (6 cajitas).
 * Soporta pegar el código entero, backspace y flechas — como Stripe/Google.
 */
function OtpInput({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (next: string) => void
  disabled?: boolean
}) {
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? '')
  const refs = useRef<(HTMLInputElement | null)[]>([])

  const setDigit = (index: number, char: string) => {
    const next = digits.map((d, i) => (i === index ? char : d))
    onChange(next.join('').slice(0, 6))
  }

  const handleChange = (index: number, raw: string) => {
    const cleaned = raw.replace(/\D/g, '')
    if (!cleaned) {
      setDigit(index, '')
      return
    }
    if (cleaned.length > 1) {
      const merged = (value.slice(0, index) + cleaned).replace(/\D/g, '').slice(0, 6)
      onChange(merged)
      const focusAt = Math.min(merged.length, 5)
      refs.current[focusAt]?.focus()
      return
    }
    setDigit(index, cleaned)
    if (index < 5) refs.current[index + 1]?.focus()
  }

  const handleKeyDown = (index: number, event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus()
      setDigit(index - 1, '')
      event.preventDefault()
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      refs.current[index - 1]?.focus()
      event.preventDefault()
    }
    if (event.key === 'ArrowRight' && index < 5) {
      refs.current[index + 1]?.focus()
      event.preventDefault()
    }
  }

  const handlePaste = (event: ReactClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    onChange(pasted)
    refs.current[Math.min(pasted.length, 5)]?.focus()
  }

  return (
    <div className="flex justify-center gap-2" role="group" aria-label="Código de verificación">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(node) => {
            refs.current[index] = node
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={6}
          value={digit}
          disabled={disabled}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          onFocus={(event) => event.target.select()}
          aria-label={`Dígito ${index + 1}`}
          className="login-otp h-[var(--login-input-h)] w-10 rounded-xl border border-white/10 bg-plum/70 text-center text-lg font-bold text-white outline-none transition focus:border-neon sm:w-11"
        />
      ))}
    </div>
  )
}

export default function Login({ onSuccess }: LoginProps) {
  const [mode, setMode] = useState<AuthMode>('login')

  // --- Login state ---
  // Precargados pa' la demo del equipo (correo + pass + recordar)
  const [remember, setRemember] = useState(true)
  const [email, setEmail] = useState(DEMO_EMAIL)
  const [password, setPassword] = useState(() => getCurrentDemoPassword())
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // --- Register state (registro formal) ---
  const [regEmail, setRegEmail] = useState('')
  const [regFirstName, setRegFirstName] = useState('')
  const [regLastName, setRegLastName] = useState('')
  const [regUsername, setRegUsername] = useState('')
  const [regBirthDate, setRegBirthDate] = useState('')
  const [birthDay, setBirthDay] = useState('')
  const [birthMonth, setBirthMonth] = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirm, setRegConfirm] = useState('')
  const [regAcceptTerms, setRegAcceptTerms] = useState(false)
  const [showRegPassword, setShowRegPassword] = useState(false)
  const [showRegConfirm, setShowRegConfirm] = useState(false)
  const [regStep, setRegStep] = useState(1)
  const [openBirthField, setOpenBirthField] = useState<BirthField | null>(null)

  // --- Forgot password (email → OTP → nueva contraseña) ---
  const [forgotStep, setForgotStep] = useState(1)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotMasked, setForgotMasked] = useState('')
  const [forgotOtp, setForgotOtp] = useState('')
  const [forgotMockCode, setForgotMockCode] = useState<string | undefined>()
  const [forgotPassword, setForgotPassword] = useState('')
  const [forgotConfirm, setForgotConfirm] = useState('')
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [showForgotConfirm, setShowForgotConfirm] = useState(false)
  const [resendIn, setResendIn] = useState(0)
  // Mensaje verde tipo "contraseña actualizada" al volver al login
  const [loginNotice, setLoginNotice] = useState('')

  const passwordStrength = evaluatePassword(regPassword)
  const passwordsMatch = regConfirm.length > 0 && regPassword === regConfirm
  const forgotStrength = evaluatePassword(forgotPassword)
  const forgotMatch = forgotConfirm.length > 0 && forgotPassword === forgotConfirm
  // Labels del stepper de registro
  const registerSteps = [
    { id: 1, label: 'Datos' },
    { id: 2, label: 'Seguridad' },
  ] as const
  // Labels del stepper de "olvidé mi contraseña"
  const forgotSteps = [
    { id: 1, label: 'Correo' },
    { id: 2, label: 'Código' },
    { id: 3, label: 'Nueva' },
  ] as const

  // Countdown para el botón "Reenviar código"
  useEffect(() => {
    if (resendIn <= 0) return
    const timer = window.setTimeout(() => setResendIn((current) => current - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [resendIn])

  // Limpio todo el estado del flujo forgot
  const resetForgotState = () => {
    clearPasswordReset()
    setForgotStep(1)
    setForgotEmail('')
    setForgotMasked('')
    setForgotOtp('')
    setForgotMockCode(undefined)
    setForgotPassword('')
    setForgotConfirm('')
    setShowForgotPassword(false)
    setShowForgotConfirm(false)
    setResendIn(0)
  }

  const syncBirthDate = (day: string, month: string, year: string) => {
    // Junto día/mes/año en formato ISO para auth.ts
    if (day && month && year) {
      setRegBirthDate(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`)
    } else {
      setRegBirthDate('')
    }
  }

  const handleBirthDay = (value: string) => {
    setBirthDay(value)
    syncBirthDate(value, birthMonth, birthYear)
  }
  const handleBirthMonth = (value: string) => {
    setBirthMonth(value)
    const maxDay = daysInMonth(value, birthYear)
    const nextDay = birthDay && Number(birthDay) > maxDay ? String(maxDay) : birthDay
    if (nextDay !== birthDay) setBirthDay(nextDay)
    syncBirthDate(nextDay, value, birthYear)
  }
  const handleBirthYear = (value: string) => {
    setBirthYear(value)
    const maxDay = daysInMonth(birthMonth, value)
    const nextDay = birthDay && Number(birthDay) > maxDay ? String(maxDay) : birthDay
    if (nextDay !== birthDay) setBirthDay(nextDay)
    syncBirthDate(nextDay, birthMonth, value)
  }

  // Cambio entre login / registro / forgot y limpio errores
  const switchMode = (next: AuthMode) => {
    setMode(next)
    setError('')
    setLoading(false)
    setLoginNotice('')
    if (next === 'register') setRegStep(1)
    if (next === 'forgot') {
      resetForgotState()
      setForgotEmail(email.trim() || '')
    }
    if (next === 'login' && mode === 'forgot') {
      clearPasswordReset()
    }
  }

  const goRegisterStep = (step: number) => {
    setError('')
    setOpenBirthField(null)
    setRegStep(step)
  }

  // Valido cada paso del registro antes de dejar avanzar
  const validateRegisterStep = (step: number): string | null => {
    if (step === 1) {
      if (!regFirstName.trim() || !regLastName.trim() || !regBirthDate || !regEmail.trim() || !regUsername.trim()) {
        return 'Completa todos los campos de este paso.'
      }
      if (!isValidPersonName(regFirstName)) return 'Ingresa un nombre válido.'
      if (!isValidPersonName(regLastName)) return 'Ingresa un apellido válido.'
      const age = getAgeFromBirthDate(regBirthDate)
      if (age === null) return 'Ingresa una fecha de nacimiento válida.'
      if (age < MIN_REGISTER_AGE) return `Debes tener al menos ${MIN_REGISTER_AGE} años.`
      if (!isValidEmail(regEmail)) return 'Ingresa un correo válido.'
      if (!isValidUsername(regUsername)) return 'Usuario: 3–20 caracteres (letras, números, . o _).'
      return null
    }
    if (step === 2) {
      if (!regPassword || !regConfirm) return 'Completa y confirma tu contraseña.'
      if (!passwordStrength.isStrongEnough) return 'La contraseña aún no es lo bastante segura.'
      if (!passwordsMatch) return 'Las contraseñas no coinciden.'
      if (!regAcceptTerms) return 'Debes aceptar los Términos y la Privacidad.'
      return null
    }
    return null
  }

  const handleRegisterNext = () => {
    const stepError = validateRegisterStep(regStep)
    if (stepError) {
      setError(stepError)
      return
    }
    goRegisterStep(Math.min(2, regStep + 1))
  }

  const handleRegisterSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')

    if (regStep < 2) {
      handleRegisterNext()
      return
    }

    const stepError = validateRegisterStep(2)
    if (stepError) {
      setError(stepError)
      return
    }

    setLoading(true)
    try {
      const result = await register({
        email: regEmail,
        firstName: regFirstName,
        lastName: regLastName,
        username: regUsername,
        birthDate: regBirthDate,
        password: regPassword,
        confirmPassword: regConfirm,
        acceptTerms: regAcceptTerms,
      })
      if (result.ok) {
        onSuccess()
        return
      }
      setError(result.error)
    } finally {
      setLoading(false)
    }
  }

  const handleRememberChange = (checked: boolean) => {
    setRemember(checked)
    setRememberPreference(checked)
    // No limpio correo/pass al apagar el toggle — en demo conviene que se vean igual
  }

  const handleLoginSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setLoginNotice('')
    setLoading(true)
    try {
      const result = await login(email, password, remember)
      if (result.ok) {
        onSuccess()
        return
      }
      setError(result.error)
    } finally {
      setLoading(false)
    }
  }

  const handleForgotRequest = async (event: FormEvent) => {
    // Paso 1 forgot: pedir el código al correo
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await requestPasswordReset(forgotEmail)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setForgotMasked(result.maskedEmail)
      setForgotMockCode(result.mockCode) // en mock lo muestro en pantalla
      setForgotOtp('')
      setResendIn(result.cooldownSec)
      setForgotStep(2)
    } finally {
      setLoading(false)
    }
  }

  const handleForgotResend = async () => {
    if (resendIn > 0 || loading) return
    setError('')
    setLoading(true)
    try {
      const result = await requestPasswordReset(forgotEmail)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setForgotMasked(result.maskedEmail)
      setForgotMockCode(result.mockCode)
      setForgotOtp('')
      setResendIn(result.cooldownSec)
    } finally {
      setLoading(false)
    }
  }

  const handleForgotVerify = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await verifyPasswordResetCode(forgotEmail, forgotOtp)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setForgotPassword('')
      setForgotConfirm('')
      setForgotStep(3)
    } finally {
      setLoading(false)
    }
  }

  const handleForgotComplete = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    if (!forgotStrength.isStrongEnough) {
      setError('La contraseña aún no es lo bastante segura.')
      return
    }
    if (!forgotMatch) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setLoading(true)
    try {
      const result = await completePasswordReset(forgotEmail, forgotPassword, forgotConfirm)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setEmail(forgotEmail.trim().toLowerCase())
      setPassword('')
      resetForgotState()
      setMode('login')
      setLoginNotice('Contraseña actualizada. Ya puedes iniciar sesión.')
    } finally {
      setLoading(false)
    }
  }

  const authTitle =
    mode === 'login'
      ? 'Iniciar sesión'
      : mode === 'register'
        ? 'Crear cuenta'
        : forgotStep === 1
          ? '¿Olvidaste tu contraseña?'
          : forgotStep === 2
            ? 'Verifica tu correo'
            : 'Nueva contraseña'

  const authSubtitle =
    mode === 'login'
      ? 'Accede a tu panel de creador'
      : mode === 'register'
        ? 'Regístrate para publicar tu link en bio'
        : forgotStep === 1
          ? 'Te enviaremos un código de 6 dígitos'
          : forgotStep === 2
            ? `Enviado a ${forgotMasked || 'tu correo'}`
            : 'Elige una contraseña segura para tu cuenta'

  return (
    // login-screen = pantalla completa sin scroll (ver index.css)
    <div className="login-screen relative h-dvh w-dvw overflow-hidden bg-midnight text-white">
      {/* En desktop: 2 columnas. En móvil solo se ve el form */}
      <div className="relative z-10 grid h-full w-full lg:grid-cols-[minmax(0,1fr)_minmax(30rem,40rem)]">
        {/* ===== COLUMNA IZQUIERDA: marca + iPhone + texto (espaciado adaptativo) ===== */}
        <section className="login-visual relative hidden h-full overflow-hidden lg:flex lg:flex-col lg:px-[clamp(1.25rem,3vw,3.5rem)] lg:py-[clamp(1rem,2.2vh,2.75rem)]">
          <LoginBackground />
          <div className="relative z-10 flex shrink-0 items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-neon text-white shadow-[0_0_24px_-8px_rgba(236,72,153,0.9)]">
              <Link2 className="size-5" />
            </span>
            <span className="font-display text-lg font-extrabold tracking-tight">
              Link<span className="text-amber">Bio</span>
            </span>
          </div>

          <div className="login-visual-stage relative z-10 flex min-h-0 flex-1 items-center justify-center">
            <LoginShowcaseMemo />
          </div>

          <div className="login-hero-copy relative z-10 max-w-xl shrink-0">
            <h2 className="font-display font-extrabold leading-[1.12] tracking-tight">
              <span className="block">Todos tus enlaces.</span>
              <span className="mt-1 block text-amber">Un solo lugar.</span>
            </h2>
            <p className="login-hero-sub mt-3 max-w-md text-white/45">
              Crea tu página, personaliza tu estilo y comparte todo tu contenido con un link.
            </p>
          </div>
        </section>

        {/* ===== COLUMNA DERECHA: login o registro ===== */}
        <section className="login-panel relative flex h-full items-center justify-center border-white/10 px-6 sm:px-10 lg:border-l lg:bg-void/55 lg:px-12 xl:px-16">
          <div className="absolute inset-0 lg:hidden">
            <LoginBackground />
          </div>

          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="login-auth relative z-10 w-full max-w-md"
          >
            <div className="login-auth-header flex flex-col items-center text-center lg:items-start lg:text-left">
              <div className="login-auth-brand flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl bg-neon text-white shadow-[0_0_24px_-8px_rgba(236,72,153,0.9)]">
                  <Link2 className="size-5" />
                </span>
                <span className="font-display text-xl font-extrabold tracking-tight">
                  Link<span className="text-amber">Bio</span>
                </span>
              </div>
              <h1 className="login-auth-title font-display font-extrabold tracking-tight">
                {authTitle}
              </h1>
              <p className="login-auth-sub text-white/45">
                {authSubtitle}
              </p>
            </div>

            {mode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="login-form" noValidate>
                <AnimatePresence mode="popLayout">
                  {loginNotice ? (
                    <FlashAlert
                      key={`notice-${loginNotice}`}
                      message={loginNotice}
                      tone="success"
                      onDismiss={() => setLoginNotice('')}
                    />
                  ) : null}
                </AnimatePresence>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-white/70">Correo</span>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/35" />
                    <input
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="tu@email.com"
                      className={inputClass}
                    />
                  </div>
                </label>

                <div>
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-white/70">Contraseña</span>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/35" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="••••••••"
                        className={`${inputClass} pr-11`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-white/40 transition hover:text-white"
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </label>
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="cursor-pointer text-sm font-semibold text-neon-soft transition hover:text-neon"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-0.5">
                  <p className="text-sm font-semibold text-white/75">Recordar sesión</p>
                  <div className="toggle">
                    <input
                      id="toggle-switch"
                      type="checkbox"
                      checked={remember}
                      onChange={(event) => handleRememberChange(event.target.checked)}
                      aria-label="Recordar sesión"
                    />
                    <label htmlFor="toggle-switch" />
                  </div>
                </div>

                <AnimatePresence mode="popLayout">
                  {error ? (
                    <FlashAlert key={`login-err-${error}`} message={error} tone="error" onDismiss={() => setError('')} />
                  ) : null}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={loading}
                  className="login-btn mt-1 w-full cursor-pointer rounded-xl bg-neon text-sm font-extrabold text-white transition hover:bg-neon-soft disabled:cursor-wait disabled:opacity-70"
                >
                  {loading ? 'Entrando…' : 'Entrar'}
                </button>
              </form>
            ) : mode === 'register' ? (
              <form onSubmit={handleRegisterSubmit} className="login-form" noValidate>
                {/* Pasos: línea entre círculos (sin atravesarlos) */}
                <div className="login-auth-stepper flex justify-center">
                  <div className="flex items-start">
                    {registerSteps.map((step, index) => {
                      const active = regStep === step.id
                      const done = regStep > step.id
                      return (
                        <div key={step.id} className="flex items-start">
                          {index > 0 && (
                            <span
                              className={`mt-4 h-px w-12 shrink-0 ${regStep > 1 ? 'bg-neon/70' : 'bg-white/15'}`}
                              aria-hidden
                            />
                          )}
                          <div className="flex w-[4.75rem] flex-col items-center gap-1.5">
                            <span
                              className={`flex size-8 items-center justify-center rounded-full text-xs font-extrabold transition ${
                                done
                                  ? 'bg-neon text-white'
                                  : active
                                    ? 'bg-amber text-ink'
                                    : 'bg-[#1a1228] text-white/40 ring-1 ring-white/15'
                              }`}
                            >
                              {done ? <Check className="size-3.5" /> : step.id}
                            </span>
                            <span
                              className={`text-center text-[10px] font-semibold uppercase tracking-wide ${
                                active || done ? 'text-white/75' : 'text-white/35'
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {regStep === 1 && (
                  <div className="login-stack">
                    <p className="login-auth-intro text-sm text-white/45">Tus datos y tu cuenta pública</p>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <label className="block">
                        <span className="login-label mb-[var(--login-label-mb)] block text-sm font-semibold text-white/70">Nombre</span>
                        <div className="relative">
                          <UserRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/35" />
                          <input
                            type="text"
                            autoComplete="given-name"
                            value={regFirstName}
                            onChange={(event) => setRegFirstName(event.target.value)}
                            placeholder="Nombre"
                            className={inputClass}
                          />
                        </div>
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block text-sm font-semibold text-white/70">Apellido</span>
                        <div className="relative">
                          <UserRound className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/35" />
                          <input
                            type="text"
                            autoComplete="family-name"
                            value={regLastName}
                            onChange={(event) => setRegLastName(event.target.value)}
                            placeholder="Apellido"
                            className={inputClass}
                          />
                        </div>
                      </label>
                    </div>
                    <div>
                      <span className="mb-1.5 block text-sm font-semibold text-white/70">Fecha de nacimiento</span>
                      <div className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.35fr)_minmax(0,1fr)] gap-2">
                        <BirthPickerSelect
                          label="Día"
                          value={birthDay}
                          display={birthDay}
                          open={openBirthField === 'day'}
                          onOpen={() => setOpenBirthField('day')}
                          onClose={() => setOpenBirthField(null)}
                          onChange={handleBirthDay}
                          options={Array.from(
                            { length: daysInMonth(birthMonth, birthYear) },
                            (_, i) => ({ value: String(i + 1), label: String(i + 1) }),
                          )}
                        />
                        <BirthPickerSelect
                          label="Mes"
                          value={birthMonth}
                          display={BIRTH_MONTHS.find((m) => m.value === birthMonth)?.label ?? ''}
                          open={openBirthField === 'month'}
                          onOpen={() => setOpenBirthField('month')}
                          onClose={() => setOpenBirthField(null)}
                          onChange={handleBirthMonth}
                          options={BIRTH_MONTHS.map((month) => ({ value: month.value, label: month.label }))}
                        />
                        <BirthPickerSelect
                          label="Año"
                          value={birthYear}
                          display={birthYear}
                          open={openBirthField === 'year'}
                          onOpen={() => setOpenBirthField('year')}
                          onClose={() => setOpenBirthField(null)}
                          onChange={handleBirthYear}
                          options={getBirthYearOptions().map((year) => ({
                            value: String(year),
                            label: String(year),
                          }))}
                        />
                      </div>
                      <p className="login-auth-hint mt-1 text-[11px] text-white/35">Debes tener al menos {MIN_REGISTER_AGE} años</p>
                    </div>
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-white/70">Correo</span>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/35" />
                        <input
                          type="email"
                          name="reg-email"
                          autoComplete="email"
                          value={regEmail}
                          onChange={(event) => setRegEmail(event.target.value)}
                          placeholder="tu@email.com"
                          className={inputClass}
                        />
                      </div>
                    </label>
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-white/70">Nombre de usuario</span>
                      <div className="relative">
                        <AtSign className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/35" />
                        <input
                          type="text"
                          name="reg-handle"
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="none"
                          spellCheck={false}
                          value={regUsername}
                          onChange={(event) => setRegUsername(event.target.value)}
                          placeholder="tu.usuario"
                          className={inputClass}
                        />
                      </div>
                      <p className="login-auth-hint mt-1 text-[11px] text-white/35">Será tu link público: linkbio.com/tu.usuario</p>
                    </label>
                  </div>
                )}

                {regStep === 2 && (
                  <div className="login-stack">
                    <p className="text-sm text-white/45">Protege tu cuenta</p>
                    <div>
                      <label className="block">
                        <span className="mb-1.5 block text-sm font-semibold text-white/70">Contraseña</span>
                        <div className="relative">
                          <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/35" />
                          <input
                            type={showRegPassword ? 'text' : 'password'}
                            autoComplete="new-password"
                            value={regPassword}
                            onChange={(event) => setRegPassword(event.target.value)}
                            placeholder="••••••••"
                            className={`${inputClass} pr-11`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowRegPassword((current) => !current)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-white/40 transition hover:text-white"
                            aria-label={showRegPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                          >
                            {showRegPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </button>
                        </div>
                      </label>
                      <PasswordStrengthMeter strength={passwordStrength} password={regPassword} />
                    </div>
                    <div>
                      <label className="block">
                        <span className="mb-1.5 block text-sm font-semibold text-white/70">Confirmar contraseña</span>
                        <div className="relative">
                          <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/35" />
                          <input
                            type={showRegConfirm ? 'text' : 'password'}
                            autoComplete="new-password"
                            value={regConfirm}
                            onChange={(event) => setRegConfirm(event.target.value)}
                            placeholder="••••••••"
                            className={`${inputClass} pr-11`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowRegConfirm((current) => !current)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-white/40 transition hover:text-white"
                            aria-label={showRegConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                          >
                            {showRegConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </button>
                        </div>
                      </label>
                      {regConfirm.length > 0 && (
                        <p
                          className={`mt-1.5 text-xs font-semibold ${
                            passwordsMatch ? 'text-emerald-300' : 'text-red-300'
                          }`}
                        >
                          {passwordsMatch ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden'}
                        </p>
                      )}
                    </div>
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={regAcceptTerms}
                        onChange={(event) => setRegAcceptTerms(event.target.checked)}
                        className="mt-0.5 size-4 shrink-0 cursor-pointer rounded border-white/20 bg-plum accent-[var(--color-neon)]"
                      />
                      <span className="text-xs leading-relaxed text-white/55">
                        Acepto los{' '}
                        <button type="button" className="font-semibold text-white/80 underline decoration-white/25 underline-offset-2">
                          Términos
                        </button>{' '}
                        y la{' '}
                        <button type="button" className="font-semibold text-white/80 underline decoration-white/25 underline-offset-2">
                          Privacidad
                        </button>
                        .
                      </span>
                    </label>
                  </div>
                )}

                <AnimatePresence mode="popLayout">
                  {error ? (
                    <FlashAlert key={`reg-err-${error}`} message={error} tone="error" onDismiss={() => setError('')} />
                  ) : null}
                </AnimatePresence>

                <div className="flex gap-3 pt-1">
                  {regStep > 1 && (
                    <button
                      type="button"
                      onClick={() => goRegisterStep(regStep - 1)}
                      className="login-btn flex-1 cursor-pointer rounded-xl border border-white/15 bg-white/5 text-sm font-bold text-white/80 transition hover:bg-white/10"
                    >
                      Atrás
                    </button>
                  )}
                  {regStep < 2 ? (
                    <button
                      type="submit"
                      className="login-btn w-full cursor-pointer rounded-xl bg-neon text-sm font-extrabold text-white transition hover:bg-neon-soft"
                    >
                      Continuar
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={loading}
                      className="login-btn flex-1 cursor-pointer rounded-xl bg-neon text-sm font-extrabold text-white transition hover:bg-neon-soft disabled:cursor-wait disabled:opacity-70"
                    >
                      {loading ? 'Creando cuenta…' : 'Crear cuenta'}
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <form
                onSubmit={
                  forgotStep === 1
                    ? handleForgotRequest
                    : forgotStep === 2
                      ? handleForgotVerify
                      : handleForgotComplete
                }
                className="login-form"
                noValidate
              >
                <div className="login-auth-stepper flex justify-center">
                  <div className="flex items-start">
                    {forgotSteps.map((step, index) => {
                      const active = forgotStep === step.id
                      const done = forgotStep > step.id
                      return (
                        <div key={step.id} className="flex items-start">
                          {index > 0 && (
                            <span
                              className={`mt-4 h-px w-8 shrink-0 sm:w-10 ${
                                forgotStep > index ? 'bg-neon/70' : 'bg-white/15'
                              }`}
                              aria-hidden
                            />
                          )}
                          <div className="flex w-[3.75rem] flex-col items-center gap-1.5 sm:w-16">
                            <span
                              className={`flex size-8 items-center justify-center rounded-full text-xs font-extrabold transition ${
                                done
                                  ? 'bg-neon text-white'
                                  : active
                                    ? 'bg-amber text-ink'
                                    : 'bg-[#1a1228] text-white/40 ring-1 ring-white/15'
                              }`}
                            >
                              {done ? <Check className="size-3.5" /> : step.id}
                            </span>
                            <span
                              className={`text-center text-[10px] font-semibold uppercase tracking-wide ${
                                active || done ? 'text-white/75' : 'text-white/35'
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {forgotStep === 1 && (
                  <div className="login-stack">
                    <p className="text-sm text-white/45">
                      Ingresa el correo de tu cuenta.
                    </p>
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-white/70">Correo</span>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/35" />
                        <input
                          type="email"
                          autoComplete="email"
                          autoFocus
                          value={forgotEmail}
                          onChange={(event) => setForgotEmail(event.target.value)}
                          placeholder="tu@email.com"
                          className={inputClass}
                        />
                      </div>
                    </label>
                  </div>
                )}

                {forgotStep === 2 && (
                  <div className="login-stack">
                    <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
                      <ShieldCheck className="mt-0.5 size-4 shrink-0 text-neon-soft" />
                      <p className="text-sm leading-relaxed text-white/55">
                        Escribe el código de 6 dígitos. Caduca en 10 minutos.
                      </p>
                    </div>
                    <OtpInput value={forgotOtp} onChange={setForgotOtp} disabled={loading} />
                    {forgotMockCode && (
                      <p className="rounded-xl border border-amber/30 bg-amber/10 px-3 py-2 text-center text-xs text-amber">
                        Modo demo — tu código es{' '}
                        <span className="ml-1.5 inline-block font-extrabold tracking-[0.2em]">{forgotMockCode}</span>
                      </p>
                    )}
                    <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-white/45">
                      <span>¿No llegó?</span>
                      <button
                        type="button"
                        disabled={resendIn > 0 || loading}
                        onClick={handleForgotResend}
                        className="font-bold text-amber transition hover:text-amber-hot disabled:cursor-not-allowed disabled:text-white/30"
                      >
                        {resendIn > 0 ? `Reenviar en ${resendIn}s` : 'Reenviar código'}
                      </button>
                    </div>
                  </div>
                )}

                {forgotStep === 3 && (
                  <div className="login-stack">
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-white/70">Nueva contraseña</span>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/35" />
                        <input
                          type={showForgotPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          value={forgotPassword}
                          onChange={(event) => setForgotPassword(event.target.value)}
                          placeholder="••••••••"
                          className={`${inputClass} pr-11`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword((current) => !current)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-white/40 transition hover:text-white"
                          aria-label={showForgotPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        >
                          {showForgotPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        </button>
                      </div>
                    </label>
                    <PasswordStrengthMeter strength={forgotStrength} password={forgotPassword} />
                    <div>
                      <label className="block">
                        <span className="mb-1.5 block text-sm font-semibold text-white/70">Confirmar contraseña</span>
                        <div className="relative">
                          <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/35" />
                          <input
                            type={showForgotConfirm ? 'text' : 'password'}
                            autoComplete="new-password"
                            value={forgotConfirm}
                            onChange={(event) => setForgotConfirm(event.target.value)}
                            placeholder="••••••••"
                            className={`${inputClass} pr-11`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowForgotConfirm((current) => !current)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-white/40 transition hover:text-white"
                            aria-label={showForgotConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                          >
                            {showForgotConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </button>
                        </div>
                      </label>
                      {forgotConfirm.length > 0 && (
                        <p
                          className={`mt-1.5 text-xs font-semibold ${
                            forgotMatch ? 'text-emerald-300' : 'text-red-300'
                          }`}
                        >
                          {forgotMatch ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden'}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <AnimatePresence mode="popLayout">
                  {error ? (
                    <FlashAlert key={`forgot-err-${error}`} message={error} tone="error" onDismiss={() => setError('')} />
                  ) : null}
                </AnimatePresence>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setError('')
                      if (forgotStep === 1) {
                        switchMode('login')
                        return
                      }
                      if (forgotStep === 2) {
                        setForgotStep(1)
                        setForgotOtp('')
                        return
                      }
                      setForgotStep(2)
                      setForgotPassword('')
                      setForgotConfirm('')
                    }}
                    className="login-btn flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 text-sm font-bold text-white/80 transition hover:bg-white/10"
                  >
                    <ArrowLeft className="size-4" />
                    Atrás
                  </button>
                  <button
                    type="submit"
                    disabled={loading || (forgotStep === 2 && forgotOtp.length !== 6)}
                    className="login-btn flex-1 cursor-pointer rounded-xl bg-neon text-sm font-extrabold text-white transition hover:bg-neon-soft disabled:cursor-wait disabled:opacity-70"
                  >
                    {loading
                      ? forgotStep === 1
                        ? 'Enviando…'
                        : forgotStep === 2
                          ? 'Verificando…'
                          : 'Guardando…'
                      : forgotStep === 1
                        ? 'Enviar código'
                        : forgotStep === 2
                          ? 'Verificar'
                          : 'Guardar contraseña'}
                  </button>
                </div>
              </form>
            )}

            <div className="login-auth-footer">
              <div className="login-auth-divider flex items-center gap-3">
                <span className="h-px flex-1 bg-white/10" />
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/30">o</span>
                <span className="h-px flex-1 bg-white/10" />
              </div>

              <p className="login-auth-switch text-center text-sm text-white/50">
                {mode === 'forgot' ? (
                  <>
                    ¿La recordaste?
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      className="ml-2 cursor-pointer font-bold text-amber transition hover:text-amber-hot"
                    >
                      Inicia sesión
                    </button>
                  </>
                ) : (
                  <>
                    {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
                    <button
                      type="button"
                      onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                      className="ml-2 cursor-pointer font-bold text-amber transition hover:text-amber-hot"
                    >
                      {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
                    </button>
                  </>
                )}
              </p>

              <p className="login-auth-legal text-center text-[11px] leading-relaxed text-white/30">
                Al continuar, aceptas los{' '}
                <button type="button" className="cursor-pointer underline decoration-white/25 underline-offset-2 transition hover:text-white/50">
                  Términos
                </button>{' '}
                y la{' '}
                <button type="button" className="cursor-pointer underline decoration-white/25 underline-offset-2 transition hover:text-white/50">
                  Privacidad
                </button>
                .
              </p>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  )
}

function PasswordStrengthMeter({
  strength,
  password,
}: {
  strength: PasswordStrength
  password: string
}) {
  if (!password) return null

  const allDone = strength.score === strength.max

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="password-strength-track h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className={`password-strength-fill h-full rounded-full transition-all duration-200 ${
              strength.tone === 'weak'
                ? 'bg-red-400'
                : strength.tone === 'fair'
                  ? 'bg-amber'
                  : strength.tone === 'good'
                    ? 'bg-sky-400'
                    : 'bg-emerald-400'
            }`}
            style={{ width: `${strength.percent}%` }}
          />
        </div>
        <span
          className={`shrink-0 text-[11px] font-bold ${
            strength.tone === 'weak'
              ? 'text-red-300'
              : strength.tone === 'fair'
                ? 'text-amber'
                : strength.tone === 'good'
                  ? 'text-sky-300'
                  : 'text-emerald-300'
          }`}
        >
          {strength.label}
        </span>
      </div>
      {/* Checklist solo mientras falte algún requisito */}
      {!allDone && (
        <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
          {PASSWORD_RULES.map((rule) => {
            const ok = strength.checks[rule.id]
            return (
              <li key={rule.id} className={`flex items-center gap-1.5 text-[11px] ${ok ? 'text-emerald-300/90' : 'text-white/35'}`}>
                {ok ? <Check className="size-3 shrink-0" /> : <X className="size-3 shrink-0" />}
                {rule.label}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

// Redes que muestro DENTRO del iPhone (colores oficiales de cada marca)
const PREVIEW_LINKS = [
  { label: 'YouTube', Icon: FaYoutube, iconClass: 'bg-[#FF0000] text-white' },
  { label: 'TikTok', Icon: FaTiktok, iconClass: 'bg-black text-white ring-1 ring-[#25F4EE]/50' },
  {
    label: 'Instagram',
    Icon: FaInstagram,
    iconClass: 'bg-[linear-gradient(45deg,#f9ce34_0%,#ee2a7b_45%,#6228d7_100%)] text-white',
  },
  { label: 'Spotify', Icon: FaSpotify, iconClass: 'bg-[#1DB954] text-white' },
  { label: 'Facebook', Icon: FaFacebook, iconClass: 'bg-[#1877F2] text-white' },
] as const

const LOGIN_PHONE_ACCENT = '#ec4899'

/**
 * LoginShowcase
 * Preview del producto: iPhone de frente + tarjetas flotantes.
 * Frame PNG: public/mockify/devices/iPhone 17 Pro - Silver.png
 * login-float = animación suave (index.css)
 */
function LoginShowcase() {
  return (
    <div className="login-showcase relative h-full w-full max-w-[min(40rem,100%)]">
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="login-float login-float-a">
          {/* Escala según viewport (--login-phone-scale en index.css) */}
          <div className="login-iphone-scale">
            <div className="login-iphone-front">
            <div className="login-iphone-glow" aria-hidden />
            <DeviceMockup
              className="login-iphone-shadow"
              device={iPhone17Pro}
              color="Silver"
              width={250}
              basePath="/mockify"
              showStatusBar={false} // status bar la dibujo yo en blanco
              screenColor="#070014"
            >
              <div className="login-iphone-screen relative flex h-full min-h-full flex-col overflow-hidden px-3.5 pb-5 pt-1">
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_10%,#481064_0%,#18042d_40%,#070014_88%)]"
                />
                <div className="login-iphone-shine" aria-hidden />

                {/* Hora / señal / wifi / batería en blanco (la isla la trae el PNG) */}
                <div className="relative z-20 flex items-center justify-between px-1 pt-2 text-[9px] font-semibold text-white">
                  <span className="w-12 pl-1">9:41</span>
                  <span className="w-12" aria-hidden />
                  <span className="flex w-12 items-center justify-end gap-0.5 pr-0.5 text-white">
                    <svg width="12" height="8" viewBox="0 0 14 10" fill="currentColor" aria-hidden>
                      <rect x="0" y="6" width="2.2" height="4" rx="0.4" />
                      <rect x="3.2" y="4" width="2.2" height="6" rx="0.4" />
                      <rect x="6.4" y="2" width="2.2" height="8" rx="0.4" />
                      <rect x="9.6" y="0" width="2.2" height="10" rx="0.4" opacity="0.35" />
                    </svg>
                    <svg width="11" height="8" viewBox="0 0 13 10" fill="currentColor" aria-hidden>
                      <path d="M6.5 3.2c1.5 0 2.9.6 3.9 1.6l-1.1 1.1A3.7 3.7 0 0 0 6.5 4.7c-1 0-1.9.4-2.6 1.1L2.8 4.7A5.2 5.2 0 0 1 6.5 3.2Zm0-3.2c2.4 0 4.6 1 6.2 2.6L11.6 3.7A7.3 7.3 0 0 0 6.5 1.5 7.3 7.3 0 0 0 1.4 3.7L.3 2.6A9 9 0 0 1 6.5 0Zm0 6.4c.8 0 1.5.3 2 .9L6.5 10 4.5 7.3c.5-.6 1.2-.9 2-.9Z" />
                    </svg>
                    <span className="relative h-[7px] w-[14px] rounded-[2px] border border-white p-px">
                      <span className="block h-full w-[72%] rounded-[0.5px] bg-white" />
                      <span className="absolute -right-[2px] top-[1px] h-[3px] w-[1.5px] rounded-r-[1px] bg-white" />
                    </span>
                  </span>
                </div>

                {/* Contenido tipo perfil: avatar + bio + links */}
                <div className="relative z-10 mt-9 flex flex-col items-center text-center">
                  <div
                    className="rounded-full p-[2.5px]"
                    style={{ background: LOGIN_PHONE_ACCENT }}
                  >
                    <img
                      src="/avatar.png"
                      alt=""
                      className="block size-12 rounded-full object-cover"
                      draggable={false}
                    />
                  </div>
                  <h3
                    className="mt-3.5 font-display text-[0.95rem] font-extrabold tracking-tight"
                    style={{ color: LOGIN_PHONE_ACCENT }}
                  >
                    Tu página
                  </h3>
                  <p className="mt-1.5 max-w-[11rem] text-[10px] font-medium leading-snug text-white/55">
                    Contenido, ritmo y vibes diarias
                  </p>

                  <div className="mt-4 flex w-full flex-col gap-2">
                    {PREVIEW_LINKS.map(({ label, Icon, iconClass }) => (
                      <div
                        key={label}
                        className="flex min-h-[2.35rem] items-center gap-2 rounded-xl border border-white/15 bg-plum/70 px-2.5 backdrop-blur-md"
                      >
                        <span
                          className={`flex size-6 shrink-0 items-center justify-center rounded-md shadow-sm ${iconClass}`}
                        >
                          <Icon className="size-3" />
                        </span>
                        <span className="flex-1 text-left text-[10px] font-extrabold tracking-wide">{label}</span>
                        <ArrowUpRight className="size-3 shrink-0" style={{ color: LOGIN_PHONE_ACCENT }} strokeWidth={2.5} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </DeviceMockup>
            </div>
          </div>
        </div>
      </div>

      {/* Cards: float + sombra solo debajo */}
      <div className="login-float login-float-b login-chip absolute left-[4%] top-[18%] flex items-center gap-3 rounded-2xl border border-white/10 bg-plum px-3.5 py-2.5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-sky-400/15 text-sky-300">
          <Eye className="size-3.5" />
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Visitas</p>
          <p className="font-display text-base font-extrabold">24.8k</p>
        </div>
      </div>

      <div className="login-float login-float-c login-chip absolute bottom-[22%] left-[2%] flex items-center gap-3 rounded-2xl border border-white/10 bg-plum px-3.5 py-2.5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-amber/15 text-amber">
          <MousePointerClick className="size-3.5" />
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Clicks</p>
          <p className="font-display text-base font-extrabold">8.4k</p>
        </div>
      </div>

      <div className="login-float login-float-d login-chip absolute right-[4%] top-[20%] flex items-center gap-3 rounded-2xl border border-white/10 bg-plum px-3.5 py-2.5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-neon/15 text-neon-soft">
          <BarChart3 className="size-3.5" />
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">Alcance</p>
          <p className="font-display text-base font-extrabold">+18%</p>
        </div>
      </div>

      <div className="login-float login-float-e login-chip absolute bottom-[24%] right-[2%] flex items-center gap-2 rounded-2xl border border-amber/25 bg-amber/15 px-3.5 py-2.5 text-xs font-bold text-amber">
        <Sparkles className="size-3.5" />
        Listo para compartir
      </div>
    </div>
  )
}

// memo: el form no re-pinta el iPhone al escribir o al mover el toggle
const LoginShowcaseMemo = memo(LoginShowcase)

// Fondo estático (sin orbes animados: menos carga GPU)
function LoginBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_35%_25%,#3b0764_0%,#0d0221_48%,#070014_82%)]" />
      <div className="absolute -left-10 top-20 size-56 rounded-full bg-neon/15 blur-2xl" />
      <div className="absolute right-10 top-[40%] size-44 rounded-full bg-amber/8 blur-2xl" />
    </div>
  )
}
