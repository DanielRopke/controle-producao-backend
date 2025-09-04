import { Link, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { FundoAnimado } from '../components/FundoAnimado'

import prazosapImg from '../assets/prazosap.png'
import programacaoImg from '../assets/programação.png'
import faturamentoImg from '../assets/faturamento.png'
import paretoImg from '../assets/pareto.png'
import gaqlpImg from '../assets/gaqlp.png'
import kpiImg from '../assets/kpi.png'
import carteiraImg from '../assets/carteira.png'
import prioridadeImg from '../assets/prioridade.png'
import mapaImg from '../assets/mapa.png'
import defeitosImg from '../assets/defeitos.png'

import logoSetup from '../assets/LogoSetup1.png'  // Importação da logo (versão 1)

type MenuItem = { label: string; to: string; img: string; desc: string; soon?: boolean }

function MenuCard({ item }: { item: MenuItem }) {
  const innerCard = (
    <div
  className="relative w-full h-40 rounded-2xl shadow-[0_10px_30px_-12px_rgba(0,0,0,0.45)] transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-[0_18px_40px_-12px_rgba(0,0,0,0.5)] ring-1 ring-white/20 overflow-hidden backdrop-blur-sm"
      style={{
        // Mesmo degradê das colunas verdes dos gráficos da página PrazosSAP
        background:
          'linear-gradient(180deg, hsl(142 90% 45% / 0.85) 0%, hsl(142 85% 42% / 0.78) 50%, hsl(142 76% 36% / 0.75) 100%)',
      }}
    >
      {/* Glow/overlay sutil */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_20%_10%,rgba(255,255,255,0.35),transparent_60%)]" />

      {/* Conteúdo do card: linha com ícone (dobrado) e título ao lado, descrição abaixo */}
      <div className="relative z-10 h-full p-4">
        <div className="flex items-center gap-4">
          {/* Ícone reduzido em 25% */}
          <div className="grid w-[72px] h-[72px] place-items-center rounded-2xl bg-emerald-50/25 backdrop-blur-sm ring-1 ring-emerald-200/40">
            <img src={item.img} alt={item.label} className="object-contain w-12 h-12 drop-shadow" loading="lazy" />
          </div>
          {/* Título centralizado verticalmente em relação ao ícone */}
          <h3 className="text-xl font-semibold text-white drop-shadow-sm">{item.label}</h3>
        </div>
        {/* Descrição abaixo */}
        <p className="mt-3 text-sm leading-snug text-white/85">{item.desc}</p>
      </div>

      {/* Selo Breve */}
      {item.soon && (
        <div className="absolute top-4 right-4 rounded-full bg-white/60 px-2 py-0.5 text-[11px] font-semibold text-gray-800 shadow-sm">Breve</div>
      )}

      {/* Contorno neon contínuo (sem bolinha girando), alinhado ao card mesmo com translate no hover) */}
      <div
        aria-hidden
        className="absolute inset-0 transition-opacity duration-200 opacity-0 pointer-events-none rounded-2xl group-hover:opacity-100 group-hover:[animation:gradient-rotate_2.2s_linear_infinite]"
        style={{
          // Criar uma borda de 2px sem cobrir o conteúdo interno
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
  )

  return (
  <div className="relative block w-full group rounded-2xl">
      {innerCard}
      {!item.soon && (
        <Link
          to={item.to}
          aria-label={item.label}
          title={item.label}
          className="absolute inset-0 no-underline border-0 outline-none rounded-2xl focus:outline-none focus:ring-0 ring-0"
          style={{ textDecoration: 'none', WebkitTapHighlightColor: 'transparent' }}
        />
      )}
    </div>
  )
}

function Obras() {
  const navigate = useNavigate()

  const handleGoHome = () => {
  navigate('/home')
  }

  const menuItems: MenuItem[] = [
    { label: 'Prazos SAP', to: '/prazos-sap', img: prazosapImg, desc: 'Gestão e monitoramento de prazos do sistema SAP' },
  { label: 'Programação', to: '/programacao', img: programacaoImg, desc: 'Planejamento e programação de atividades' },
    { label: 'Faturamento', to: '/faturamento', img: faturamentoImg, desc: 'Controle e gestão de faturamento', soon: true },
    { label: 'Pareto Obras', to: '/pareto-obras', img: paretoImg, desc: 'Análise de Pareto para obras', soon: true },
    { label: 'Pareto Manutenção', to: '/pareto-manutencao', img: paretoImg, desc: 'Análise de Pareto para manutenção', soon: true },
    { label: 'GA/QLP/ Equipamentos', to: '/ga-qlp', img: gaqlpImg, desc: 'Gestão de equipamentos e qualidade', soon: true },
  { label: 'KPI Manutenção', to: '/kpi-manutencao', img: kpiImg, desc: 'Indicadores de performance de manutenção', soon: true },
    { label: 'Carteira de Obras', to: '/carteira-obras', img: carteiraImg, desc: 'Gestão da carteira de obras', soon: true },
    { label: 'Prioridade Obras', to: '/prioridade-obras', img: prioridadeImg, desc: 'Definição de prioridades de obras', soon: true },
    { label: 'Mapa', to: '/mapa', img: mapaImg, desc: 'Visualização geográfica de obras', soon: true },
    { label: 'Defeitos Progeo', to: '/defeitos-progeo', img: defeitosImg, desc: 'Gestão de defeitos do sistema Progeo', soon: true },
  ]

  useEffect(() => {
    const prev = document.title
    document.title = 'Obras'
    return () => { document.title = prev }
  }, [])

  return (
    <div className="relative h-screen overflow-hidden text-white bg-transparent">
      <FundoAnimado showBadge={false} />

      {/* Header fixo, estilo PrazosSAP */}
  <header className="fixed top-0 left-0 right-0 z-50 border-b border-green-500 shadow-md bg-gradient-to-r from-green-600 via-green-600/90 to-green-700">
        <div className="relative flex items-center justify-between h-16 px-4 lg:px-6">
          {/* Painel branco com curva, canto arredondado e efeito 3D */}
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
                {/* Gradiente do contorno igual ao dos botões/cards */}
                <linearGradient id="panelBorderGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="hsl(142 76% 36%)" />
                  <stop offset="40%" stopColor="#39FF14" />
                  <stop offset="60%" stopColor="#39FF14" />
                  <stop offset="100%" stopColor="hsl(142 76% 36%)" />
                </linearGradient>
                {/* Brilho neon */}
                <filter id="neonGlow" filterUnits="userSpaceOnUse" x="-40" y="-40" width="400" height="240">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur1" />
                  <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur2" />
                  <feMerge>
                    <feMergeNode in="blur2" />
                    <feMergeNode in="blur1" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                {/* Máscara para recortar exatamente a borda (2px) da forma do painel */}
                <mask id="panelStrokeMask" maskUnits="userSpaceOnUse" x="-6" y="-6" width="332" height="172">
                  <rect x="-6" y="-6" width="332" height="172" fill="black" />
                  <path d="M 14 0 H 288 Q 300 0 288 12 L 208 152 Q 204 160 192 160 L 20 160 Q 0 160 0 140 L 0 0 L 14 0 Z" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                </mask>
              </defs>
              {/* Corpo com lateral direita a 45° e canto inferior-esquerdo suave */}
              <g filter="url(#panelShadow)">
                {/* Forma principal */}
                <path id="panelShape"
                  d="M 14 0 H 288 Q 300 0 288 12 L 208 152 Q 204 160 192 160 L 20 160 Q 0 160 0 140 L 0 0 L 14 0 Z"
                  fill="url(#panelFill)"
                  pathLength="1000"
                />
                {/* Contorno idêntico ao dos botões/cards via máscara da forma + conic-gradient animado */}
                <foreignObject x="-6" y="-6" width="332" height="172" mask="url(#panelStrokeMask)" pointerEvents="none">
                  <div style={{ width: '100%', height: '100%', background: 'transparent' }}>
          <div
                      style={{
                        width: '100%',
                        height: '100%',
                        background:
                          'conic-gradient(from var(--gangle, 0deg) at 50% 50%, hsl(142 76% 36%) 0deg, #39FF14 140deg, #39FF14 180deg, hsl(142 76% 36%) 360deg)',
                        filter:
                          'drop-shadow(0 0 9px rgba(57,255,20,0.65)) drop-shadow(0 0 18px rgba(57,255,20,0.45))',
                        animation: 'gradient-rotate 2.2s linear infinite',
            borderRadius: '20px'
                      }}
                    />
                  </div>
                </foreignObject>
                {/* Brilho suave superior */}
                <path d="M 14 0 H 288" stroke="url(#edgeLight)" strokeWidth="2" />
              </g>
            </svg>
      {/* Logo grande dentro do painel (harmônico: mesma distância do topo e da esquerda) */}
            <div className="absolute flex items-start justify-start pointer-events-none top-8 left-4">
              <img
                src={logoSetup}
                alt="Grupo Setup"
    className="h-[76px] w-auto max-h-[80%] object-contain drop-shadow"
                loading="lazy"
              />
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <h1 className="font-inter text-xl font-extrabold leading-none tracking-wide text-white drop-shadow-[0_3px_6px_rgba(0,0,0,0.35)] sm:text-2xl lg:text-3xl">
              Obras e Manutenção Pesada - Sul
            </h1>
          </div>
          <div className="flex items-center gap-3 lg:gap-6" />
        </div>
        {/* Botão posicionado para alinhar a direita com o grid (95vw => margem de 2.5vw dos lados) */}
        <div className="absolute top-0 right-[2.5vw] h-16 flex items-center z-[60]">
          <div className="relative group rounded-xl transition-transform duration-200 will-change-transform hover:scale-105 active:scale-100">
            <button
              onClick={handleGoHome}
              className="relative inline-flex items-center h-10 gap-2 px-4 font-bold text-gray-700 transition-all duration-200 bg-white border border-gray-300 shadow-md rounded-xl hover:bg-gray-50 hover:shadow-lg"
              title="Ir para Home"
            >
              {/* Ícone de casa com o mesmo degradê do contorno dos botões */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <defs>
                  <linearGradient id="homeIconGradient" x1="0" y1="0" x2="0" y2="24" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#39FF14" />
                    <stop offset="60%" stopColor="hsl(142 85% 42%)" />
                    <stop offset="100%" stopColor="hsl(142 76% 36%)" />
                  </linearGradient>
                </defs>
                <path
                  d="M4 10.5L12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9.5z"
                  fill="url(#homeIconGradient)"
                />
              </svg>
              <span>Início</span>
            </button>
            {/* Contorno neon contínuo igual ao dos botões/cards */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-xl opacity-100 [animation:gradient-rotate_2.2s_linear_infinite]"
              style={{
                // espessura igual à do painel do logo (2px)
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

      {/* Conteúdo */}
      <div className="relative z-10 flex flex-col h-full pt-16">
  <div className="flex items-start justify-center flex-1 px-6 pb-6 pt-[40px]">
          <ul className="grid w-full max-w-[95vw] gap-x-10 gap-y-10 justify-items-stretch content-start [grid-template-columns:repeat(auto-fit,minmax(18rem,1fr))]">
            {menuItems.map((item) => (
              <li key={item.to}>
                <MenuCard item={item} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Obras
