import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { login } from '../services/api';
import { toast } from 'sonner';
import logo from '../assets/LogoSetup.png';

export default function Login() {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const prev = document.title;
    document.title = 'Controle / GRUPO SETUP';
    return () => { document.title = prev; };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(usuario.trim(), senha.trim());
      localStorage.setItem('logado', 'true');
      toast.success('Login realizado');
      window.location.href = '/home';
    } catch (err: unknown) {
      let status: number | undefined
      let msg: string | undefined
      if (typeof err === 'object' && err !== null) {
        const e = err as { response?: { status?: number; data?: unknown }; message?: string }
        status = e.response?.status
        if (e.response && typeof e.response === 'object') {
          const data = (e.response as { data?: unknown }).data
          if (data && typeof data === 'object' && 'detail' in data) {
            msg = String((data as Record<string, unknown>).detail)
          }
        }
        msg = msg || e.message
      }
      // Se o backend retornou um detalhe mais específico (ex.: conta inativa), priorizar essa mensagem
      if (msg && /inativ|verifique seu e-mail|email/i.test(msg)) {
        toast.error(msg)
      } else if (status === 401) {
        toast.error('Credenciais inválidas')
      } else {
        toast.error(msg || 'Falha ao conectar ao servidor')
      }
    }
  };

  return (
    <div
      className="relative w-screen min-h-screen bg-center bg-no-repeat bg-cover"
      style={{
        backgroundImage: "url('/imagens/grupo_setup.png')",
        overflowY: 'hidden', // ✅ Desativa rolagem vertical
        overflowX: 'hidden', // ✅ Garante que não haja rolagem horizontal
      }}
    >
      {/* Overlay escuro para contraste */}
      <div className="absolute inset-0 z-0 bg-black opacity-50" />

      {/* Logo + textos "GRUPO" e "Setup", reduzido em 30% */}
      <div
        className="absolute z-20 flex items-end space-x-2"
        style={{
          top: '3rem',
          left: '5rem',
          transform: 'scale(0.7)',
          transformOrigin: 'top left',
        }}
      >
        <img src={logo} alt="Logo" className="h-auto w-36" />
        <div className="flex flex-col justify-end ml-2 leading-none">
          <span
            style={{
              color: 'white',
              fontSize: '42px',
              lineHeight: '0.4',
              fontWeight: 'bold',
            }}
          >
            GRUPO
          </span>
          <span
            style={{
              color: 'white',
              fontSize: '116px',
              lineHeight: '1',
              fontWeight: 'bold',
              fontStyle: 'italic',
            }}
          >
            Setup
          </span>
        </div>
      </div>

      {/* Formulário centralizado na tela */}
      <div
        className="absolute z-10 flex flex-col items-center p-6 shadow-xl rounded-xl"
        style={{
          top: '75%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'transparent',
          width: '200px',
        }}
      >
        <form onSubmit={handleSubmit} className="flex flex-col items-center">
          {/* Campo Usuário */}
          <div className="flex flex-col mb-4 w-[200px]">
            <label
              htmlFor="usuario"
              className="mb-1 text-sm font-medium"
              style={{ color: 'white', backgroundColor: 'transparent' }}
            >
              Usuário:
            </label>
            <input
              id="usuario"
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="Digite seu Usuário"
              className="p-2 text-center text-black border border-gray-300 rounded"
              required
            />
          </div>

          {/* Campo Senha */}
          <div className="flex flex-col mb-4 w-[200px]">
            <label
              htmlFor="senha"
              className="mb-1 text-sm font-medium"
              style={{ color: 'white', backgroundColor: 'transparent' }}
            >
              Senha:
            </label>
            <div className="relative">
              <input
                id="senha"
                type={showPassword ? 'text' : 'password'}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Digite sua Senha"
                className="w-full p-2 pr-10 text-center text-black border border-gray-300 rounded"
                required
                aria-label="Senha"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute p-1 text-gray-700 -translate-y-1/2 bg-white border border-gray-300 rounded right-2 top-1/2 hover:bg-gray-100"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Botão Entrar */}
          <div className="w-[200px] mb-4">
            <button
              type="submit"
              style={{ backgroundColor: '#047857', color: 'white' }}
              className="w-full p-2 font-bold transition rounded"
            >
              Entrar
            </button>
          </div>
        </form>
        {/* Ações adicionais */}
        <div className="w-[200px] flex items-center justify-between gap-2 mt-2">
          <Link
            to="/cadastro"
            className="flex-1 py-2 text-sm text-center text-white transition border rounded border-white/60 hover:bg-white/10"
          >
            Novo Cadastro
          </Link>
          <Link
            to="/recuperacao-senha"
            className="flex-1 py-2 text-sm text-center text-white transition border rounded border-white/60 hover:bg-white/10"
          >
            Esqueci a Senha
          </Link>
        </div>
      </div>
    </div>
  );
}
