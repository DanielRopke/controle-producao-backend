import { Link, useNavigate } from 'react-router-dom'
import fundo from '../assets/fundo2.jpg'

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

import logoSetup from '../assets/LogoSetup.png'  // Importação da logo

function Obras({ onLogout }: { onLogout: () => void }) {
  const navigate = useNavigate()

  const handleGoHome = () => {
    navigate('/home')
  }

  const menuItems = [
    { label: 'Prazos SAP', to: '/prazos-sap', img: prazosapImg },
    { label: 'Programação', to: '/programacao', img: programacaoImg },
    { label: 'Faturamento', to: '/faturamento', img: faturamentoImg },
    { label: 'Pareto Obras', to: '/pareto-obras', img: paretoImg },
    { label: 'Pareto Manutenção', to: '/pareto-manutencao', img: paretoImg },
    { label: 'GA/QLP/ Equipamentos', to: '/ga-qlp', img: gaqlpImg },
    { label: 'KPI Manutenção', to: '/kpi-manutencao', img: kpiImg },
    { label: 'Carteira de Obras', to: '/carteira-obras', img: carteiraImg },
    { label: 'Prioridade Obras', to: '/prioridade-obras', img: prioridadeImg },
    { label: 'Mapa', to: '/mapa', img: mapaImg },
    { label: 'Defeitos Progeo', to: '/defeitos-progeo', img: defeitosImg },
  ]

  return (
    <div
      className="min-h-screen grid grid-rows-4 text-white"
      style={{
        backgroundImage: `url(${fundo})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        overflowX: 'hidden',       // impede rolagem horizontal
      }}
    >
      {/* Parte 1: cabeçalho */}
      <div className="flex justify-between items-start p-6">
        {/* Logo no canto superior esquerdo */}
        <div>
          <img
            src={logoSetup}
            alt="Logo Setup"
            style={{
              width: '66.66%',
              maxWidth: '150px',
              height: 'auto',
              display: 'block',
              marginTop: '1rem',      // espaço de 16px do topo
              marginLeft: '1rem',     // espaço de 16px da lateral esquerda
            }}
          />
        </div>

        <button
          onClick={handleGoHome}
          className="bg-white text-blue-900 font-bold px-4 py-2 rounded hover:bg-gray-100 transition"
        >
          Home
        </button>
      </div>

      {/* Parte 2: vazia */}
      <div></div>

      {/* Parte 3 e 4 juntas para botões */}
      <div
        className="row-start-3 row-end-5 flex justify-center items-center overflow-y-auto"
        style={{ maxHeight: 'calc(100vh - 160px)' }} // ajusta max altura para rolagem vertical, considerando o header
      >
        <div className="flex flex-wrap justify-evenly gap-10 w-full max-w-6xl px-6">
          {menuItems.map(({ label, to, img }) => (
            <div key={to} className="flex flex-col items-center">
              <Link
                to={to}
                className="border-solid overflow-hidden hover:scale-105 transition-transform"
                style={{
                  width: '70px',
                  height: '70px',
                  borderWidth: '5px',
                  borderStyle: 'solid',
                  borderRadius: '1rem',
                  padding: '6px',
                  backgroundColor: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderColor: 'white', // borda branca
                }}
              >
                <img
                  src={img}
                  alt={label}
                  className="w-full h-full object-contain"
                />
              </Link>
              <span
                className="mt-2 font-semibold text-center text-sm max-w-[100px]"
                style={{ color: 'white' }} // texto branco
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Obras
