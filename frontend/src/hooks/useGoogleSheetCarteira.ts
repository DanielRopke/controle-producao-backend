import { useEffect, useState } from 'react'
import axios from 'axios'

type RawRow = Record<string, unknown>

function parseNumber(v: unknown): number {
  if (v == null) return 0
  if (typeof v === 'number') return v
  const s = String(v)
  const cleaned = s.replace(/R\$/i, '').replace(/\./g, '').replace(/,/g, '.').trim()
  const n = parseFloat(cleaned)
  return Number.isNaN(n) ? 0 : n
}

export interface MatrizRow {
  pep?: string
  prazo?: string
  dataConclusao?: string
  municipio?: string
  statusSap?: string
  valor?: number
  seccional?: string
  tipo?: string
  statusEner?: string
  statusConc?: string
  statusServico?: string
  statusFim?: string
  statusAgrupado?: string
}

function flattenByField(rows: MatrizRow[], field: keyof MatrizRow) {
  const map = new Map<string, Map<string, number>>()
  for (const r of rows) {
    const status = String((r[field] ?? '') as string).trim()
    const secc = String(r.seccional ?? '').trim() || ''
    if (!status) continue
    if (!map.has(status)) map.set(status, new Map())
    const sub = map.get(status)!
    sub.set(secc, (sub.get(secc) || 0) + 1)
  }
  const out: Record<string, Record<string, number>> = {}
  for (const [status, bySecc] of map.entries()) {
    out[status] = {}
    for (const [secc, count] of bySecc.entries()) out[status][secc] = count
  }
  return out
}

export default function useGoogleSheetCarteira(sheetId: string, sheetName = 'CarteiraObras') {
  const [seccionais, setSeccionais] = useState<string[]>([])
  const [statusSapList, setStatusSapList] = useState<string[]>([])
  const [tiposList, setTiposList] = useState<string[]>([])
  const [mesesList, setMesesList] = useState<string[]>([])
  const [graficoEner, setGraficoEner] = useState<Record<string, Record<string, number>>>({})
  const [graficoConc, setGraficoConc] = useState<Record<string, Record<string, number>>>({})
  const [graficoServico, setGraficoServico] = useState<Record<string, Record<string, number>>>({})
  const [graficoSeccionalRS, setGraficoSeccionalRS] = useState<Record<string, { valor: number; pep_count: number }>>({})
  const [matriz, setMatriz] = useState<MatrizRow[]>([])

  useEffect(() => {
    if (!sheetId) return
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`
    let cancelled = false
    axios
      .get(url, { responseType: 'text' })
      .then((res) => {
        if (cancelled) return
        const text = String(res.data || '')
        const start = text.indexOf('setResponse(')
        let jsonStr = text
        if (start >= 0) {
          const sub = text.slice(start + 'setResponse('.length)
          const end = sub.lastIndexOf(')')
          jsonStr = sub.slice(0, end)
        } else {
          const f = text.indexOf('{')
          const l = text.lastIndexOf('}')
          if (f >= 0 && l >= 0) jsonStr = text.slice(f, l + 1)
        }
        type Parsed = {
          table?: {
            cols?: Array<{ label?: string | null; id?: string | null }> 
            rows?: Array<{ c?: Array<{ v?: unknown; f?: unknown } | null> }>
          }
        }

        let parsed: Parsed | null = null
        try {
          parsed = JSON.parse(jsonStr) as Parsed
        } catch {
          parsed = null
        }
        if (!parsed || !parsed.table) {
          return
        }
        const cols: string[] = (parsed.table.cols || []).map((c) => String((c.label || c.id || '')).trim())
        const rows: RawRow[] = (parsed.table.rows || []).map((r) => {
          const obj: RawRow = {}
          const cells = r.c || []
          for (let i = 0; i < cols.length; i++) {
            const key = cols[i] || `col${i}`
            const cell = cells[i]
            obj[key] = cell ? (cell.v ?? cell.f) : ''
          }
          return obj
        })

        const mapped: MatrizRow[] = rows.map((r) => ({
          pep: String(r.PEP || r.pep || r.PEP_ || r['Pep'] || r.pep || '') || undefined,
          prazo: String(r.Prazo || r.prazo || r.PRAZO || '') || undefined,
          dataConclusao: String(r['Data Conclusão'] || r.dataConclusao || r.data || '') || undefined,
          municipio: String(r.Municipio || r.municipio || r['MUNICIPIO'] || r['Município'] || '') || undefined,
          statusSap: String(r['Status SAP'] || r.statusSap || r.status || '') || undefined,
          statusFim: String(r['STATUS FIM'] || r['Status Fim'] || r.statusFim || r['Status FIM'] || r['Status fim'] || '') || undefined,
          statusAgrupado: String(r['STATUS AGRUPADO'] || r['Status Agrupado'] || r.statusAgrupado || r['Status agrupado'] || '') || undefined,
          valor: parseNumber(r.Valor || r.valor || r.RS || r.rs || r['Valor (R$)'] || r['R$'] || 0),
          seccional: String(r.Seccional || r.seccional || r.Seccao || r.seccao || '') || undefined,
          tipo: String(r.Tipo || r.tipo || '') || undefined,
          statusEner: String(r.statusEner || r['Status ENER'] || '') || undefined,
          statusConc: String(r.statusConc || r['Status CONC'] || '') || undefined,
          statusServico: String(r.statusServico || r['Motivo'] || r.motivo || '') || undefined,
        }))

        setMatriz(mapped)

        setSeccionais(Array.from(new Set(mapped.map((m) => String(m.seccional || '').trim()).filter((s) => s))))
        setStatusSapList(Array.from(new Set(mapped.map((m) => String(m.statusSap || '').trim()).filter((s) => s))))
        setTiposList(Array.from(new Set(mapped.map((m) => String(m.tipo || '').trim()).filter((s) => s))))

        const meses = new Set<string>()
        for (const m of mapped) {
          const v = String(m.dataConclusao || m.prazo || '')
          const mo = v.match(/\/(\d{1,2})\/(\d{4})$/)
          if (mo) meses.add(String(mo[1]))
        }
        setMesesList(Array.from(meses))

        setGraficoEner(flattenByField(mapped, 'statusEner'))
        setGraficoConc(flattenByField(mapped, 'statusConc'))
        setGraficoServico(flattenByField(mapped, 'statusServico'))

        const seccMap = new Map<string, { valor: number; pepSet: Set<string> }>()
        for (const r of mapped) {
          const s = String(r.seccional || '').trim() || '#N/A'
          const pep = String(r.pep || '').trim() || `pep-${Math.random().toString(36).slice(2, 8)}`
          const cur = seccMap.get(s) || { valor: 0, pepSet: new Set<string>() }
          cur.valor = (cur.valor || 0) + (Number(r.valor) || 0)
          cur.pepSet.add(pep)
          seccMap.set(s, cur)
        }
        const seccObj: Record<string, { valor: number; pep_count: number }> = {}
        for (const [k, v] of seccMap.entries()) seccObj[k] = { valor: Math.round(v.valor || 0), pep_count: v.pepSet.size }
        setGraficoSeccionalRS(seccObj)
      })
      .catch(() => {
        // ignore, keep defaults
      })
    return () => {
      cancelled = true
    }
  }, [sheetId, sheetName])

  return {
    seccionais,
    statusSapList,
    tiposList,
    mesesList,
    graficoEner,
    graficoConc,
    graficoServico,
    graficoSeccionalRS,
    matriz,
  }
}
