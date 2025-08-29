import axios from 'axios'

// Descobre a base da API:
// 1) Usa VITE_API_BASE_URL se definida
// 2) Se não, tenta produção no Render
// 3) Por fim, localhost:8000 (Django)
const DEFAULTS = {
  prod: 'https://controle-producao-backend.onrender.com',
  local: 'http://localhost:8000',
}

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.toString().replace(/\/$/, '') ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? DEFAULTS.local
    : DEFAULTS.prod)

export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  withCredentials: false,
  // headers: { Authorization: `Bearer ${token}` } // caso use JWT
})

// Tipos utilitários
export type MatrizItem = {
  pep: string
  prazo: string
  dataConclusao: string
  statusSap: string
  valor: string | number
  seccional: string
  tipo: string
  statusEner?: string
  statusConc?: string
  statusServico?: string
}

// Endpoints simples
export const getExemplo = () => api.get<{ mensagem: string }>(`/exemplo/`)
export const getGeral = () => api.get<unknown[]>(`/geral/`)
export const getProgramacao = () => api.get<unknown[]>(`/programacao/`)
export const getCarteira = () => api.get<unknown[]>(`/carteira/`)
export const getMeta = () => api.get<unknown[]>(`/meta/`)
export const getDefeitos = () => api.get<unknown[]>(`/defeitos/`)
export const getSeccionais = () => api.get<string[]>(`/seccionais/`)
export const getStatusSapUnicos = () => api.get<string[]>(`/status-sap-unicos/`)
export const getTiposUnicos = () => api.get<string[]>(`/tipos-unicos/`)
export const getMesesConclusao = () => api.get<string[]>(`/meses-conclusao/`)

// Endpoints com parâmetros via querystring
export const getCarteiraPorSeccional = (seccional: string) =>
  api.get<unknown[]>(`/carteira_por_seccional/`, { params: { seccional } })

export const getStatusEnerPep = (params?: {
  seccional?: string
  status_sap?: string
  tipo?: string
  mes?: string
  data_inicio?: string
  data_fim?: string
}) => api.get<Record<string, Record<string, number>>>(`/status-ener-pep/`, { params })
export const getStatusConcPep = (params?: {
  seccional?: string
  status_sap?: string
  tipo?: string
  mes?: string
  data_inicio?: string
  data_fim?: string
}) => api.get<Record<string, Record<string, number>>>(`/status-conc-pep/`, { params })

export const getStatusServicoContagem = (params: {
  seccional?: string // CSV ex: "Sul,Litoral Sul"
  status_sap?: string // CSV
  tipo?: string // CSV
  mes?: string // YYYY-MM
  data_inicio?: string // DD/MM/YYYY
  data_fim?: string // DD/MM/YYYY
}) => api.get<Record<string, Record<string, number>>>(`/status-servico-contagem/`, { params })

export const getSeccionalRsPep = (params: {
  seccional?: string // CSV
  status_sap?: string // CSV
  tipo?: string // CSV
  mes?: string // YYYY-MM
  data_inicio?: string // DD/MM/YYYY
  data_fim?: string // DD/MM/YYYY
}) => api.get<Record<string, { valor: number; pep_count: number }>>(`/seccional-rs-pep/`, { params })

export const getMatrizDados = (params: {
  seccional?: string // CSV
  status_sap?: string // CSV
  tipo?: string // CSV
  mes?: string // YYYY-MM
  data_inicio?: string // DD/MM/YYYY
  data_fim?: string // DD/MM/YYYY
  status_ener?: string // CSV
  status_conc?: string // CSV
  status_servico?: string // CSV
}) => api.get<MatrizItem[]>(`/matriz-dados/`, { params })

// Helper para saber qual base está ativa (útil em logs/debug)
export const getApiBase = () => `${BASE_URL}/api`
