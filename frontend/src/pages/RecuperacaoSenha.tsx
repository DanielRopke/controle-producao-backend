import { useState } from 'react'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import { FundoAnimado } from '../components/FundoAnimado'
import logoCadastro from '../assets/LogoSetup1.png'

export default function RecuperacaoSenha() {
  const [usernameOrEmail, setUsernameOrEmail] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast.info('Recuperação: integração com backend a definir')
  }

  return (
    <div className="relative min-h-screen p-4 bg-transparent">
      {/* Fundo animado */}
      <FundoAnimado showBadge={false} zIndex={0} />
      {/* Logo na 2ª coluna */}
      <img
        src={logoCadastro}
        alt="Logo Setup"
        className="absolute top-1/2 left-1/2 md:left-[37.5%] -translate-x-1/2 -translate-y-1/2 w-[640px] max-w-[90vw] h-auto select-none pointer-events-none z-0"
      />
      {/* Card na 3ª-4ª coluna */}
      <div className="absolute top-1/2 left-1/2 md:left-[75%] -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-xl shadow p-6 space-y-4 z-20">
        <h1 className="text-lg font-semibold text-gray-800">Recuperação de Senha</h1>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm text-gray-700">Usuário ou E-mail</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={usernameOrEmail}
              onChange={(e)=>setUsernameOrEmail(e.target.value)}
              placeholder="Digite seu usuário ou e-mail"
            />
          </div>
          <button type="submit" className="w-full bg-emerald-600 text-white rounded py-2">Enviar</button>
        </form>
        <Link to="/login" className="block text-center text-sm text-emerald-700 hover:underline">Voltar ao Login</Link>
      </div>
    </div>
  )
}
