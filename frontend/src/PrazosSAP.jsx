import { useEffect, useState } from 'react'
import axios from 'axios'
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
import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'

function PrazosSAP() {
  const navigate = useNavigate()
  const [seccionais, setSeccionais] = useState([])
  const [statusSapList, setStatusSapList] = useState([])
  const [tiposList, setTiposList] = useState([])
  const [mesesConclusaoList, setMesesConclusaoList] = useState([])

  const [statusSapSelecionado, setStatusSapSelecionado] = useState(() => localStorage.getItem('statusSapSelecionado') || '')
  const [tipoSelecionado, setTipoSelecionado] = useState(() => localStorage.getItem('tipoSelecionado') || '')
  const [mesSelecionado, setMesSelecionado] = useState(() => localStorage.getItem('mesSelecionado') || '')
  const [seccionaisSelecionadas, setSeccionaisSelecionadas] = useState(() => {
    const saved = localStorage.getItem('seccionaisSelecionadas')
    return saved ? JSON.parse(saved) : []
  })

  const [graficoDataEner, setGraficoDataEner] = useState([])
  const [graficoDataConc, setGraficoDataConc] = useState([])
  const [graficoDataServico, setGraficoDataServico] = useState([])
  const [graficoDataSeccionalRS, setGraficoDataSeccionalRS] = useState([])
  const [matrizDados, setMatrizDados] = useState([])

  // Busca dados iniciais e listas para filtros
  const API_BASE = import.meta.env.VITE_API_URL;
  useEffect(() => {
    axios.get(`${API_BASE}/seccionais/`)
      .then(resp => setSeccionais(resp.data))
      .catch(() => {})

    axios.get(`${API_BASE}/status-sap-unicos/`)
      .then(resp => setStatusSapList(resp.data))
      .catch(() => {})

    axios.get(`${API_BASE}/tipos-unicos/`)
      .then(resp => setTiposList(resp.data))
      .catch(() => {})

    axios.get(`${API_BASE}/meses-conclusao/`)
      .then(resp => setMesesConclusaoList(resp.data))
      .catch(() => {})

    axios.get(`${API_BASE}/status-ener-pep/`)
      .then(resp => {
        const todos = Object.entries(resp.data).flatMap(([status, obj]) =>
          Object.entries(obj).map(([seccional, count]) => ({
            status,
            seccional,
            count: Number(count) || 0
          }))
        )
        setGraficoDataEner(todos)
      })
      .catch(() => {})

    axios.get(`${API_BASE}/status-conc-pep/`)
      .then(resp => {
        const todos = Object.entries(resp.data).flatMap(([status, obj]) =>
          Object.entries(obj).map(([seccional, count]) => ({
            status,
            seccional,
            count: Number(count) || 0
          }))
        )
        setGraficoDataConc(todos)
      })
      .catch(() => {})

    axios.get(`${API_BASE}/status-servico-contagem/`)
      .then(resp => {
        const servico = Object.entries(resp.data)
          .filter(([status]) => status.trim() !== "" && status.toLowerCase() !== "vazio")
          .map(([status, count]) => ({
            status,
            count: Number(count) || 0
          }))
        setGraficoDataServico(servico)
      })
      .catch(() => {})

    axios.get(`${API_BASE}/seccional-rs-pep/`)
      .then(resp => {
        const dadosFiltrados = Object.entries(resp.data)
          .filter(([seccional]) => seccional !== '#N/A')
          .map(([seccional, valores]) => ({
            seccional,
            totalRS: Number(valores.valor.toFixed(0)),
            totalPEP: valores.pep_count,
            scaledPEP: valores.pep_count * 100000
          }))
        setGraficoDataSeccionalRS(dadosFiltrados)
      })
      .catch(() => {})
  }, [])

  // Atualiza matriz com filtros aplicados
  useEffect(() => {
    // Salva filtros no localStorage para persistência
    localStorage.setItem('statusSapSelecionado', statusSapSelecionado)
    localStorage.setItem('tipoSelecionado', tipoSelecionado)
    localStorage.setItem('mesSelecionado', mesSelecionado)
    localStorage.setItem('seccionaisSelecionadas', JSON.stringify(seccionaisSelecionadas))

    const params = new URLSearchParams()
    if (seccionaisSelecionadas.length > 0) params.append('seccional', seccionaisSelecionadas.join(','))
    if (statusSapSelecionado) params.append('status_sap', statusSapSelecionado)
    if (tipoSelecionado) params.append('tipo', tipoSelecionado)
    if (mesSelecionado) params.append('mes', mesSelecionado)

    axios.get(`${API_BASE}/matriz-dados/?${params.toString()}`)
      .then(resp => setMatrizDados(resp.data))
      .catch(() => {})
  }, [seccionaisSelecionadas, statusSapSelecionado, tipoSelecionado, mesSelecionado])

  const toggleSeccional = (seccional) => {
    setSeccionaisSelecionadas(prev =>
      prev.includes(seccional)
        ? prev.filter(s => s !== seccional)
        : [...prev, seccional]
    )
  }

  const processarDados = (dados, ignorarFechada = false) => {
    return Object.entries(
      dados.filter(item => {
        const seccionalMatch = seccionaisSelecionadas.length === 0 || seccionaisSelecionadas.includes(item.seccional)
        const statusValido = ignorarFechada ? !["fechada", "fechado"].includes(item.status.toLowerCase()) : true
        return seccionalMatch && statusValido
      }).reduce((acc, curr) => {
        acc[curr.status] = (acc[curr.status] || 0) + curr.count
        return acc
      }, {}))
      .map(([status, count]) => ({ status, count }))
  }

  const dadosGraficoEner = processarDados(graficoDataEner)
  const dadosGraficoConc = processarDados(graficoDataConc, true)

  const formatarValorRS = (valor) =>
    valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-100 to-gray-200">
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


        <h1 className="text-white text-2xl font-bold font-serif text-center flex-grow">
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
                    className="bg-white rounded-3xl shadow-lg flex flex-col relative h-full w-full"
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
                    <div className="flex-1 p-6 flex flex-col">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 20, right: 30, left: 30, bottom: 40 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="status" tick={{ fill: '#4a4a4a' }} />
                          <YAxis hide />
                          <Tooltip />
                          <Bar dataKey="count" fill="#4ade80">
                            <LabelList dataKey="count" position="top" fill="#333" fontSize={12} />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
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
                <ResponsiveContainer width="100%" height="100%">
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
                    <Bar dataKey="totalRS" fill="#3182ce">
                      <LabelList dataKey="totalRS" position="top" fill="#333" fontSize={12} />
                    </Bar>
                    <Bar dataKey="scaledPEP" fill="#4ade80">
                      <LabelList dataKey="totalPEP" position="top" fill="#333" fontSize={12} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-lg h-[280px] flex flex-col">
                <h2 className="text-center font-semibold mb-4 font-serif text-gray-700 text-[20px]">
                  Motivo de Não Fechado
                </h2>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={graficoDataServico} margin={{ top: 20, right: 30, left: 30, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" tick={{ fill: '#4a4a4a' }} />
                    <YAxis hide />
                    <Tooltip />
                    <Bar dataKey="count" fill="#4ade80">
                      <LabelList dataKey="count" position="top" fill="#333" fontSize={12} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="mt-10 bg-white rounded-3xl shadow-lg p-6 w-full overflow-auto">
            <h2 className="text-center font-semibold mb-6 font-serif text-gray-700 text-[20px]">
              Matriz de Dados
            </h2>
            <table className="min-w-full table-auto text-sm text-left text-gray-700 border-collapse">
              <thead className="bg-gray-100 text-xs uppercase text-gray-600">
                <tr>
                  <th className="py-3 px-4 border border-gray-300">PEP</th>
                  <th className="py-3 px-4 border border-gray-300">Prazo</th>
                  <th className="py-3 px-4 border border-gray-300">Data Conclusão</th>
                  <th className="py-3 px-4 border border-gray-300">Status SAP</th>
                  <th className="py-3 px-4 border border-gray-300">R$</th>
                </tr>
              </thead>
              <tbody>
                {matrizDados.length > 0 ? (
                  matrizDados.map((item, idx) => (
                    <tr key={idx} className="hover:bg-green-50 border border-gray-300">
                      <td className="py-2 px-4">{item.pep}</td>
                      <td className="py-2 px-4">{item.prazo}</td>
                      <td className="py-2 px-4">{item.dataConclusao}</td>
                      <td className="py-2 px-4">{item.statusSap}</td>
                      <td className="py-2 px-4">{item.valor}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center text-gray-400 py-4">
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
