import { useState } from 'react'

export function useFiltros() {
  const [seccionaisSelecionadas, setSeccionaisSelecionadas] = useState<string[]>(
    () => JSON.parse(localStorage.getItem('seccionaisSelecionadas') || '[]')
  )
  const [statusSap, setStatusSap] = useState(() => localStorage.getItem('statusSapSelecionado') || '')
  const [tipo, setTipo] = useState(() => localStorage.getItem('tipoSelecionado') || '')
  const [mes, setMes] = useState(() => localStorage.getItem('mesSelecionado') || '')

  const toggleSeccional = (s: string) => {
    setSeccionaisSelecionadas(prev => {
      const novo = prev.includes(s) ? prev.filter(v => v !== s) : [...prev, s]
      localStorage.setItem('seccionaisSelecionadas', JSON.stringify(novo))
      return novo
    })
  }

  return {
    seccionaisSelecionadas,
    toggleSeccional,
    statusSap,
    setStatusSap,
    tipo,
    setTipo,
    mes,
    setMes,
  }
}
