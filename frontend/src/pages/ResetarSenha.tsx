import { useEffect, useMemo, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../services/api'
import logoCadastro from '../assets/LogoSetup1.png'
import { FundoAnimado } from '../components/FundoAnimado'

export default function ResetarSenha() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const uid = searchParams.get('uid') || ''
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmStatus, setConfirmStatus] = useState<'idle'|'typing'|'match'|'mismatch'>('idle')
  const [loading, setLoading] = useState(false)

  const passwordPattern = '(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{9,}'
  const policy = useMemo(() => ({
    length: password.length > 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  }), [password])

  useEffect(() => {
    if (!confirmPassword) { setConfirmStatus('idle'); return }
    setConfirmStatus('typing')
    const t = window.setTimeout(() => {
      setConfirmStatus(confirmPassword === password ? 'match' : 'mismatch')
    }, 800)
    return () => window.clearTimeout(t)
  }, [confirmPassword, password])

  useEffect(() => { document.title = 'Redefinir Senha' }, [])

  const formValid = policy.length && policy.upper && policy.lower && policy.special && confirmPassword === password

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uid || !token) { toast.error('Link inválido. Verifique o e-mail enviado.'); return }
    if (!formValid) { toast.error('Verifique os requisitos da senha.'); return }
    setLoading(true)
    try {
      const res = await api.requestPasswordResetConfirm(uid, token, password)
      toast.success(res?.message || 'Senha alterada com sucesso')
      setTimeout(() => navigate('/login'), 900)
    } catch (err: unknown) {
      // Extrai mensagem segura de erro sem usar 'any'
      let msg = 'Falha ao alterar senha'
      try {
        if (typeof err === 'string') {
          msg = err
        } else if (err && typeof err === 'object') {
          const e = err as Record<string, unknown>
          const resp = e['response'] as Record<string, unknown> | undefined
          const data = resp?.['data'] as Record<string, unknown> | undefined
          const candidate = data?.['error'] ?? data?.['password']
          if (typeof candidate === 'string') msg = candidate
          else msg = String(err)
        } else {
          msg = String(err)
        }
      } catch (e) {
        // ignore extraction errors and fall back to default msg
        void e
      }
      toast.error(msg || 'Falha ao alterar senha')
    } finally { setLoading(false) }
  }

  return (
    <div className="relative min-h-screen p-4 bg-transparent">
      <FundoAnimado showBadge={false} zIndex={0} />
      <img
        src={logoCadastro}
        alt="Logo Setup"
        className="absolute top-1/2 left-1/2 md:left-[37.5%] -translate-x-1/2 -translate-y-1/2 w-[640px] max-w-[90vw] h-auto select-none pointer-events-none z-0"
      />
      <div className="absolute top-1/2 left-1/2 md:left-[75%] -translate-x-1/2 -translate-y-1/2 w-full max-w-sm p-6 space-y-4 bg-white shadow rounded-xl z-20">
        <h1 className="text-lg font-semibold text-gray-800">Redefinir Senha</h1>
        <form onSubmit={handleSubmit} className="space-y-3">
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
            disabled={!formValid || loading}
            className={`relative w-full py-2 rounded px-3 ${formValid ? 'bg-emerald-600 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
          >
            <span className="block w-full text-center">{loading ? 'Enviando...' : 'Alterar Senha'}</span>
          </button>
        </form>
        <Link to="/login" className="block mt-2 text-sm text-center text-emerald-700 hover:underline">Voltar ao Login</Link>
      </div>
    </div>
  )
}
