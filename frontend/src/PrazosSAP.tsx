

import { useNavigate } from 'react-router-dom'
import { SidebarFiltros } from './components/SidebarFiltros'
import { GraficoBarras } from './components/GraficoBarras'
import { TabelaMatriz } from './components/TabelaMatriz'
import { useFiltros } from './hooks/useFiltros'
import { useDadosGraficos } from './hooks/useDadosGraficos'
import { processarDados } from './utils/processarDados'
import logo from './assets/logo.png'
import filtroLimpo from './assets/filtro-limpo.png'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LabelList
} from 'recharts'

export default function PrazosSAP() {
  const navigate = useNavigate()
  const {
    seccionaisSelecionadas,
    toggleSeccional,
    statusSap,
    setStatusSap,
    tipo,
    setTipo,
    mes,
    setMes
  } = useFiltros()

  const {
    seccionais,
    statusSapList,
    tiposList,
    mesesList,
    graficoEner,
    graficoConc,
    graficoServico,
    graficoSeccionalRS,
    matriz
  } = useDadosGraficos({ seccionais: seccionaisSelecionadas, statusSap, tipo, mes })

  const dadosEner = processarDados(graficoEner, false, { seccionais: seccionaisSelecionadas })
    .slice().sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
  const dadosConc = processarDados(graficoConc, true, { seccionais: seccionaisSelecionadas })
    .slice().sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
  const dadosServico = processarDados(graficoServico, false, { seccionais: seccionaisSelecionadas })
    .slice().sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
  const graficoSeccionalRSOrdenado = Array.isArray(graficoSeccionalRS)
    ? graficoSeccionalRS.slice().sort((a, b) => (b.totalRS ?? 0) - (a.totalRS ?? 0))
    : graficoSeccionalRS;

  const formatarValorRS = (valor: number) =>
    valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })

  return (
    <div className="flex flex-col min-h-screen bg-gray-900" style={{ position: 'relative', zIndex: 0, overflow: 'auto' }}>
      {/* Fundo azul removido */}
      <header
        className="w-full absolute top-0 left-0 z-[100] flex items-center px-6 shadow-md"
        style={{ backgroundColor: '#4ade80', height: '72px', width: '100%' }}
      >
        <button
          onClick={() => navigate('/obras')}
          className="botao-home ml-[12px] rounded-full bg-gray-800 shadow-3d flex items-center justify-center"
          title="Voltar para menu"
          aria-label="Voltar para menu"
          type="button"
          style={{ width: 160, height: 48, padding: 0 }}
        >
          <img src={logo} alt="Logo Empresa" className="logo-botao" />
        </button>
        <button
          onClick={() => {
            setStatusSap('');
            setTipo('');
            setMes('');
            seccionaisSelecionadas.forEach(s => toggleSeccional(s));
          }}
          className="botao-home ml-[12px] rounded-full bg-gray-800 shadow flex items-center justify-center"
          title="Limpar todos os filtros"
          aria-label="Limpar todos os filtros"
          type="button"
          style={{ width: 96, height: 48, padding: 0 }}
        >
          <img src={filtroLimpo} alt="Limpar filtros" style={{ width: 32, height: 32 }} />
        </button>
        <div
          className="ml-[12px] rounded-full bg-gray-800 border-2 border-gray-700 shadow-3d flex flex-col items-center justify-center font-bold text-gray-100 text-lg"
          style={{ width: 160, height: 48, backgroundColor: '#fff' }}
        >
          <span>Valor Total</span>
          <span className="text-base font-semibold text-green-700" style={{ fontWeight: 600 }}>
            {formatarValorRS(
              Array.isArray(graficoSeccionalRS)
                ? graficoSeccionalRS.reduce((acc, cur) => acc + (cur.totalRS || 0), 0)
                : 0
            )}
          </span>
        </div>
        <h1 className="flex-grow font-serif text-2xl font-bold text-center text-white">
          Controle de Produção - Prazos SAP
        </h1>
        <div style={{ minWidth: 0, flex: '0 0 384px', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginRight: '16px' }}>
          <div
            className="flex flex-col items-center justify-center text-lg font-bold text-gray-100 bg-gray-800 border-2 border-gray-700 rounded-full shadow-3d"
            style={{ width: 160, height: 48, backgroundColor: '#fff' }}
          >
            <span>Valor Total</span>
            <span className="text-base font-semibold text-green-700" style={{ fontWeight: 600 }}>
              {formatarValorRS(
                Array.isArray(graficoSeccionalRS)
                  ? graficoSeccionalRS.reduce((acc, cur) => acc + (cur.totalRS || 0), 0)
                  : 0
              )}
            </span>
          </div>
          <div
            className="flex flex-col items-center justify-center text-lg font-bold text-gray-100 bg-gray-800 border-2 border-gray-700 rounded-full shadow-3d"
            style={{ width: 160, height: 48, backgroundColor: '#fff' }}
          >
            <span>Qtd de PEP</span>
            <span className="text-base font-semibold text-green-700" style={{ fontWeight: 600 }}>
              {Array.isArray(graficoSeccionalRS)
                ? graficoSeccionalRS.reduce((acc, cur) => acc + (cur.totalPEP || 0), 0)
                : 0}
            </span>
          </div>
        </div>
      </header>
      <div style={{ height: '88px' }} />
      <div className="flex flex-1 gap-8 p-6">
        <div style={{ minHeight: 'calc(100vh - 88px)', height: '100%', marginBottom: '16px' }} className="sticky top-[88px] self-start z-50 w-[185px] flex flex-col">
          <SidebarFiltros
            seccionais={seccionais}
            seccionaisSelecionadas={seccionaisSelecionadas}
            toggleSeccional={toggleSeccional}
            statusSapList={statusSapList}
            tiposList={tiposList}
            mesesList={mesesList}
            statusSap={statusSap}
            tipo={tipo}
            mes={mes}
            setStatusSap={setStatusSap}
            setTipo={setTipo}
            setMes={setMes}
            className="shadow-3d p-0 bg-[#4ade80] h-full min-h-[400px] rounded-l-3xl rounded-r-3xl rounded-br-3xl flex-1"
          />
          <div style={{ height: '16px' }} />
        </div>
        <div style={{ width: '16px' }} />
        <div className="flex flex-col flex-1 gap-8">
          <div className="flex gap-8">
            <div className="flex flex-col flex-1 gap-8">
              <div className="z-[10]">
                <GraficoBarras titulo="Status ENER" dados={dadosEner} />
              </div>
              <div style={{ height: '16px' }} />
              <div className="z-[10]">
                <GraficoBarras titulo="Status CONC" dados={dadosConc} />
              </div>
            </div>
            <div style={{ width: '16px' }} />
            <div className="flex flex-col flex-1 gap-8">
              <div className="p-6 rounded-3xl shadow-lg h-[280px] flex flex-col z-[10]" style={{background: 'linear-gradient(135deg, #bbf7d0 0%, #a7f3d0 100%)', borderRadius: '1.5rem', marginRight: '16px'}}>
                <h2 className="text-center font-semibold mb-4 font-serif text-gray-700 text-[20px]">
                  Comparativo por Seccional: R$ e Qtd PEP
                </h2>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={graficoSeccionalRSOrdenado} margin={{ top: 20, right: 30, left: 30, bottom: 40 }}>
                    <foreignObject x={0} y={0} width="100%" height="100%">
                      <div style={{width: '100%', height: '100%', background: 'rgba(255,255,255,0.9)', borderRadius: 20, backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(16px)'}} />
                    </foreignObject>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="seccional" tick={{ fill: '#4a4a4a' }} />
                    <YAxis hide />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        name === 'totalRS' ? formatarValorRS(value) : value,
                        name === 'totalRS' ? 'R$' : 'PEP',
                      ]}
                    />
                    <Bar dataKey="totalRS" fill="#3182ce">
                      <LabelList dataKey="totalRS" position="top" fill="#333" fontSize={12} />
                    </Bar>
                    <Bar dataKey="scaledPEP" fill="#4ade80">
                      <LabelList dataKey="totalPEP" position="top" fill="#333" fontSize={12} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ height: '16px' }} />
              <div style={{ marginRight: '16px' }}>
                <div className="relative z-[20]">
                  <div className="absolute top-0 left-0 w-full h-[48px] rounded-t-3xl bg-white/90 backdrop-blur-md z-[30] pointer-events-none" />
                  <div className="relative z-[40]">
                    <GraficoBarras titulo="Motivo de Não Fechado" dados={dadosServico} />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div style={{ position: 'relative', zIndex: 40, marginRight: '16px' }}>
            <div style={{ height: '16px' }} />
            <div
              className="absolute top-[48px] left-0 w-full h-[calc(100%-48px)] rounded-b-3xl z-[30] pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, #dbeafe 0%, #bae6fd 100%)'
              }}
            />
            <div
              className="absolute top-0 left-0 w-full flex items-center justify-center rounded-t-3xl z-[40]"
              style={{
                height: '60px',
                background: 'linear-gradient(135deg, #bbf7d0 0%, #a7f3d0 100%)',
                opacity: 0.95,
                boxSizing: 'border-box',
                pointerEvents: 'auto'
              }}
            />
            <div
              className="absolute top-0 left-0 w-full flex items-center justify-center rounded-t-3xl z-[50] pointer-events-none"
              style={{ height: '60px' }}
            >
              <h2 className="text-center font-semibold font-serif text-gray-700 text-[20px]" style={{ width: '100%' }}>
                Matriz de Prazos SAP
              </h2>
            </div>
            <div className="relative z-[30]">
              <TabelaMatriz dados={matriz} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
