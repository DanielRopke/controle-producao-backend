

import { useNavigate } from 'react-router-dom'
import { SidebarFiltros } from './components/SidebarFiltros'
// import { GraficoBarras } from './components/GraficoBarras'
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
  LabelList,
  Cell
} from 'recharts'
import { useState, useMemo } from 'react';


export default function PrazosSAP() {
  const navigate = useNavigate();
  const {
    seccionaisSelecionadas,
    toggleSeccional,
    statusSap,
    setStatusSap,
    tipo,
    setTipo,
    mes,
    setMes
  } = useFiltros();
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
  } = useDadosGraficos({ seccionais: seccionaisSelecionadas, statusSap, tipo, mes });

  // Estado de filtros ativos para filtragem cruzada
  const [activeFilters, setActiveFilters] = useState<{
    statusENER?: string;
    statusCONC?: string;
    comparison?: string; // seccional
    reasons?: string;    // motivo/status serviço
  }>({});

  // Função para clique nas colunas dos gráficos
  function handleChartClick(
    chartType: 'statusENER'|'statusCONC'|'comparison'|'reasons',
    dataPoint: { payload?: Record<string, unknown>; [k: string]: unknown }
  ) {
    const payload = dataPoint
      ? (('payload' in dataPoint && dataPoint.payload) ? (dataPoint.payload as Record<string, unknown>) : (dataPoint as Record<string, unknown>))
      : {};
    const value = chartType === 'comparison'
      ? String(payload['seccional'] ?? '')
      : String(payload['status'] ?? payload['name'] ?? '');
    if (!value) return;
    setActiveFilters(prev => ({
      ...prev,
      [chartType]: prev[chartType] === value ? undefined : value
    }));
  }

  // Lógica de filtragem cruzada (igual ao lovable)
  const {
    dadosEner,
    dadosConc,
    dadosServico,
    graficoSeccionalRSOrdenado,
    matrizFiltrada
  } = useMemo(() => {
    // Base de seccionais a considerar (já vem filtradas por seccionaisSelecionadas via hook)
    const allSeccsSet = new Set<string>(
      (Array.isArray(graficoSeccionalRS) ? graficoSeccionalRS : []).map(g => g.seccional)
    );

    // Conjuntos derivados dos filtros ativos
    const sets: Array<Set<string>> = [];

    if (activeFilters.comparison) {
      sets.push(new Set([activeFilters.comparison]));
    }
    if (activeFilters.statusENER) {
      const s = new Set(
        graficoEner.filter(i => i.status === activeFilters.statusENER).map(i => i.seccional)
      );
      if (s.size) sets.push(s);
    }
    if (activeFilters.statusCONC) {
      const s = new Set(
        graficoConc.filter(i => i.status === activeFilters.statusCONC).map(i => i.seccional)
      );
      if (s.size) sets.push(s);
    }
    if (activeFilters.reasons) {
      const s = new Set(
        graficoServico.filter(i => i.status === activeFilters.reasons).map(i => i.seccional)
      );
      if (s.size) sets.push(s);
    }

    // Interseção dos conjuntos; se não houver, usa todas as seccionais disponíveis
    let selectedSeccs: Set<string> = new Set(allSeccsSet);
    if (sets.length) {
      selectedSeccs = new Set(
        [...allSeccsSet].filter(s => sets.every(seti => seti.has(s)))
      );
    }

    const selectedSeccsArr = [...selectedSeccs];

    // Processa dados agregados por status considerando seccionais selecionadas
    let dadosEner = processarDados(graficoEner, false, { seccionais: selectedSeccsArr }).slice();
    let dadosConc = processarDados(graficoConc, true, { seccionais: selectedSeccsArr }).slice();
    let dadosServico = processarDados(graficoServico, false, { seccionais: selectedSeccsArr }).slice();
  const graficoSeccionalRSOrdenado = (Array.isArray(graficoSeccionalRS) ? graficoSeccionalRS : [])
      .filter(item => selectedSeccs.has(item.seccional))
      .slice()
      .sort((a, b) => (b.totalRS ?? 0) - (a.totalRS ?? 0));
  const matrizFiltrada = matriz.filter(item => selectedSeccs.has(item.seccional));

    // Ordenação
    dadosEner = dadosEner.sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
    dadosConc = dadosConc.sort((a, b) => (b.count ?? 0) - (a.count ?? 0));
    dadosServico = dadosServico.sort((a, b) => (b.count ?? 0) - (a.count ?? 0));

    return { dadosEner, dadosConc, dadosServico, graficoSeccionalRSOrdenado, matrizFiltrada };
  }, [graficoEner, graficoConc, graficoServico, graficoSeccionalRS, matriz, activeFilters]);

  const formatarValorRS = (valor) =>
    valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 });

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
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={dadosEner} margin={{ top: 20, right: 30, left: 30, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" tick={{ fill: '#4a4a4a' }} />
                    <YAxis hide />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3182ce" onClick={data => handleChartClick('statusENER', data)}>
                      {dadosEner.map((entry, idx) => (
                        <Cell key={idx} fill={activeFilters.statusENER === entry.status ? '#ef4444' : '#3182ce'} />
                      ))}
                      <LabelList dataKey="count" position="top" fill="#333" fontSize={12} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={{ height: '16px' }} />
              <div className="z-[10]">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={dadosConc} margin={{ top: 20, right: 30, left: 30, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" tick={{ fill: '#4a4a4a' }} />
                    <YAxis hide />
                    <Tooltip />
                    <Bar dataKey="count" fill="#6366f1" onClick={data => handleChartClick('statusCONC', data)}>
                      {dadosConc.map((entry, idx) => (
                        <Cell key={idx} fill={activeFilters.statusCONC === entry.status ? '#ef4444' : '#6366f1'} />
                      ))}
                      <LabelList dataKey="count" position="top" fill="#333" fontSize={12} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
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
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="seccional" tick={{ fill: '#4a4a4a' }} />
                    <YAxis hide />
                    <Tooltip
                      formatter={(value, name) => [
                        name === 'totalRS' ? formatarValorRS(value) : value,
                        name === 'totalRS' ? 'R$' : 'PEP',
                      ]}
                    />
                    <Bar dataKey="totalRS" fill="#3182ce" onClick={data => handleChartClick('comparison', data)}>
                      {graficoSeccionalRSOrdenado.map((entry, idx) => (
                        <Cell key={idx} fill={activeFilters.comparison === entry.seccional ? '#ef4444' : '#3182ce'} />
                      ))}
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
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={dadosServico} margin={{ top: 20, right: 30, left: 30, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="status" tick={{ fill: '#4a4a4a' }} />
                        <YAxis hide />
                        <Tooltip />
                        <Bar dataKey="count" fill="#4ade80" onClick={data => handleChartClick('reasons', data)}>
                          {dadosServico.map((entry, idx) => (
                            <Cell key={idx} fill={activeFilters.reasons === entry.status ? '#ef4444' : '#4ade80'} />
                          ))}
                          <LabelList dataKey="count" position="top" fill="#333" fontSize={12} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
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
              <TabelaMatriz dados={matrizFiltrada} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
