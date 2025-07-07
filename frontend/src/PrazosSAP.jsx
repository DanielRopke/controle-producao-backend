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

interface GraficoItem {
  status: string
  seccional: string
  count: number
}

interface SeccionalData {
  seccional: string
  totalRS: number
  totalPEP: number
  scaledPEP?: number
}

interface MatrizItem {
  pep: string
  prazo: string
  dataConclusao: string
  statusSap: string
  valor: string
  seccional: string
  tipo: string
  mesConclusao: string
}

function PrazosSAP() {
  const navigate = useNavigate()
  const [seccionais, setSeccionais] = useState<string[]>([])
  const [statusSapList, setStatusSapList] = useState<string[]>([])
  const [tiposList, setTiposList] = useState<string[]>([])
  const [mesesConclusaoList, setMesesConclusaoList] = useState<string[]>([])

  const [statusSapSelecionado, setStatusSapSelecionado] = useState<string>(() => localStorage.getItem('statusSapSelecionado') || '')
  const [tipoSelecionado, setTipoSelecionado] = useState<string>(() => localStorage.getItem('tipoSelecionado') || '')
  const [mesSelecionado, setMesSelecionado] = useState<string>(() => localStorage.getItem('mesSelecionado') || '')
  const [seccionaisSelecionadas, setSeccionaisSelecionadas] = useState<string[]>(() => {
    const saved = localStorage.getItem('seccionaisSelecionadas')
    return saved ? JSON.parse(saved) : []
  })

  const [graficoDataEner, setGraficoDataEner] = useState<GraficoItem[]>([])
  const [graficoDataConc, setGraficoDataConc] = useState<GraficoItem[]>([])
  const [graficoDataServico, setGraficoDataServico] = useState<{ status: string, count: number }[]>([])
  const [graficoDataSeccionalRS, setGraficoDataSeccionalRS] = useState<SeccionalData[]>([])
  const [matrizDados, setMatrizDados] = useState<MatrizItem[]>([])

  // Busca dados iniciais e listas para filtros
  useEffect(() => {
    axios.get("http://127.0.0.1:8000/api/seccionais/")
      .then(resp => setSeccionais(resp.data))
      .catch(() => {})

    axios.get("http://127.0.0.1:8000/api/status-sap-unicos/")
      .then(resp => setStatusSapList(resp.data))
      .catch(() => {})

    axios.get("http://127.0.0.1:8000/api/tipos-unicos/")
      .then(resp => setTiposList(resp.data))
      .catch(() => {})

    axios.get("http://127.0.0.1:8000/api/meses-conclusao/")
      .then(resp => setMesesConclusaoList(resp.data))
      .catch(() => {})

    axios.get("http://127.0.0.1:8000/api/status-ener-pep/")
      .then(resp => {
        const todos = Object.entries(resp.data).flatMap(([status, obj]: any) =>
          Object.entries(obj).map(([seccional, count]) => ({
            status,
            seccional,
            count: Number(count) || 0
          }))
        )
        setGraficoDataEner(todos)
      })
      .catch(() => {})

    axios.get("http://127.0.0.1:8000/api/status-conc-pep/")
      .then(resp => {
        const todos = Object.entries(resp.data).flatMap(([status, obj]: any) =>
          Object.entries(obj).map(([seccional, count]) => ({
            status,
            seccional,
            count: Number(count) || 0
          }))
        )
        setGraficoDataConc(todos)
      })
      .catch(() => {})

    axios.get("http://127.0.0.1:8000/api/status-servico-contagem/")
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

    axios.get("http://127.0.0.1:8000/api/seccional-rs-pep/")
      .then(resp => {
        const dadosFiltrados = Object.entries(resp.data)
          .filter(([seccional]) => seccional !== '#N/A')
          .map(([seccional, valores]: any) => ({
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

    axios.get(`http://127.0.0.1:8000/api/matriz-dados/?${params.toString()}`)
      .then(resp => setMatrizDados(resp.data))
      .catch(() => {})
  }, [seccionaisSelecionadas, statusSapSelecionado, tipoSelecionado, mesSelecionado])

  const toggleSeccional = (seccional: string) => {
    setSeccionaisSelecionadas(prev =>
      prev.includes(seccional)
        ? prev.filter(s => s !== seccional)
        : [...prev, seccional]
    )
  }

  const processarDados = (dados: GraficoItem[], ignorarFechada = false) => {
    return Object.entries(
      dados.filter(item => {
        const seccionalMatch = seccionaisSelecionadas.length === 0 || seccionaisSelecionadas.includes(item.seccional)
        const statusValido = ignorarFechada ? !["fechada", "fechado"].includes(item.status.toLowerCase()) : true
        return seccionalMatch && statusValido
      }).reduce((acc: Record<string, number>, curr) => {
        acc[curr.status] = (acc[curr.status] || 0) + curr.count
        return acc
      }, {}))
      .map(([status, count]) => ({ status, count }))
  }

  const dadosGraficoEner = processarDados(graficoDataEner)
  const dadosGraficoConc = processarDados(graficoDataConc, true)

  const formatarValorRS = (valor: number) =>
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
              {[dadosGraficoEner, dadosGraficoConc].map((data, idx) => (
                <div key={idx} className="bg-white p-6 rounded-3xl shadow-lg h-[280px] flex flex-col">
                  <h2 className="text-center font-semibold mb-4 font-serif text-gray-700 text-[20px]">
                    {idx === 0 ? 'Status ENER' : 'Status CONC'}
                  </h2>
                  <div className="flex-1">
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
              ))}
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
