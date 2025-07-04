import { useState } from 'react';
import logo from '../assets/LogoSetup.png';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
  };

  return (
    <div
      className="relative min-h-screen w-screen bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('/imagens/grupo_setup.png')",
        overflowY: 'hidden', // ✅ Desativa rolagem vertical
        overflowX: 'hidden', // ✅ Garante que não haja rolagem horizontal
      }}
    >
      {/* Overlay escuro para contraste */}
      <div className="absolute inset-0 bg-black opacity-50 z-0" />

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
        <img src={logo} alt="Logo" className="w-36 h-auto" />
        <div className="flex flex-col justify-end leading-none ml-2">
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
        className="absolute z-10 p-6 rounded-xl shadow-xl flex flex-col items-center"
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
              className="font-medium text-sm mb-1"
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
              className="p-2 rounded border border-gray-300 text-center text-black"
              required
            />
          </div>

          {/* Campo Senha */}
          <div className="flex flex-col mb-4 w-[200px]">
            <label
              htmlFor="senha"
              className="font-medium text-sm mb-1"
              style={{ color: 'white', backgroundColor: 'transparent' }}
            >
              Senha:
            </label>
            <input
              id="senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Digite sua Senha"
              className="p-2 rounded border border-gray-300 text-center text-black"
              required
            />
          </div>

          {/* Botão Entrar */}
          <div className="w-[200px] mb-4">
            <button
              type="submit"
              style={{ backgroundColor: '#047857', color: 'white' }}
              className="w-full p-2 font-bold rounded transition"
            >
              Entrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
