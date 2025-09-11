import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { FundoAnimado } from '../components/FundoAnimado'
import imagemBotao from '../assets/obras.png'
import logoSetup from '../assets/LogoSetup1.png'

function Home() {
  const navigate = useNavigate()

  useEffect(() => {
    const prev = document.title;
    document.title = 'Grupo SETUP - Setores';
    return () => { document.title = prev; };
  }, []);

  const handleLogout = () => {
    navigate('/login')
  }

  return (
    <div className="relative h-screen overflow-hidden text-white bg-transparent">
  <FundoAnimado showBadge={false} />

      {/* Header fixo, estilo Obras */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-green-500 shadow-md bg-gradient-to-r from-green-600 via-green-600/90 to-green-700">
        <div className="relative flex items-center justify-between h-16 px-4 lg:px-6">
          {/* Painel branco com curva, canto arredondado e efeito 3D + logo */}
          <div
            className="absolute left-0 hidden select-none -top-4 sm:block"
            style={{ width: 376, height: 124, pointerEvents: 'none', transform: 'scale(0.8)', transformOrigin: 'top left' }}
          >
            <svg width="100%" height="100%" viewBox="0 0 320 160" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
              <defs>
                <linearGradient id="panelFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#f4f6fa" />
                </linearGradient>
                <radialGradient id="panelHighlight" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(80 20) rotate(0) scale(150 65)">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </radialGradient>
                <filter id="panelShadow" filterUnits="userSpaceOnUse" x="-40" y="-40" width="400" height="240">
                  <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#0f172a" floodOpacity="0.22" />
                </filter>
                <linearGradient id="edgeLight" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                </linearGradient>
                {/* Máscara para a borda animada de 2px, com margem para não cortar */}
                <mask id="panelStrokeMask" maskUnits="userSpaceOnUse" x="-6" y="-6" width="332" height="172">
                  <rect x="-6" y="-6" width="332" height="172" fill="black" />
                  <path d="M 14 0 H 288 Q 300 0 288 12 L 208 152 Q 204 160 192 160 L 20 160 Q 0 160 0 140 L 0 0 L 14 0 Z" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                </mask>
              </defs>
              <g filter="url(#panelShadow)">
                <path
                  d="M 14 0 H 288 Q 300 0 288 12 L 208 152 Q 204 160 192 160 L 20 160 Q 0 160 0 140 L 0 0 L 14 0 Z"
                  fill="url(#panelFill)"
                  pathLength="1000"
                />
                {/* Contorno idêntico aos cards/botões: conic-gradient com rotação contínua */}
                <foreignObject x="-6" y="-6" width="332" height="172" mask="url(#panelStrokeMask)" pointerEvents="none">
                  <div style={{ width: '100%', height: '100%', background: 'transparent' }}>
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        background:
                          'conic-gradient(from var(--gangle, 0deg) at 50% 50%, hsl(142 76% 36%) 0deg, #39FF14 140deg, #39FF14 180deg, hsl(142 76% 36%) 360deg)',
                        filter: 'drop-shadow(0 0 9px rgba(57,255,20,0.65)) drop-shadow(0 0 18px rgba(57,255,20,0.45))',
                        animation: 'gradient-rotate 2.2s linear infinite',
                        borderRadius: '20px'
                      }}
                    />
                  </div>
                </foreignObject>
                <path d="M 14 0 H 288" stroke="url(#edgeLight)" strokeWidth="2" />
              </g>
            </svg>
            {/* Logo dentro do painel */}
            <div className="absolute flex items-start justify-start pointer-events-none top-8 left-4">
              <img src={logoSetup} alt="Grupo Setup" className="h-[76px] w-auto max-h-[80%] object-contain drop-shadow" loading="lazy" />
            </div>
          </div>
          {/* Título centralizado */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <h1 className="font-inter text-xl font-extrabold leading-none tracking-wide text-white drop-shadow-[0_3px_6px_rgba(0,0,0,0.35)] sm:text-2xl lg:text-3xl">
              Setores
            </h1>
          </div>
          <div className="flex items-center gap-3 lg:gap-6" />
        </div>
        {/* Botão Sair alinhado como o botão Início da página Obras */}
        <div className="absolute top-0 right-[2.5vw] h-16 flex items-center z-[60]">
          <div className="relative transition-transform duration-200 group rounded-xl will-change-transform hover:scale-105 active:scale-100">
            <button
              onClick={handleLogout}
              className="relative inline-flex items-center h-10 gap-2 px-4 font-bold text-gray-700 transition-all duration-200 bg-white border border-gray-300 shadow-md rounded-xl hover:bg-gray-50 hover:shadow-lg"
              title="Sair"
            >
              {/* Ícone Logout (porta com seta) com traços grossos e mesmo degradê do botão Início em Obras */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <defs>
                  <linearGradient id="logoutIconGradient" x1="0" y1="0" x2="0" y2="24" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#39FF14" />
                    <stop offset="60%" stopColor="hsl(142 85% 42%)" />
                    <stop offset="100%" stopColor="hsl(142 76% 36%)" />
                  </linearGradient>
                </defs>
                {/* Porta (um pouco mais estreita) */}
                <path d="M7 5.5h5a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H7z" stroke="url(#logoutIconGradient)" strokeWidth="2.4" strokeLinejoin="round" />
                {/* Maçaneta */}
                <circle cx="11.5" cy="12" r="0.9" fill="url(#logoutIconGradient)" />
                {/* Seta de saída (mais à direita) */}
                <path d="M17 8l4 4-4 4" stroke="url(#logoutIconGradient)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
                {/* Linha até antes da porta para criar um vão claro */}
                <path d="M21 12H13.5" stroke="url(#logoutIconGradient)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Sair</span>
            </button>
            {/* Contorno neon sempre aparente, 2px como o painel do logo */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-xl opacity-100 [animation:gradient-rotate_2.2s_linear_infinite]"
              style={{
                padding: '2px',
                background:
                  'conic-gradient(from var(--gangle, 0deg) at 50% 50%, hsl(142 76% 36%) 0deg, #39FF14 140deg, #39FF14 180deg, hsl(142 76% 36%) 360deg)',
                WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
                filter: 'drop-shadow(0 0 9px rgba(57,255,20,0.65)) drop-shadow(0 0 18px rgba(57,255,20,0.45))'
              }}
            />
          </div>
        </div>
      </header>

      {/* Área central entre o header e o rodapé, botão centralizado e em dobro do tamanho */}
      <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-center px-6 top-16">
        <div className="flex flex-col items-center">
      <button
            className="relative group rounded-2xl"
            onClick={() => navigate('/obras')}
            style={{
              borderColor: 'white',
              borderWidth: '5px',
              borderStyle: 'solid',
              borderRadius: '1rem',
              overflow: 'hidden',
              padding: '12px',
              width: '360px',
              height: '360px',
              background:
                'linear-gradient(180deg, hsl(142 90% 45% / 0.85) 0%, hsl(142 85% 42% / 0.78) 50%, hsl(142 76% 36% / 0.75) 100%)',
              cursor: 'pointer',
              transition: 'transform 0.3s ease',
        position: 'relative',
        display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'scale(1.05)'
              e.currentTarget.style.borderColor = 'transparent'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.borderColor = 'white'
            }}
          >
            {/* Glow sutil igual aos cards de Obras */}
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_20%_10%,rgba(255,255,255,0.35),transparent_60%)]" />
            <img
              src={imagemBotao}
              alt="Botão Obras"
              style={{
                width: '78%',
                height: '78%',
                objectFit: 'contain',
                borderRadius: '0.75rem',
                display: 'block',
              }}
            />
            <span
              style={{
                marginTop: '0.5rem',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '1.25rem',
                userSelect: 'none',
                textAlign: 'center',
              }}
            >
              OMP - SUL
            </span>
            {/* Contorno neon com mesmo efeito degradê e rotação no hover (igual aos cards/botões de Obras) */}
      <div
              aria-hidden
              className="pointer-events-none absolute inset-0 transition-opacity duration-200 opacity-0 rounded-2xl group-hover:opacity-100 group-hover:[animation:gradient-rotate_2.2s_linear_infinite]"
              style={{
        padding: '5px',
                background:
                  'conic-gradient(from var(--gangle, 0deg) at 50% 50%, hsl(142 76% 36%) 0deg, #39FF14 140deg, #39FF14 180deg, hsl(142 76% 36%) 360deg)',
                WebkitMask: 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
                WebkitMaskComposite: 'xor',
                maskComposite: 'exclude',
                filter: 'drop-shadow(0 0 9px rgba(57,255,20,0.65)) drop-shadow(0 0 18px rgba(57,255,20,0.45))',
                borderRadius: '1rem'
              }}
            />
          </button>
        </div>
      </div>
    </div>
  )
}
export default Home
