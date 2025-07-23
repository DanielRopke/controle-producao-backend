
import axios from 'axios'

// Alternância automática entre local e hospedado
const API_BASE =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:8000/api'
    : import.meta.env.VITE_API_BASE;

export const api = {
  getSeccionais: () => axios.get<string[]>(`${API_BASE}/seccionais/`),
  getStatusSAP: () => axios.get<string[]>(`${API_BASE}/status-sap-unicos/`),
  getTipos: () => axios.get<string[]>(`${API_BASE}/tipos-unicos/`),
  getMesesConclusao: () => axios.get<string[]>(`${API_BASE}/meses-conclusao/`),

  getGraficoEner: () => axios.get<Record<string, Record<string, number>>>(`${API_BASE}/status-ener-pep/`),
  getGraficoConc: () => axios.get<Record<string, Record<string, number>>>(`${API_BASE}/status-conc-pep/`),
  getGraficoServico: () => axios.get<Record<string, number>>(`${API_BASE}/status-servico-contagem/`),
  getGraficoSeccionalRS: () => axios.get<Record<string, { valor: number; pep_count: number }>>(`${API_BASE}/seccional-rs-pep/`),

  getMatrizDados: (params: URLSearchParams) => axios.get(`${API_BASE}/matriz-dados/?${params.toString()}`)
}
