// Serviço simples para buscar Status ENER do backend
// Ajuste VITE_API_BASE em .env.local se necessário (ex: https://controle-producao-backend.onrender.com/api)

const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:8000/api').replace(/\/$/, '')

export type StatusEnerItem = { name: string; value: number }

export async function fetchStatusEner(): Promise<StatusEnerItem[]> {
  const res = await fetch(`${API_BASE}/status-ener-pep/`)
  if (!res.ok) throw new Error('Falha ao buscar Status ENER')
  const json = await res.json() as Record<string, Record<string, number>>
  return Object.entries(json).map(([status, seccionais]) => ({
    name: status,
    value: Object.values(seccionais).reduce((s, v) => s + v, 0)
  }))
}
