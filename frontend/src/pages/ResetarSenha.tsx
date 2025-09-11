import React, { useState, useEffect } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { FundoAnimado } from '../components/FundoAnimado'
import logoCadastro from '../assets/LogoSetup1.png'
import { api } from '../services/api'

export default function ResetarSenha() {
  const [searchParams] = useSearchParams()
  const uid = searchParams.get('uid') || ''
  const token = searchParams.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // opcional: se não tiver uid/token, não permitir envio
  }, [uid, token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uid || !token) {
      toast.error('Link inválido. Verifique o e-mail enviado.')
      return
    }
    if (!password) {
      toast.error('Informe a nova senha')
      return
    }
    if (password !== confirm) {
      toast.error('Senhas não conferem')
      return
    }

    setLoading(true)
    try {
      const res = await api.requestPasswordResetConfirm(uid, token, password)
      toast.success(res?.message || 'Senha alterada com sucesso')
      // aguardar um momento e redirecionar para login
      setTimeout(() => navigate('/login'), 1000)
    } catch (err:any) {
      const msg = err?.response?.data?.error || err?.response?.data?.password || String(err)
      toast.error(msg || 'Falha ao alterar senha')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen p-4 bg-transparent">
      <FundoAnimado showBadge={false} zIndex={0} />
      <img
        src={logoCadastro}
        alt="Logo Setup"
        className="absolute top-1/2 left-1/2 md:left-[37.5%] -translate-x-1/2 -translate-y-1/2 w-[640px] max-w-[90vw] h-auto select-none pointer-events-none z-0"
      />
      <div className="absolute top-1/2 left-1/2 md:left-[75%] -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-xl shadow p-6 space-y-4 z-20">
        <h1 className="text-lg font-semibold text-gray-800">Redefinir Senha</h1>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm text-gray-700">Nova Senha</label>
            <input value={password} onChange={(e)=>setPassword(e.target.value)} type="password" className="w-full border rounded px-3 py-2" placeholder="Nova senha" />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-gray-700">Confirmar Senha</label>
            <input value={confirm} onChange={(e)=>setConfirm(e.target.value)} type="password" className="w-full border rounded px-3 py-2" placeholder="Repita a nova senha" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white rounded py-2">{loading ? 'Enviando...' : 'Alterar Senha'}</button>
        </form>
        <Link to="/login" className="block text-center text-sm text-emerald-700 hover:underline">Voltar ao Login</Link>
      </div>
    </div>
  )
}
