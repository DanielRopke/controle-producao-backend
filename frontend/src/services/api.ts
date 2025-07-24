
import axios from 'axios'

// Força uso do backend do Render para todas as chamadas
const API_BASE = import.meta.env.VITE_API_BASE;

export const api = {
  getSeccionais: () => axios.get<string[]>(`${API_BASE}/seccionais/`),
  getStatusSAP: () => axios.get<string[]>(`${API_BASE}/status-sap-unicos/`),
  getTipos: () => axios.get<string[]>(`${API_BASE}/tipos-unicos/`),
  getMesesConclusao: () => axios.get<string[]>(`${API_BASE}/meses-conclusao/`),

  getGraficoEner: () => axios.get<Record<string, Record<string, number>>>(`${API_BASE}/status-ener-pep/`),
  getGraficoConc: () => axios.get<Record<string, Record<string, number>>>(`${API_BASE}/status-conc-pep/`),
  getGraficoServico: (params?: URLSearchParams) => {
    const url = params && params.toString()
      ? `${API_BASE}/status-servico-contagem/?${params.toString()}`
      : `${API_BASE}/status-servico-contagem/`;
    return axios.get<Record<string, Record<string, number>>>(url);
  },
  getGraficoSeccionalRS: () => axios.get<Record<string, { valor: number; pep_count: number }>>(`${API_BASE}/seccional-rs-pep/`),

  getMatrizDados: (params: URLSearchParams) => axios.get(`${API_BASE}/matriz-dados/?${params.toString()}`)
}
