import React from 'react'

interface Props {
  seccionais: string[]
  seccionaisSelecionadas: string[]
  toggleSeccional: (s: string) => void
  statusSapList: string[]
  tiposList: string[]
  mesesList: string[]
  statusSap: string
  tipo: string
  mes: string
  setStatusSap: (v: string) => void
  setTipo: (v: string) => void
  setMes: (v: string) => void
  className?: string
}

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
  return (
    <nav className={`relative flex flex-col w-[160px] h-full px-[12px] pb-6 sticky top-[84px] rounded-tr-3xl rounded-br-3xl ${className ? className : 'text-white'}`}> 
      <div
        className="absolute inset-0 h-full -z-10 shadow-inner rounded-tr-3xl rounded-br-3xl"
        style={{
          background: 'linear-gradient(135deg, rgba(21,128,61,0.8) 0%, rgba(34,197,94,0.8) 100%)'
        }}
      />
      <div className="flex flex-col gap-[24px] w-full overflow-y-auto">
        {/* Espaço de 12px já está acima. Agora o primeiro filtro de seccional vem logo abaixo */}
        {seccionais.map((s) => (
          <button
            key={s}
            onClick={() => toggleSeccional(s)}
            className={`botao-home text-[18px] w-full
              ${seccionaisSelecionadas.includes(s)
                ? 'bg-gradient-to-br from-green-200 to-green-300 text-green-700 shadow-lg'
                : 'bg-green-600 text-white hover:bg-green-500'}`}
          >
            {s}
          </button>
        ))}
      </div>
      {[ // Dropdowns
        { label: "Status SAP", value: statusSap, set: setStatusSap, options: Array.isArray(statusSapList) ? statusSapList : [] },
        { label: "Tipo", value: tipo, set: setTipo, options: Array.isArray(tiposList) ? tiposList : [] },
        { label: "Mês", value: mes, set: setMes, options: Array.isArray(mesesList) ? mesesList : [] }
      ].map(({ label, value, set, options }) => (
        <select
          key={label}
          className="botao-home text-[18px] w-full text-center mt-[24px] cursor-pointer"
          value={value}
          onChange={e => set(e.target.value)}
        >
          <option value="">{label}</option>
          {options.map(op => (
            <option key={op} value={op}>{op}</option>
          ))}
        </select>
      ))}
    </nav>
  )
}
