
import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { GraficoItem, ServicoItem, SeccionalData, MatrizItem } from '../types/index';

/**
 * Hook para buscar e processar dados dos gráficos da dashboard.
 * @param filtros - Filtros aplicados (seccionais, statusSap, tipo, mes)
 * @returns Dados dos gráficos, listas de filtros e matriz
 */

export function useDadosGraficos(filtros: {
  /** Seccionais selecionadas */
  seccionais: string[];
  /** Status SAP selecionado */
  statusSap: string;
  /** Tipo selecionado */
  tipo: string;
  /** Mês selecionado */
  mes: string;
}) {
  const [seccionais, setSeccionais] = useState<string[]>([]);
  const [statusSapList, setStatusSapList] = useState<string[]>([]);
  const [tiposList, setTiposList] = useState<string[]>([]);
  const [mesesList, setMesesList] = useState<string[]>([]);
  const [graficoEner, setGraficoEner] = useState<GraficoItem[]>([]);
  const [graficoConc, setGraficoConc] = useState<GraficoItem[]>([]);
  const [graficoServico, setGraficoServico] = useState<ServicoItem[]>([]);
  const [graficoSeccionalRS, setGraficoSeccionalRS] = useState<SeccionalData[]>([]);
  const [matriz, setMatriz] = useState<MatrizItem[]>([]);

  useEffect(() => {
    api.getSeccionais().then(r => setSeccionais(r.data));
    api.getStatusSAP().then(r => setStatusSapList(r.data));
    api.getTipos().then(r => setTiposList(r.data));
    api.getMesesConclusao().then(r => setMesesList(r.data));
    api.getGraficoEner().then(r => setGraficoEner(flattenGrafico(r.data)));
    api.getGraficoConc().then(r => setGraficoConc(flattenGrafico(r.data)));
    api.getGraficoServico().then(r => setGraficoServico(flattenServico(r.data)));
    api.getGraficoSeccionalRS().then(r => setGraficoSeccionalRS(flattenSeccionalRS(r.data)));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filtros.seccionais.length) params.append('seccional', filtros.seccionais.join(','));
    if (filtros.statusSap) params.append('status_sap', filtros.statusSap);
    if (filtros.tipo) params.append('tipo', filtros.tipo);
    if (filtros.mes) params.append('mes', filtros.mes);
    api.getMatrizDados(params).then(r => setMatriz(r.data));
  }, [filtros]);

  function flattenGrafico(data: Record<string, Record<string, number>>): GraficoItem[] {
    return Object.entries(data).flatMap(([status, obj]) =>
      Object.entries(obj).map(([seccional, count]) => ({ status, seccional, count: Number(count) || 0 }))
    );
  }
  function flattenServico(data: Record<string, number>): ServicoItem[] {
    return Object.entries(data)
      .filter(([status]) => status.trim() !== '' && status.toLowerCase() !== 'vazio')
      .map(([status, count]) => ({ status, count: Number(count) || 0 }));
  }
  function flattenSeccionalRS(data: Record<string, { valor: number; pep_count: number }>): SeccionalData[] {
    return Object.entries(data)
      .filter(([seccional]) => seccional !== '#N/A')
      .map(([seccional, valores]) => ({
        seccional,
        totalRS: Number((valores?.valor ?? 0).toFixed(0)),
        totalPEP: valores?.pep_count ?? 0,
        scaledPEP: (valores?.pep_count ?? 0) * 10000
      }));
  }

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
  };
}
