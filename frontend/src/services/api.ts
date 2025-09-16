
import axios from 'axios'

// Base do backend (ex: https://controle-producao-backend.onrender.com/api)
const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:8000/api').replace(/\/$/, '')

// ------------------ Tipos ------------------
export interface MatrixRowApi {
  pep: string
  prazo: string
  dataConclusao: string
  statusSap: string
  valor: string | number
  seccional: string
  tipo: string
  // Campos opcionais suportados por páginas que usam produção antiga
  statusEner?: string
  statusConc?: string
  statusServico?: string
}
export interface DashboardAggregated {
  regions: string[]
  statusENER: { name: string; value: number }[]
  statusCONC: { name: string; value: number }[]
  comparison: { name: string; value: number; qtd: number }[]
  reasons: { name: string; value: number }[]
  matrix: { pep: string; prazo: string; dataConclusao: string; status: string; rs: number }[]
}
export interface BaseFilters { seccional?: string; statusSap?: string; tipo?: string; mes?: string; dataInicio?: string; dataFim?: string }
// Tipos de auth/cadastro
export interface RegisterPayload {
  username: string
  email: string
  matricula: string
  password: string
}

// Filtros adicionais (a API atual pode não suportar — usados para lógica local de cross-filter)
export interface ExtendedFilters extends BaseFilters { statusEner?: string; statusConc?: string; motivo?: string }

// ------------------ Helpers ------------------
function parseNumber(v: string | number | null | undefined): number {
  if (v == null) return 0
  if (typeof v === 'number') return v
  const cleaned = v.replace(/R\$/i, '').replace(/\./g, '').replace(/,/g, '.').trim()
  const n = parseFloat(cleaned)
  return Number.isNaN(n) ? 0 : n
}
function buildParams(f: BaseFilters | ExtendedFilters): Record<string,string> {
  const p: Record<string,string> = {}
  if (f.seccional) p.seccional = f.seccional
  if (f.statusSap) p.status_sap = f.statusSap
  if (f.tipo) p.tipo = f.tipo
  if (f.mes) p.mes = f.mes
  if (f.dataInicio) p.data_inicio = f.dataInicio
  if (f.dataFim) p.data_fim = f.dataFim
  // Campos extra ignorados pelo backend atual: statusEner, statusConc, motivo
  return p
}

// Interceptor: injeta Authorization se houver token no localStorage,
// mas evita anexar em rotas de autenticação (/token e /token/refresh)
axios.interceptors.request.use((config) => {
  const url = (config.url || '').toString()
  // Não anexar Authorization para endpoints públicos de auth
  const isPublicAuth = /\/token\/?$|\/token\/refresh\/?$|\/auth\/(register|verify-email|resend-confirmation)\/?$/.test(url)
  if (!isPublicAuth) {
    const token = localStorage.getItem('jwt_access')
    if (token) {
      config.headers = config.headers || {}
      config.headers['Authorization'] = `Bearer ${token}`
    }
  } else if (config.headers && 'Authorization' in config.headers) {
    // Garantir que não vai nenhum header Authorization por engano
    delete (config.headers as Record<string, unknown>)['Authorization']
  }
  return config
})

// Interceptor de respostas: trata 401 globalmente (sessão expirada)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    if (status === 401) {
        // Só tratar 401s do backend da aplicação; ignorar 401s vindos de terceiros (ex: docs.google.com)
        try {
          const reqUrl = error?.config?.url ? String(error.config.url) : ''
          const isBackendCall = reqUrl.startsWith(API_BASE) || reqUrl.startsWith('/api') || reqUrl.indexOf(API_BASE) >= 0
          if (!isBackendCall) {
            return Promise.reject(error)
          }
        } catch {
              // se não conseguimos determinar, prosseguir com tratamento por segurança
            }

        try {
          localStorage.removeItem('jwt_access')
          localStorage.removeItem('jwt_refresh')
        } catch { /* ignore storage errors */ }
        // Redireciona para login com flag de sessão expirada
        if (typeof window !== 'undefined') {
          const current = window.location.pathname + window.location.search
          const qp = new URLSearchParams({ expired: '1', next: current })
          window.location.assign(`/login?${qp.toString()}`)
        }
    }
    return Promise.reject(error)
  }
)

async function get<T>(path: string, params?: Record<string,string>): Promise<T> {
  const res = await axios.get<T>(`${API_BASE}${path}`, { params })
  return res.data
}

// ------------------ Endpoints raw ------------------
export const api = {
  getSeccionais: () => get<string[]>('/seccionais/'),
  getStatusSAP: () => get<string[]>('/status-sap-unicos/'),
  getTipos: () => get<string[]>('/tipos-unicos/'),
  getMesesConclusao: () => get<string[]>('/meses-conclusao/'),
  getGraficoEner: () => get<Record<string, Record<string, number>>>('/status-ener-pep/'),
  getGraficoConc: () => get<Record<string, Record<string, number>>>('/status-conc-pep/'),
  getGraficoServico: (filters?: BaseFilters) => get<Record<string, Record<string, number>>>('/status-servico-contagem/', filters ? buildParams(filters) : undefined),
  getGraficoSeccionalRS: (filters?: BaseFilters) => get<Record<string, { valor: number; pep_count: number }>>('/seccional-rs-pep/', filters ? buildParams(filters) : undefined),
  getMatrizDados: (filters?: BaseFilters) => get<MatrixRowApi[]>('/matriz-dados/', filters ? buildParams(filters) : undefined),
  // Auth
  register: async (payload: RegisterPayload) => {
    const res = await axios.post(`${API_BASE}/auth/register`, payload)
    return res.data as { message: string }
  },
  verifyEmail: async (uid: string, token: string) => {
    const res = await axios.post(`${API_BASE}/auth/verify-email`, { uid, token })
    return res.data as { message: string }
  },
  resendConfirmation: async (email: string, timer_running?: boolean) => {
    const res = await axios.post(`${API_BASE}/auth/resend-confirmation`, { email, timer_running })
    return res.data as { message: string }
  }
  ,
  requestPasswordReset: async (identifier: string) => {
    const res = await axios.post(`${API_BASE}/auth/password-reset`, { identifier })
    return res.data as { message: string }
  }
  ,
  requestPasswordResetConfirm: async (uid: string, token: string, new_password: string) => {
    const res = await axios.post(`${API_BASE}/auth/password-reset-confirm`, { uid, token, new_password })
    return res.data as { message: string }
  }
  ,
  checkEmail: async (email: string) => {
    const res = await axios.post(`${API_BASE}/auth/check-email`, { email })
    return res.data as { exists: boolean; is_active: boolean }
  }
}

// Check email existence / status (used by Cadastro to decide button label)

// ------------------ Agregação para Dashboard ------------------
export async function loadDashboardData(filters: BaseFilters | ExtendedFilters = {}): Promise<DashboardAggregated> {
  const [regions, statusEnerRaw, statusConcRaw, seccionalRSRaw, statusServicoRaw, matriz] = await Promise.all([
    api.getSeccionais().catch(()=>[]),
    api.getGraficoEner().catch(()=>({})),
    api.getGraficoConc().catch(()=>({})),
    api.getGraficoSeccionalRS(filters).catch(()=>({})),
    api.getGraficoServico(filters).catch(()=>({})),
    api.getMatrizDados(filters).catch(()=>[])
  ])

  const statusENER = Object.entries(statusEnerRaw).map(([name,obj]) => ({ name, value: Object.values(obj).reduce((s,v)=>s+v,0) }))
  const statusCONC = Object.entries(statusConcRaw).map(([name,obj]) => ({ name, value: Object.values(obj).reduce((s,v)=>s+v,0) }))
  const comparison = Object.entries(seccionalRSRaw).map(([name,obj]) => ({ name, value: obj.valor, qtd: obj.pep_count }))
  const reasons = Object.entries(statusServicoRaw).map(([name,obj]) => ({ name, value: Object.values(obj).reduce((s,v)=>s+v,0) }))
  const matrix = matriz.map(r => ({ pep: r.pep, prazo: r.prazo, dataConclusao: r.dataConclusao, status: r.statusSap, rs: parseNumber(r.valor) }))

  // Fallback (demo) quando API não retorna dados, para manter o visual idêntico ao "lovable"
  const needsFallback = !regions.length || !statusENER.length || !statusCONC.length || !comparison.length || !reasons.length
  if (needsFallback) {
    const demoRegions = ['Campanha', 'Centro Sul', 'Litoral Sul', 'Sul']
    const demoStatusENER = [
      { name: 'LIB /ENER', value: 53 },
      { name: 'Fora do Prazo', value: 22 },
      { name: 'Dentro do Prazo', value: 9 }
    ]
    const demoStatusCONC = [
      { name: 'Fora do Prazo', value: 48 },
      { name: 'Dentro do Prazo', value: 29 }
    ]
    const demoComparison = [
      { name: 'Sul', value: 5400000, qtd: 600 },
      { name: 'Litoral Sul', value: 2600000, qtd: 300 },
      { name: 'Centro Sul', value: 1500000, qtd: 200 },
      { name: 'Campanha', value: 979000, qtd: 120 }
    ]
    const demoReasons = [
      { name: 'Em Fechamento', value: 813 },
      { name: 'No Almox', value: 21 },
      { name: '#REF!', value: 1 },
      { name: 'Defeito Progeo', value: 1 }
    ]
    const demoMatrix = [
      { pep: 'PEP-1001', prazo: '30/09/2025', dataConclusao: '—', status: 'Em Fechamento', rs: 125000 },
      { pep: 'PEP-1002', prazo: '20/09/2025', dataConclusao: '—', status: 'Fora do Prazo', rs: 87000 },
      { pep: 'PEP-1003', prazo: '15/10/2025', dataConclusao: '—', status: 'Dentro do Prazo', rs: 145000 }
    ]

    return {
      regions: regions.length ? regions : demoRegions,
      statusENER: statusENER.length ? statusENER : demoStatusENER,
      statusCONC: statusCONC.length ? statusCONC : demoStatusCONC,
      comparison: comparison.length ? comparison : demoComparison,
      reasons: reasons.length ? reasons : demoReasons,
      matrix: matrix.length ? matrix : demoMatrix
    }
  }

  return { regions, statusENER, statusCONC, comparison, reasons, matrix }
}

export function formatAxiosError(e: unknown): string {
  if (axios.isAxiosError(e)) return e.response?.data?.error || e.message
  return String(e)
}

// Adaptações para PrazosSAP (nomes esperados)
export type MatrizItem = MatrixRowApi

export function getMatrizDados(params: Record<string, string> = {}) {
  return axios.get(`${API_BASE}/matriz-dados/`, { params })
}

export function getProgramacao(params: Record<string, string> = {}) {
  return axios.get(`${API_BASE}/programacao/`, { params })
}

export function getFaturamento(params: Record<string, string> = {}) {
  return axios.get(`${API_BASE}/faturamento/`, { params })
}

export function getStatusEnerPep(params: Record<string, string> = {}) {
  return axios.get(`${API_BASE}/status-ener-pep/`, { params })
}

export function getStatusConcPep(params: Record<string, string> = {}) {
  return axios.get(`${API_BASE}/status-conc-pep/`, { params })
}

export function getStatusServicoContagem(params: Record<string, string> = {}) {
  return axios.get(`${API_BASE}/status-servico-contagem/`, { params })
}

export function getStatusSapUnicos() {
  return axios.get(`${API_BASE}/status-sap-unicos/`)
}

export function getTiposUnicos() {
  return axios.get(`${API_BASE}/tipos-unicos/`)
}

export function getMesesConclusao() {
  return axios.get(`${API_BASE}/meses-conclusao/`)
}

// ================== Auth ==================
export async function login(username: string, password: string) {
  // Evita token antigo atrapalhar fluxo de login
  localStorage.removeItem('jwt_access')
  localStorage.removeItem('jwt_refresh')
  const res = await axios.post(`${API_BASE}/token/`, { username, password })
  const { access, refresh } = res.data as { access: string; refresh: string }
  localStorage.setItem('jwt_access', access)
  localStorage.setItem('jwt_refresh', refresh)
  return res.data
}

export function logout() {
  localStorage.removeItem('jwt_access')
  localStorage.removeItem('jwt_refresh')
}
