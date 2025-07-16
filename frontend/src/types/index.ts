export interface GraficoItem {
  status: string
  seccional: string
  count: number
}

export interface SeccionalData {
  seccional: string
  totalRS: number
  totalPEP: number
  scaledPEP?: number
}

export interface MatrizItem {
  pep: string
  prazo: string
  dataConclusao: string
  statusSap: string
  valor: string
  seccional: string
  tipo: string
  mesConclusao: string
}

export type { GraficoItem, SeccionalData, MatrizItem }
