import { Link, useNavigate } from 'react-router-dom'
import { FundoAnimado } from '../components/FundoAnimado' // Fundo animado 3D

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

import logoSetup from '../assets/LogoSetup1.png'

function Obras() {
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
    <div className="relative w-full h-screen overflow-hidden text-white">
      {/* Fundo animado estilo Tzolkin */}
      <FundoAnimado />

      {/* Conteúdo da página sobreposto ao fundo */}
      <div className="relative z-10 min-h-screen grid grid-rows-4">

        {/* Parte 1: cabeçalho */}
        <div className="flex justify-between items-start p-6">
          {/* Logo no canto superior esquerdo */}
          <div>
            <img
              src={logoSetup}
              alt="Logo Setup"
              style={{
                width: '66.66%',
                maxWidth: '600px',
                height: 'auto',
                display: 'block',
                marginTop: '1rem',
                marginLeft: '1rem',
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

        {/* Parte 2: espaçamento */}
        <div></div>

        {/* Parte 3 e 4: botões do menu */}
        <div
          className="row-start-3 row-end-5 flex justify-center items-center overflow-y-auto"
          style={{ maxHeight: 'calc(100vh - 160px)' }}
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
                    borderColor: '#16a34a',
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
                  style={{ color: 'black' }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Obras
