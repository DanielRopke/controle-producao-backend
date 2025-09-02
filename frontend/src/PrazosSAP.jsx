// Gráfico de teste isolado para depuração de eventos
const testData = [
  { name: 'A', value: 12 },
  { name: 'B', value: 8 },
  { name: 'C', value: 15 },
];

function TestBarChart() {
  const [selected, setSelected] = useState(null);
  return (
    <div style={{ background: '#fff', padding: 16, marginBottom: 32, border: '2px solid red' }}>
      <h3>Gráfico de Teste (clique nas barras)</h3>
      <BarChart width={400} height={200} data={testData} style={{ userSelect: 'none' }}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="value">
          {testData.map((entry, idx) => (
            <Cell
              key={entry.name}
              fill={selected === idx ? 'red' : '#8884d8'}
              onClick={() => {
                alert('Barra clicada: ' + entry.name);
                setSelected(idx);
              }}
              style={{ cursor: 'pointer' }}
            />
          ))}
        </Bar>
      </BarChart>
    </div>
  );
}
import { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LabelList,
  Cell
} from 'recharts';
import { ChartContainer } from './components/ChartContainer';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';


function PrazosSAP() {
  const navigate = useNavigate();
  const [seccionais, setSeccionais] = useState([]);
  const [statusSapList, setStatusSapList] = useState([]);
  const [tiposList, setTiposList] = useState([]);
  const [mesesConclusaoList, setMesesConclusaoList] = useState([]);

  // Dados brutos dos gráficos
  const [graficoDataEner, setGraficoDataEner] = useState([]);
  const [graficoDataConc, setGraficoDataConc] = useState([]);
  const [graficoDataServico, setGraficoDataServico] = useState([]);
  const [graficoDataSeccionalRS, setGraficoDataSeccionalRS] = useState([]);
  const [matrizDados, setMatrizDados] = useState([]);


  // Filtros centralizados para filtro cruzado (modelo do lovable)
  const [activeFilters, setActiveFilters] = useState({
    statusEner: '',
    statusConc: '',
    motivo: '',
    seccional: '',
  });

  // Função para clique cruzado nos gráficos (modelo do lovable)
  const handleChartClick = (type, value) => {
    setActiveFilters(prev => {
      if (prev[type] === value) {
        return { ...prev, [type]: '' };
      }
      return { ...prev, [type]: value };
    });
  };

  // Filtros dropdowns (mantém visual)
  const [statusSapSelecionado, setStatusSapSelecionado] = useState(() => localStorage.getItem('statusSapSelecionado') || '');
  const [tipoSelecionado, setTipoSelecionado] = useState(() => localStorage.getItem('tipoSelecionado') || '');
  const [mesSelecionado, setMesSelecionado] = useState(() => localStorage.getItem('mesSelecionado') || '');
  const [seccionaisSelecionadas, setSeccionaisSelecionadas] = useState(() => {
    const saved = localStorage.getItem('seccionaisSelecionadas');
    return saved ? JSON.parse(saved) : [];
  });

  // Busca dados iniciais e listas para filtros
  // TESTE: Força dados de exemplo para isolar problema de evento/renderização
  useEffect(() => {
    setGraficoDataEner([
      { status: 'Fora do Prazo', count: 5 },
      { status: 'LIB /ENER', count: 10 },
      { status: 'Dentro do Prazo', count: 2 }
    ]);
    setGraficoDataConc([
      { status: 'Conc 1', count: 3 },
      { status: 'Conc 2', count: 7 }
    ]);
    setGraficoDataServico([
      { status: 'Motivo 1', count: 4 },
      { status: 'Motivo 2', count: 6 }
    ]);
    setGraficoDataSeccionalRS([
      { seccional: 'Sul', totalRS: 100, totalPEP: 2, scaledPEP: 200000 },
      { seccional: 'Litoral Sul', totalRS: 80, totalPEP: 1, scaledPEP: 100000 }
    ]);
    setMatrizDados([
      { pep: 'PEP1', prazo: '2025-01-01', dataConclusao: '2025-02-01', statusSap: 'Fora do Prazo', valor: 1000, seccional: 'Sul' },
      { pep: 'PEP2', prazo: '2025-03-01', dataConclusao: '2025-04-01', statusSap: 'LIB /ENER', valor: 2000, seccional: 'Litoral Sul' }
    ]);
    setSeccionais(['Sul', 'Litoral Sul']);
    setStatusSapList(['Fora do Prazo', 'LIB /ENER', 'Dentro do Prazo']);
    setTiposList(['Tipo 1', 'Tipo 2']);
    setMesesConclusaoList(['2025-01', '2025-02']);
  }, []);

  // Atualiza matriz com filtros aplicados
  useEffect(() => {
    localStorage.setItem('statusSapSelecionado', statusSapSelecionado);
    localStorage.setItem('tipoSelecionado', tipoSelecionado);
    localStorage.setItem('mesSelecionado', mesSelecionado);
    localStorage.setItem('seccionaisSelecionadas', JSON.stringify(seccionaisSelecionadas));

    const params = new URLSearchParams();
    if (seccionaisSelecionadas.length > 0) params.append('seccional', seccionaisSelecionadas.join(','));
    if (statusSapSelecionado) params.append('status_sap', statusSapSelecionado);
    if (tipoSelecionado) params.append('tipo', tipoSelecionado);
    if (mesSelecionado) params.append('mes', mesSelecionado);

    axios.get(`${API_BASE}/matriz-dados/?${params.toString()}`)
      .then(resp => setMatrizDados(resp.data))
      .catch(() => {});
  }, [seccionaisSelecionadas, statusSapSelecionado, tipoSelecionado, mesSelecionado]);

  // Função de clique cruzado nos gráficos
  const handleChartClick = (type, value) => {
    console.log('CLIQUE NA BARRA', { type, value }); // TESTE
    setActiveFilters(prev => {
      // Toggle: se já está filtrado, remove
      if (prev[type] === value) {
        return { ...prev, [type]: '' };
      }
      // Só permite um filtro por tipo
      return { ...prev, [type]: value };
    });
  };


  // Filtro cruzado real: ao clicar em qualquer barra, filtra todos os gráficos e a matriz (modelo do lovable)
  const dadosFiltrados = useMemo(() => {
    const { statusEner, statusConc, motivo, seccional } = activeFilters;

    // Filtrar matriz
    let matriz = matrizDados;
    if (statusEner) matriz = matriz.filter(item => item.statusSap === statusEner);
    if (statusConc) matriz = matriz.filter(item => item.statusSap === statusConc);
    if (motivo) matriz = matriz.filter(item => item.statusSap === motivo || item.status === motivo);
    if (seccional) matriz = matriz.filter(item => item.seccional === seccional);

    // ENER
    let ener = graficoDataEner;
    if (seccional) ener = ener.filter(item => item.seccional === seccional);
    if (statusConc) ener = ener.filter(item => item.status === statusConc);
    if (motivo) ener = ener.filter(item => item.status === motivo);
    if (statusEner) ener = ener.filter(item => item.status === statusEner);
    ener = Object.entries(ener.reduce((acc, curr) => {
      acc[curr.status] = (acc[curr.status] || 0) + curr.count;
      return acc;
    }, {})).map(([status, count]) => ({ status, count }));

    // CONC
    let conc = graficoDataConc;
    if (seccional) conc = conc.filter(item => item.seccional === seccional);
    if (statusEner) conc = conc.filter(item => item.status === statusEner);
    if (motivo) conc = conc.filter(item => item.status === motivo);
    if (statusConc) conc = conc.filter(item => item.status === statusConc);
    conc = Object.entries(conc.reduce((acc, curr) => {
      acc[curr.status] = (acc[curr.status] || 0) + curr.count;
      return acc;
    }, {})).map(([status, count]) => ({ status, count }));

    // Motivo
    let servico = graficoDataServico;
    if (statusEner) servico = servico.filter(item => item.status === statusEner);
    if (statusConc) servico = servico.filter(item => item.status === statusConc);
    if (motivo) servico = servico.filter(item => item.status === motivo);
    servico = servico.map(item => ({ ...item }));

    // Seccional RS
    let seccionalRS = graficoDataSeccionalRS;
    if (seccional) seccionalRS = seccionalRS.filter(item => item.seccional === seccional);

    return {
      matriz,
      ener,
      conc,
      servico,
      seccionalRS
    };
  }, [activeFilters, matrizDados, graficoDataEner, graficoDataConc, graficoDataServico, graficoDataSeccionalRS]);

  // Para manter compatibilidade visual
  const dadosGraficoEner = dadosFiltrados.ener;
  const dadosGraficoConc = dadosFiltrados.conc;
  const dadosGraficoServico = dadosFiltrados.servico;
  const dadosGraficoSeccionalRS = dadosFiltrados.seccionalRS;
  const matrizFiltrada = dadosFiltrados.matriz;

  // Formatação
  const formatarValorRS = (valor) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 });

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-100 to-gray-200">
      <TestBarChart />
      <header
         className="w-full sticky top-0 z-[9999] flex items-center justify-between px-6 shadow-md"
         style={{ backgroundColor: '#4ade80', height: '72px' }}

      >
        <button
         onClick={() => navigate('/obras')}
          className="botao-home ml-[12px]"  // adiciona essa classe
            title="Voltar para menu"
              aria-label="Voltar para menu"
              type="button"
              >
                <img src={logo} alt="Logo Empresa" className="logo-botao" />
              </button>


        <h1 className="flex-grow font-serif text-2xl font-bold text-center text-white">
          Controle de Produção - Prazos SAP
        </h1>
        <div style={{ width: 120 }} />
      </header>

      <div className="flex flex-1 gap-8 p-6">
        <nav className="flex flex-col w-[160px] bg-green-700 text-white px-[12px] pb-6 rounded-3xl shadow-inner overflow-auto sticky" style={{ top: '84px' }}>
          <div className="flex flex-col gap-[24px] w-full">
            {seccionais.map((s, idx) => (
              <button
                key={s}
                onClick={() => toggleSeccional(s)}
                className={`botao-home text-[18px] w-full
                  ${seccionaisSelecionadas.includes(s)
                    ? 'bg-white text-green-700 shadow-lg'
                    : 'bg-green-600 text-white hover:bg-green-500'}
                  ${idx === 0 ? 'mt-[24px]' : ''}`}
               >
                {s}
               </button>
            ))}
          </div>


          {/* Dropdowns novos: Status SAP, Tipo, Mês */}
          <select
            className="botao-home text-[18px] w-full text-center mt-[24px] cursor-pointer"
            value={statusSapSelecionado}
            onChange={e => setStatusSapSelecionado(e.target.value)}
          >
            <option value="">Status SAP</option>
            {statusSapList.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          <select
            className="botao-home text-[18px] w-full text-center mt-[24px] cursor-pointer"
            value={tipoSelecionado}
            onChange={e => setTipoSelecionado(e.target.value)}
          >
            <option value="">Tipo</option>
            {tiposList.map(tipo => (
              <option key={tipo} value={tipo}>{tipo}</option>
            ))}
          </select>

          <select
            className="botao-home text-[18px] w-full text-center mt-[24px] cursor-pointer"
            value={mesSelecionado}
            onChange={e => setMesSelecionado(e.target.value)}
          >
            <option value="">Mês</option>
            {mesesConclusaoList.map(mes => (
              <option key={mes} value={mes}>{mes}</option>
            ))}
          </select>
        </nav>

        <div className="flex flex-col flex-1 gap-8">
          <div className="flex gap-8">
            <div className="flex flex-col flex-1 gap-8">
              {[dadosGraficoEner, dadosGraficoConc].map((data, idx) => {
                // Ref para capturar o container do gráfico
                const cardRef = idx === 0 ? (el => window.graficoEnerCardRef = el) : undefined;
                return (
                  <div
                    key={idx}
                    ref={cardRef}
                    className="relative flex flex-col w-full h-full bg-white shadow-lg rounded-3xl"
                    style={idx === 0 ? {
                      border: '4px solid #60a5fa',
                      borderRadius: '1.5rem',
                      minHeight: 220,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-start',
                      boxSizing: 'border-box',
                      position: 'relative',
                      padding: '0',
                    } : {}}
                  >
                    {idx === 0 && (
                      <button
                        title="Copiar imagem do gráfico"
                        className="btn-copiar-grafico"
                        onClick={async e => {
                          e.stopPropagation();
                          const cardDiv = window.graficoEnerCardRef;
                          if (!cardDiv) return;
                          // Esconde o botão antes de capturar
                          const btn = cardDiv.querySelector('.btn-copiar-grafico');
                          if (btn) btn.style.visibility = 'hidden';
                          const html2canvas = (await import('html2canvas')).default;
                          html2canvas(cardDiv, {backgroundColor: null, useCORS: true, scale: 2, logging: false}).then((canvas) => {
                            // Mostra o botão novamente
                            if (btn) btn.style.visibility = 'visible';
                            canvas.toBlob((blob) => {
                              if (blob) {
                                const item = new window.ClipboardItem({ 'image/png': blob });
                                window.navigator.clipboard.write([item]);
                              }
                            });
                          });
                        }}
                        style={{ position: 'absolute', top: 12, right: 12, zIndex: 20, width: 32, height: 32, background: '#fff', borderRadius: 8, border: '2px solid #4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                      >
                        {/* Ícone clássico de copiar (duas folhas) */}
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="6" y="6" width="9" height="12" rx="2" fill="#bbf7d0" stroke="#22c55e" strokeWidth="1.5" />
                          <rect x="3" y="3" width="9" height="12" rx="2" fill="#fff" stroke="#22c55e" strokeWidth="1.2" />
                        </svg>
                      </button>
                    )}
                    <h2 className="text-center font-semibold font-serif text-gray-700 text-[20px] mt-2 mb-4" style={{margin: 0}}>
                      {idx === 0 ? 'Status ENER' : 'Status CONC'}
                    </h2>
                    <div className="flex flex-col flex-1 p-6">
                      <div style={{ width: '100%', height: '100%' }}>
                        <BarChart data={dadosFiltrados.ener} margin={{ top: 20, right: 30, left: 30, bottom: 40 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="status" tick={{ fill: '#4a4a4a' }} />
                          <YAxis hide />
                          <Tooltip />
                          <Bar dataKey="count" fill="#4ade80"
                            onClick={data => handleChartClick('statusEner', data.status)}
                            style={{ cursor: 'pointer' }}>
                            {dadosFiltrados.ener.map((entry, idx) => (
                              <Cell
                                key={`cell-ener-${idx}`}
                                fill={activeFilters.statusEner === entry.status ? 'red' : '#4ade80'}
                                stroke={activeFilters.statusEner === entry.status ? 'darkred' : 'none'}
                                strokeWidth={activeFilters.statusEner === entry.status ? 2 : 0}
                              />
                            ))}
                            <LabelList dataKey="count" position="top" fill="#333" fontSize={12} />
                          </Bar>
                        </BarChart>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col flex-1 gap-8">
              <div className="bg-white p-6 rounded-3xl shadow-lg h-[280px] flex flex-col">
                <h2 className="text-center font-semibold mb-4 font-serif text-gray-700 text-[20px]">
                  Comparativo por Seccional: R$ e Qtd PEP
                </h2>
                <ChartContainer config={{ totalRS: { label: 'R$', color: '#3182ce' }, scaledPEP: { label: 'PEP', color: '#4ade80' } }} style={{ width: '100%', height: '100%' }}>
                  <BarChart data={graficoDataSeccionalRS} margin={{ top: 20, right: 30, left: 30, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="seccional" tick={{ fill: '#4a4a4a' }} />
                    <YAxis hide />
                    <Tooltip
                      formatter={(value, name) => [
                        name === 'totalRS' ? formatarValorRS(value) : value,
                        name === 'totalRS' ? 'R$' : 'PEP',
                      ]}
                    />
          <Bar dataKey="totalRS" fill="#3182ce"
            onClick={data => handleChartClick('seccional', data.seccional)}
            style={{ cursor: 'pointer' }}>
            {dadosGraficoSeccionalRS.map((entry, idx) => (
              <Cell
                key={`cell-seccional-rs-${idx}`}
                fill={activeFilters.seccional === entry.seccional ? 'red' : '#3182ce'}
                stroke={activeFilters.seccional === entry.seccional ? 'darkred' : 'none'}
                strokeWidth={activeFilters.seccional === entry.seccional ? 2 : 0}
              />
            ))}
            <LabelList dataKey="totalRS" position="top" fill="#333" fontSize={12} />
          </Bar>
          <Bar dataKey="scaledPEP" fill="#4ade80"
            onClick={data => handleChartClick('seccional', data.seccional)}
            style={{ cursor: 'pointer' }}>
            {dadosGraficoSeccionalRS.map((entry, idx) => (
              <Cell
                key={`cell-seccional-pep-${idx}`}
                fill={activeFilters.seccional === entry.seccional ? 'red' : '#4ade80'}
                stroke={activeFilters.seccional === entry.seccional ? 'darkred' : 'none'}
                strokeWidth={activeFilters.seccional === entry.seccional ? 2 : 0}
              />
            ))}
            <LabelList dataKey="totalPEP" position="top" fill="#333" fontSize={12} />
          </Bar>
                  </BarChart>
                </ChartContainer>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-lg h-[280px] flex flex-col">
                <h2 className="text-center font-semibold mb-4 font-serif text-gray-700 text-[20px]">
                  Motivo de Não Fechado
                </h2>
                <ChartContainer config={{ count: { label: 'Quantidade', color: '#4ade80' } }} style={{ width: '100%', height: '100%' }}>
                  <BarChart data={dadosGraficoServico} margin={{ top: 20, right: 30, left: 30, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" tick={{ fill: '#4a4a4a' }} />
                    <YAxis hide />
                    <Tooltip />
          <Bar dataKey="count" fill="#4ade80"
            onClick={data => handleChartClick('motivo', data.status)}
            style={{ cursor: 'pointer' }}>
            {dadosGraficoServico.map((entry, idx) => (
              <Cell
                key={`cell-motivo-${idx}`}
                fill={activeFilters.motivo === entry.status ? 'red' : '#4ade80'}
                stroke={activeFilters.motivo === entry.status ? 'darkred' : 'none'}
                strokeWidth={activeFilters.motivo === entry.status ? 2 : 0}
              />
            ))}
            <LabelList dataKey="count" position="top" fill="#333" fontSize={12} />
          </Bar>
                  </BarChart>
                </ChartContainer>
              </div>
            </div>
          </div>

          <div className="w-full p-6 mt-10 overflow-auto bg-white shadow-lg rounded-3xl">
            <h2 className="text-center font-semibold mb-6 font-serif text-gray-700 text-[20px]">
              Matriz de Dados
            </h2>
            <table className="min-w-full text-sm text-left text-gray-700 border-collapse table-auto">
              <thead className="text-xs text-gray-600 uppercase bg-gray-100">
                <tr>
                  <th className="px-4 py-3 border border-gray-300">PEP</th>
                  <th className="px-4 py-3 border border-gray-300">Prazo</th>
                  <th className="px-4 py-3 border border-gray-300">Data Conclusão</th>
                  <th className="px-4 py-3 border border-gray-300">Status SAP</th>
                  <th className="px-4 py-3 border border-gray-300">R$</th>
                </tr>
              </thead>
              <tbody>
                {matrizFiltrada.length > 0 ? (
                  matrizFiltrada.map((item, idx) => (
                    <tr key={idx} className="border border-gray-300 hover:bg-green-50">
                      <td className="px-4 py-2">{item.pep}</td>
                      <td className="px-4 py-2">{item.prazo}</td>
                      <td className="px-4 py-2">{item.dataConclusao}</td>
                      <td className="px-4 py-2">{item.statusSap}</td>
                      <td className="px-4 py-2">{item.valor}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-4 text-center text-gray-400">
                      Nenhum dado disponível
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrazosSAP
