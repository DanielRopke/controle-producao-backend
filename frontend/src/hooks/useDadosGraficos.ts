
import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { BaseFilters } from '../services/api';
import type { GraficoItem, ServicoItem, SeccionalData } from '../types/index';
import type { MatrizItem } from '../services/api';

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
    api.getSeccionais().then(setSeccionais).catch(() => setSeccionais([]));
    api.getStatusSAP().then(setStatusSapList).catch(() => setStatusSapList([]));
    api.getTipos().then(setTiposList).catch(() => setTiposList([]));
    api.getMesesConclusao().then(setMesesList).catch(() => setMesesList([]));
    api.getGraficoEner().then(d => setGraficoEner(flattenGrafico(d))).catch(() => setGraficoEner([]));
    api.getGraficoConc().then(d => setGraficoConc(flattenGrafico(d))).catch(() => setGraficoConc([]));

    const params: BaseFilters = {};
    if (filtros.seccionais.length) params.seccional = filtros.seccionais.join(',');
    if (filtros.statusSap) params.statusSap = filtros.statusSap;
    if (filtros.tipo) params.tipo = filtros.tipo;
    if (filtros.mes) params.mes = filtros.mes;

    api.getGraficoServico(params)
      .then(d => setGraficoServico(flattenGrafico(d)))
      .catch(() => setGraficoServico([]));
    api.getGraficoSeccionalRS(params)
      .then(d => setGraficoSeccionalRS(flattenSeccionalRS(d)))
      .catch(() => setGraficoSeccionalRS([]));
  }, [filtros.seccionais, filtros.statusSap, filtros.tipo, filtros.mes]);

  useEffect(() => {
    const params: BaseFilters = {};
    if (filtros.seccionais.length) params.seccional = filtros.seccionais.join(',');
    if (filtros.statusSap) params.statusSap = filtros.statusSap;
    if (filtros.tipo) params.tipo = filtros.tipo;
    if (filtros.mes) params.mes = filtros.mes;
    api.getMatrizDados(params).then(setMatriz).catch(() => setMatriz([]));
  }, [filtros]);

  function flattenGrafico(data: Record<string, Record<string, number>>): GraficoItem[] {
    return Object.entries(data).flatMap(([status, obj]) =>
      Object.entries(obj).map(([seccional, count]) => ({ status, seccional, count: Number(count) || 0 }))
    );
  }
  // Suporta tanto o formato antigo quanto o novo (agrupado por seccional)
  function flattenSeccionalRS(data: Record<string, { valor: number; pep_count: number; mes?: string; tipo?: string; statusSap?: string }>): SeccionalData[] {
    return Object.entries(data)
      .filter(([seccional]) => seccional !== '#N/A')
      .map(([seccional, valores]) => ({
        seccional,
        totalRS: Number((valores?.valor ?? 0).toFixed(0)),
        totalPEP: valores?.pep_count ?? 0,
        scaledPEP: (valores?.pep_count ?? 0) * 10000,
        mes: valores?.mes ?? '',
        tipo: valores?.tipo ?? '',
        statusSap: valores?.statusSap ?? '',
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
