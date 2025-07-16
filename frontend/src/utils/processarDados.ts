import type { GraficoItem } from "../types/index"

export function processarDados(
  dados: GraficoItem[],
  ignorarFechada = false,
  filtros?: { seccionais?: string[] }
) {
  return Object.entries(
    dados.filter(item => {
      const matchSeccional = !filtros?.seccionais?.length || filtros.seccionais.includes(item.seccional)
      const matchStatus = ignorarFechada ? !["fechado", "fechada"].includes(item.status.toLowerCase()) : true
      return matchSeccional && matchStatus
    }).reduce((acc: Record<string, number>, curr) => {
      acc[curr.status] = (acc[curr.status] || 0) + curr.count
      return acc
    }, {})
  ).map(([status, count]) => ({ status, count }))
}
