import { useEffect, useState } from 'react'
import type { GraficoItem, SeccionalData, MatrizItem } from '../types/index'
import { api } from '../services/api'

export function useDadosGraficos(filtros: {
  seccionais: string[]
  statusSap: string
  tipo: string
  mes: string
}) {
  const [seccionais, setSeccionais] = useState<string[]>([])
  const [statusSapList, setStatusSapList] = useState<string[]>([])
  const [tiposList, setTiposList] = useState<string[]>([])
  const [mesesList, setMesesList] = useState<string[]>([])

  const [graficoEner, setGraficoEner] = useState<GraficoItem[]>([])
  const [graficoConc, setGraficoConc] = useState<GraficoItem[]>([])
  const [graficoServico, setGraficoServico] = useState<{ status: string, count: number }[]>([])
  const [graficoSeccionalRS, setGraficoSeccionalRS] = useState<SeccionalData[]>([])
  const [matriz, setMatriz] = useState<MatrizItem[]>([])

  // Carrega dados fixos e gráficos
  useEffect(() => {
    api.getSeccionais().then(res => setSeccionais(Array.isArray(res.data) ? res.data : [])).catch(() => {})
    api.getStatusSAP().then(res => setStatusSapList(res.data)).catch(() => {})
    api.getTipos().then(res => setTiposList(res.data)).catch(() => {})
    api.getMesesConclusao().then(res => setMesesList(res.data)).catch(() => {})

    api.getGraficoEner().then(res => {
      const dados = Object.entries(res.data).flatMap(([status, obj]: any) =>
        Object.entries(obj).map(([seccional, count]) => ({
          status,
          seccional,
          count: Number(count) || 0
        }))
      )
      setGraficoEner(dados)
    }).catch(() => {})

    api.getGraficoConc().then(res => {
      const dados = Object.entries(res.data).flatMap(([status, obj]: any) =>
        Object.entries(obj).map(([seccional, count]) => ({
          status,
          seccional,
          count: Number(count) || 0
        }))
      )
      setGraficoConc(dados)
    }).catch(() => {})

    api.getGraficoServico().then(res => {
      const dados = Object.entries(res.data)
        .filter(([s]) => s.trim() !== "" && s.toLowerCase() !== "vazio")
        .map(([status, count]) => ({
          status,
          count: Number(count) || 0
        }))
      setGraficoServico(dados)
    }).catch(() => {})

    api.getGraficoSeccionalRS().then(res => {
      const dados = Object.entries(res.data)
        .filter(([s]) => s !== '#N/A')
        .map(([seccional, valores]: any) => ({
          seccional,
          totalRS: Number(valores.valor.toFixed(0)),
          totalPEP: valores.pep_count,
          scaledPEP: valores.pep_count * 100000
        }))
      setGraficoSeccionalRS(dados)
    }).catch(() => {})
  }, [])

  // Atualiza matriz com base nos filtros
  useEffect(() => {
    const params = new URLSearchParams()
    if (filtros.seccionais.length > 0) params.append('seccional', filtros.seccionais.join(','))
    if (filtros.statusSap) params.append('status_sap', filtros.statusSap)
    if (filtros.tipo) params.append('tipo', filtros.tipo)
    if (filtros.mes) params.append('mes', filtros.mes)

    api.getMatrizDados(params).then(res => setMatriz(res.data)).catch(() => {})
  }, [filtros])

  return {
    seccionais,
    statusSapList,
    tiposList,
    mesesList,
    graficoEner,
    graficoConc,
    graficoServico,
    graficoSeccionalRS,
    matriz
  }
}
