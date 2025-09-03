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
  const [usernameTouched, setUsernameTouched] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const emailTrim = email.trim()
    if (!emailTrim) {
      toast.error('Informe o e-mail empresarial')
      return
    }
    // Validar domínio corporativo específico: deve terminar com @gruposetup.com
    const emailOk = /@[gG][rR][uU][pP][oO][sS][eE][tT][uU][pP]\.com$/i.test(emailTrim)
    if (!emailOk) {
      toast.error('Email Inválido.')
      return
    }
    if (!matricula.trim()) {
      toast.error('Informe a matrícula')
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
        const res = await api.register({
          username: username.trim() || emailTrim.split('@')[0],
          email: emailTrim,
          matricula: matricula.trim(),
          password: password,
        })
        if (res.verify_url) {
          toast.success('Cadastro recebido! Você pode confirmar pelo e-mail ou clicar aqui para ativar agora.', {
            action: {
              label: 'Confirmar agora',
              onClick: () => {
                window.location.assign(res.verify_url!)
              }
            }
          })
        } else {
          toast.success('Cadastro recebido! Verifique seu e-mail para confirmar.')
        }
      } catch (err: unknown) {
        let msg = 'Falha ao cadastrar'
        if (typeof err === 'object' && err && 'response' in err) {
          const resp = (err as { response?: unknown }).response
          if (resp && typeof resp === 'object' && 'data' in resp) {
            const data = (resp as { data?: unknown }).data as Record<string, unknown> | undefined
            const detail = data?.detail
            const emailErr = data?.email
            const userErr = data?.username
            const passErr = data?.password
            msg = String(detail || emailErr || userErr || passErr || msg)
          }
        }
        toast.error(msg)
      }
    })()
  }

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
                const localPart = value.split('@')[0]?.trim() ?? ''
                if (!usernameTouched) {
                  setUsername(localPart)
                }
              }}
              placeholder="seu.nome@gruposetup.com"
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
            <label className="text-sm text-gray-700">Usuário</label>
            <input
              className="w-full px-3 py-2 border rounded"
              value={username}
              onChange={(e)=>{ setUsername(e.target.value); setUsernameTouched(true) }}
              placeholder="Seu usuário"
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
          <button type="submit" className="w-full py-2 text-white rounded bg-emerald-600">Cadastrar</button>
        </form>
  <Link to="/login" className="block text-sm text-center text-emerald-700 hover:underline">Voltar ao Login</Link>
      </div>
    </div>
  )
}
