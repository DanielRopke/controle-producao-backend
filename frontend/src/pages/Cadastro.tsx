import { useEffect, useMemo, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import logoCadastro from '../assets/LogoSetup1.png'
import { FundoAnimado } from '../components/FundoAnimado'

export default function Cadastro() {
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [matricula, setMatricula] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [usernameTouched, setUsernameTouched] = useState(false)
   const [emailError, setEmailError] = useState<string | null>(null)
  // cooldown de reenvio por e-mail (2 min)
  const COOLDOWN_MS = 2 * 60 * 1000
  const [firstSentAt, setFirstSentAt] = useState<number | null>(null)
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0)
  const passwordPattern = '(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{9,}'

  const policy = useMemo(() => ({
    length: password.length > 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  }), [password])

  // indicador composto (se necessário no futuro)
  // const strong = policy.length && policy.upper && policy.lower && policy.special
  type ConfirmStatus = 'idle' | 'typing' | 'match' | 'mismatch'
  const [confirmStatus, setConfirmStatus] = useState<ConfirmStatus>('idle')

  useEffect(() => {
    // Sem nada digitado: instrução em cinza
    if (!confirmPassword) {
      setConfirmStatus('idle')
      return
    }
    // Ao digitar: mostrar "Analizando" e aguardar 1s sem novas teclas
    setConfirmStatus('typing')
    const t = window.setTimeout(() => {
      setConfirmStatus(confirmPassword === password ? 'match' : 'mismatch')
    }, 1000)
    return () => window.clearTimeout(t)
  }, [confirmPassword, password])

  // Verifica automaticamente o e-mail quando há uid/token na URL
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const uid = params.get('uid')
    const token = params.get('token')
    if (!uid || !token) return
    ;(async () => {
      try {
        await api.verifyEmail(uid, token)
        toast.success('Conta verificada. Faça login.')
        navigate('/login', { replace: true })
      } catch {
        toast.error('Link de verificação inválido ou expirado.')
      }
    })()
  }, [location.search, navigate])

  // Define o título da página
  useEffect(() => {
    document.title = 'Novo Cadastro'
  }, [])

  // Carrega timestamp do primeiro envio para o e-mail atual (se existir)
  useEffect(() => {
    const key = email ? `register_firstSentAt:${email.trim().toLowerCase()}` : ''
    if (!key) { setFirstSentAt(null); setRemainingSeconds(0); return }
    const saved = localStorage.getItem(key)
    const ts = saved ? Number(saved) : NaN
    if (!Number.isNaN(ts)) {
      setFirstSentAt(ts)
      const diff = Date.now() - ts
      const remain = Math.max(0, Math.ceil((COOLDOWN_MS - diff) / 1000))
      setRemainingSeconds(remain)
    } else {
      setFirstSentAt(null)
      setRemainingSeconds(0)
    }
  }, [email, COOLDOWN_MS])

  // Atualiza contador a cada 1s quando em cooldown
  useEffect(() => {
    if (!firstSentAt) return
    const id = window.setInterval(() => {
      const diff = Date.now() - firstSentAt
      const remain = Math.max(0, Math.ceil((COOLDOWN_MS - diff) / 1000))
      setRemainingSeconds(remain)
      if (remain <= 0) {
        window.clearInterval(id)
      }
    }, 1000)
    return () => window.clearInterval(id)
  }, [firstSentAt, COOLDOWN_MS])

  const emailTrim = email.trim()
  const emailOk = useMemo(() => /@[gG][rR][uU][pP][oO][sS][eE][tT][uU][pP]\.com$/i.test(emailTrim), [emailTrim])
  const passwordOk = useMemo(() => password.length > 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[^A-Za-z0-9]/.test(password), [password])
  const confirmOk = confirmPassword === password
  const formValid = emailOk && username.trim().length > 0 && matricula.trim().length > 0 && passwordOk && confirmOk

  function saveFirstSentNow(currentEmail: string) {
    const key = `register_firstSentAt:${currentEmail.trim().toLowerCase()}`
    const now = Date.now()
    localStorage.setItem(key, String(now))
    setFirstSentAt(now)
    setRemainingSeconds(Math.ceil(COOLDOWN_MS / 1000))
  }

  function formatMMSS(totalSeconds: number) {
    const m = Math.floor(totalSeconds / 60)
    const s = totalSeconds % 60
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailTrim) {
      toast.error('Informe o e-mail empresarial')
      return
    }
    // Validar domínio corporativo específico: deve terminar com @gruposetup.com
    if (!emailOk) {
      toast.error('Email Inválido.')
      return
    }
    if (!matricula.trim()) {
      toast.error('Informe a matrícula')
      return
    }
    if (!username.trim()) {
      toast.error('Informe o usuário')
      return
    }
    if (!password) {
      toast.error('Informe a senha')
      return
    }
    // Regras: mais de 8 caracteres, com maiúsculas, minúsculas e caractere especial
    if (password.length <= 8) {
      toast.error('A senha deve ter mais de 8 caracteres')
      return
    }
    if (!/[A-Z]/.test(password)) {
      toast.error('A senha deve conter pelo menos uma letra maiúscula')
      return
    }
    if (!/[a-z]/.test(password)) {
      toast.error('A senha deve conter pelo menos uma letra minúscula')
      return
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      toast.error('A senha deve conter pelo menos um caractere especial')
      return
    }
    if (password !== confirmPassword) {
      toast.error('As senhas não conferem')
      return
    }

    ;(async () => {
      try {
        const isResend = !!firstSentAt
        let resp: { message?: string; debug_verify_link?: string } | undefined
        if (isResend) {
          // Se estamos no fluxo de reenvio, delegar a mensagem ao backend com flag do timer
          const elapsed = Date.now() - (firstSentAt || 0)
          const timerRunning = elapsed < COOLDOWN_MS
          resp = await api.resendConfirmation(emailTrim, timerRunning)
          // Se o timer já expirou, reinicia o relógio local
          if (!timerRunning) {
            saveFirstSentNow(emailTrim)
          }
        } else {
          resp = await api.register({
            username: username.trim() || emailTrim.split('@')[0],
            email: emailTrim,
            matricula: matricula.trim(),
            password: password,
          })
          // Primeiro envio: iniciar timer
          saveFirstSentNow(emailTrim)
        }
        setEmailError(null)
        // Mensagens padronizadas conforme backend
        const backendMsg = resp?.message || ''
        if (backendMsg) {
          toast.success(backendMsg)
        } else {
          toast.success(isResend ? 'Email de Confirmação Reenviado' : 'Email de Confirmação Enviado')
        }
        if (resp?.debug_verify_link) {
          toast.message('Link de verificação (dev): ' + resp.debug_verify_link)
        }
      } catch (err: unknown) {
        let msg = 'Falha ao cadastrar'
        if (typeof err === 'object' && err && 'response' in err) {
          const resp = (err as { response?: unknown }).response
          if (resp && typeof resp === 'object' && 'data' in resp) {
            const data = (resp as { data?: unknown }).data as Record<string, unknown> | undefined
            const backendMsg = typeof data?.message === 'string' ? data?.message : ''
            if (backendMsg) {
              msg = backendMsg
              if (backendMsg === 'Email já Cadastrado a um Usuário') {
                setEmailError(backendMsg)
              }
            }
            const detail = data?.detail
            const emailErr = data?.email
            const userErr = data?.username
            const passErr = data?.password
            const detailStr = typeof detail === 'string' ? detail : ''

            // normalizar acentos e comparar
            const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
            if (detailStr && norm(detailStr).includes('usuario ja ativo')) {
              msg = 'Email já Cadastrado a um Usuário'
              setEmailError('Email já Cadastrado a um Usuário')
            } else if (typeof emailErr === 'string' || Array.isArray(emailErr)) {
              // Qualquer erro de email duplicado vira mensagem padronizada
              msg = 'Email já Cadastrado a um Usuário'
              setEmailError('Email já Cadastrado a um Usuário')
            } else if (typeof userErr === 'string') {
              const u = norm(userErr)
              if (u.includes('ja existe') || u.includes('already exists')) {
                msg = 'Email já Cadastrado a um Usuário'
                setEmailError('Email já Cadastrado a um Usuário')
              } else {
                msg = String(userErr)
              }
            } else if (Array.isArray(userErr) && userErr.length > 0) {
              const u0 = norm(String(userErr[0]))
              if (u0.includes('ja existe') || u0.includes('already exists')) {
                msg = 'Email já Cadastrado a um Usuário'
                setEmailError('Email já Cadastrado a um Usuário')
              } else {
                msg = String(userErr[0])
              }
            } else if (!backendMsg) {
              msg = String(detail || passErr || msg)
            }
          }
        }
        toast.error(msg)
      }
    })()
  }

  // reenvio agora é feito pelo próprio botão de submit quando já houve um envio prévio

  return (
  <div className="relative min-h-screen p-4 bg-transparent">
  {/* Fundo animado atrás do conteúdo (sem badge) */}
  <FundoAnimado showBadge={false} zIndex={0} />
      {/* Imagem centralizada na segunda coluna imaginária (37.5%) */}
      <img
        src={logoCadastro}
        alt="Logo Setup"
        className="absolute top-1/2 left-1/2 md:left-[37.5%] -translate-x-1/2 -translate-y-1/2 w-[640px] max-w-[90vw] h-auto select-none pointer-events-none z-0"
      />
      <div
        className="absolute top-1/2 left-1/2 md:left-[75%] -translate-x-1/2 -translate-y-1/2 w-full max-w-sm p-6 space-y-4 bg-white shadow rounded-xl z-20"
      >
  <h1 className="text-lg font-semibold text-gray-800">Novo Cadastro</h1>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm text-gray-700">E-mail Empresarial</label>
            <input
              type="email"
              className="w-full px-3 py-2 border rounded"
              value={email}
              onChange={(e)=>{
                const value = e.target.value
                setEmail(value)
                setEmailError(null)
                const localPart = value.split('@')[0]?.trim() ?? ''
                if (!usernameTouched) {
                  setUsername(localPart)
                }
              }}
              placeholder="seu.nome@gruposetup.com"
              required
            />
            {emailError ? (
              <p className="mt-1 text-xs text-red-600">{emailError}</p>
            ) : null}
          </div>
          <div className="space-y-1">
            <label className="text-sm text-gray-700">Usuário</label>
            <input
              className="w-full px-3 py-2 border rounded"
              value={username}
              onChange={(e)=>{ setUsernameTouched(true); setUsername(e.target.value) }}
              placeholder="Seu usuário"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-gray-700">Matrícula</label>
            <input
              className="w-full px-3 py-2 border rounded"
              value={matricula}
              onChange={(e)=>setMatricula(e.target.value)}
              placeholder="Sua matrícula"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-gray-700">Senha</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="w-full px-3 py-2 pr-10 border rounded"
                value={password}
                onChange={(e)=>setPassword(e.target.value)}
                placeholder="Sua senha"
                minLength={9}
                pattern={passwordPattern}
                title="Mínimo 9 caracteres, com letras maiúsculas, minúsculas e pelo menos um caractere especial"
                required
                aria-label="Senha"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute p-1 text-gray-700 -translate-y-1/2 bg-white border border-gray-300 rounded right-2 top-1/2 hover:bg-gray-100"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="mt-2 -mx-1 overflow-x-auto">
              <div className="inline-flex items-center gap-2 sm:gap-3 whitespace-nowrap text-[11px] sm:text-xs text-gray-600 px-1">
                <div className="flex items-center gap-1">
                  <span>8 Dígitos</span>
                  <span className={`inline-block h-2 w-2 rounded-full ${policy.length ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                </div>
                <div className="flex items-center gap-1">
                  <span>Maiúscula</span>
                  <span className={`inline-block h-2 w-2 rounded-full ${policy.upper ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                </div>
                <div className="flex items-center gap-1">
                  <span>Minúscula</span>
                  <span className={`inline-block h-2 w-2 rounded-full ${policy.lower ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                </div>
                <div className="flex items-center gap-1">
                  <span>Caractere Especial</span>
                  <span className={`inline-block h-2 w-2 rounded-full ${policy.special ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm text-gray-700">Confirmar Senha</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                className={`w-full px-3 py-2 pr-10 border rounded ${confirmStatus === 'mismatch' ? 'border-red-500' : ''}`}
                value={confirmPassword}
                onChange={(e)=>setConfirmPassword(e.target.value)}
                placeholder="Repita a senha"
                minLength={9}
                pattern={passwordPattern}
                title="Repita a senha com os mesmos requisitos"
                required
                aria-label="Confirmar Senha"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(v => !v)}
                className="absolute p-1 text-gray-700 -translate-y-1/2 bg-white border border-gray-300 rounded right-2 top-1/2 hover:bg-gray-100"
                aria-label={showConfirm ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className={`text-xs ${
              confirmStatus === 'idle' ? 'text-gray-500' :
              confirmStatus === 'typing' ? 'text-gray-500' :
              confirmStatus === 'mismatch' ? 'text-red-600' : 'text-emerald-600'
            }`}>
              {
                confirmStatus === 'idle' ? 'Confirme sua Senha.' :
                confirmStatus === 'typing' ? 'Analisando...' :
                confirmStatus === 'mismatch' ? 'Senha Diferente' : 'Senha Confirmada'
              }
            </p>
          </div>
          <button
            type="submit"
            disabled={!formValid}
            className={`relative w-full py-2 rounded px-3 ${formValid ? 'bg-emerald-600 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
          >
            <span className={`absolute right-3 top-1/2 -translate-y-1/2 tabular-nums ${formValid ? 'text-white/90' : 'text-gray-600'}`}>
              {remainingSeconds > 0 ? formatMMSS(remainingSeconds) : ''}
            </span>
            <span className="block w-full text-center">{firstSentAt ? 'Reenviar Email' : 'Cadastrar'}</span>
          </button>
        </form>
        <Link to="/login" className="block mt-2 text-sm text-center text-emerald-700 hover:underline">Voltar ao Login</Link>
      </div>
    </div>
  )
}
