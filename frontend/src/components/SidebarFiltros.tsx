import React from 'react'

/**
 * Componente de barra lateral para filtros da dashboard.
 * Permite seleção de seccionais, status SAP, tipo e mês.
 */

/** Props do componente SidebarFiltros */
interface Props {
  /** Lista de seccionais disponíveis */
  seccionais: string[]
  /** Seccionais selecionadas */
  seccionaisSelecionadas: string[]
  /** Função para alternar seleção de seccional */
  toggleSeccional: (s: string) => void
  /** Lista de status SAP disponíveis */
  statusSapList: string[]
  /** Lista de tipos disponíveis */
  tiposList: string[]
  /** Lista de meses disponíveis */
  mesesList: string[]
  /** Status SAP selecionado */
  statusSap: string
  /** Tipo selecionado */
  tipo: string
  /** Mês selecionado */
  mes: string
  /** Função para alterar status SAP */
  setStatusSap: (v: string) => void
  /** Função para alterar tipo */
  setTipo: (v: string) => void
  /** Função para alterar mês */
  setMes: (v: string) => void
  /** Classe extra para estilização */
  className?: string
}

/**
 * Renderiza barra lateral de filtros para dashboard.
 */
export function SidebarFiltros({
  seccionais = [],
  seccionaisSelecionadas,
  toggleSeccional,
  statusSapList,
  tiposList,
  mesesList,
  statusSap,
  tipo,
  mes,
  setStatusSap,
  setTipo,
  setMes,
  className
}: Props) {
  const safeSeccionais = Array.isArray(seccionais) ? seccionais : [];
  return (
    <nav className={`relative flex flex-col w-[160px] h-full px-[12px] pb-6 sticky top-[84px] rounded-tr-3xl rounded-br-3xl ${className ? className : 'text-white'}`}> 
      <div
        className="absolute inset-0 h-full shadow-inner -z-10 rounded-tr-3xl rounded-br-3xl"
        style={{
          background: 'linear-gradient(135deg, rgba(21,128,61,0.8) 0%, rgba(34,197,94,0.8) 100%)'
        }}
      />
      <div className="flex flex-col gap-[24px] w-full overflow-y-auto">
        {/* Espaço de 12px já está acima. Agora o primeiro filtro de seccional vem logo abaixo */}
        {safeSeccionais.map((s) => {
          const selecionado = seccionaisSelecionadas.includes(s);
          return (
            <button
              key={s}
              onClick={() => toggleSeccional(s)}
              aria-label={`Seccional ${s}`}
              className={`w-full h-12 rounded-full font-semibold text-[18px] border-2 shadow transition-colors duration-150 flex items-center justify-center mb-0 min-h-[48px]
                ${selecionado ? 'bg-green-600 !text-white !border-green-700 shadow-lg' : 'bg-white !text-green-700 !border-green-400 hover:bg-green-50'}
              `}
              style={selecionado
                ? { backgroundColor: '#16a34a', color: '#fff', borderColor: '#15803d', marginBottom: '0px' }
                : { backgroundColor: '#fff', color: '#15803d', borderColor: '#22c55e', marginBottom: '0px' }
              }
            >
              {s || '-'}
            </button>
          );
        })}
      </div>
      {[ // Dropdowns
        { label: "Status SAP", value: statusSap, set: setStatusSap, options: Array.isArray(statusSapList) ? statusSapList : [] },
        { label: "Tipo", value: tipo, set: setTipo, options: Array.isArray(tiposList) ? tiposList : [] },
        { label: "Mês", value: mes, set: setMes, options: Array.isArray(mesesList) ? mesesList : [] }
      ].map(({ label, value, set, options }) => (
        <select
          key={label}
          className="botao-home text-[18px] w-full text-center mt-[24px] cursor-pointer"
          aria-label={label}
          value={value}
          onChange={e => set(e.target.value)}
        >
          <option value="">{label}</option>
          {options.map(op => (
            <option key={op} value={op}>{op || '-'}</option>
          ))}
        </select>
      ))}
    </nav>
  )
}
