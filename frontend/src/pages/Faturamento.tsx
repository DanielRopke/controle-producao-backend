// Página Faturamento: cópia da Programação, com título "Previsão de Faturamento" e leitura da aba FATURAMENTO
import React, { useEffect, useState, useRef } from 'react';
import ContextMenu from '../components/ContextMenu';
import { useNavigate } from 'react-router-dom';
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Copy, RotateCcw, Menu, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { DateRangeFilter } from '../components/DateRangeFilter';
import { PEPSearch } from '../components/PEPSearch';
import { cn } from "../lib/utils";
import { getFaturamento, formatAxiosError } from '../services/api';
import axios from 'axios';
import type { MatrizItem } from '../services/api';
import { showToast } from '../components/toast';
import LogoSetup from '../assets/LogoSetup1.png';
import { FundoAnimado } from '../components/FundoAnimado';

export default function Faturamento() {
  const navigate = useNavigate();
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pepSearch, setPepSearch] = useState('');
  const [selectedStartDate, setSelectedStartDate] = useState<Date | undefined>(undefined);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | undefined>(undefined);
  const [selectedPrioridade, setSelectedPrioridade] = useState<string>('');
  const [motivoPrioridadeList, setMotivoPrioridadeList] = useState<string[]>([]);
  const [selectedTipo, setSelectedTipo] = useState<string>(() => {
    const now = new Date();
    let m = now.getMonth() + 1; // 1..12
    if (now.getDate() > 15) m = m === 12 ? 1 : m + 1; // próximo mês após dia 15
    return String(m);
  });
  const [selectedMes, setSelectedMes] = useState<string>('');
  const [selectedMatrixRows, setSelectedMatrixRows] = useState<string[]>([]);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [contextOpen, setContextOpen] = useState(false);
  const [contextPos, setContextPos] = useState({ x: 0, y: 0 });
  const [contextItems, setContextItems] = useState<{ id: string; label: string; onClick: () => void }[]>([]);
  useEffect(() => { void contextOpen; void contextPos; void contextItems; }, [contextOpen, contextPos, contextItems]);
  // Detecta breakpoint lg e calcula alinhamento dinâmico com card do header
  const [isLg, setIsLg] = useState(false);
  const [panelLeft, setPanelLeft] = useState<number>(0);
  const [panelWidth, setPanelWidth] = useState<number>(288); // 18rem default
  useEffect(() => {
  const MIN_W = 18 * 16; // 18rem
  const RIGHT_GAP = 26; // px até a borda direita
  const INNER_PADDING = 12; // px (px-3)
    const recalc = () => {
      const ww = typeof window !== 'undefined' ? window.innerWidth : 0;
      // largura visível sem scrollbar vertical
      const clientW = typeof document !== 'undefined' ? document.documentElement.clientWidth : ww;
      const scrollbarWidth = Math.max(0, ww - clientW);
      const effectiveW = Math.max(0, ww - scrollbarWidth);
      setIsLg(effectiveW >= 1024);
      try {
        const el = document.querySelector('[data-role="valor-total-card"]') as HTMLElement | null;
        const rect = el ? el.getBoundingClientRect() : null;
        const left = rect ? Math.max(0, rect.left - INNER_PADDING) : Math.max(0, effectiveW - MIN_W - RIGHT_GAP);
        const width = Math.max(MIN_W, effectiveW - left - RIGHT_GAP);
        setPanelLeft(left);
        setPanelWidth(width);
      } catch {
        const left = Math.max(0, effectiveW - MIN_W - RIGHT_GAP);
        const width = Math.max(MIN_W, effectiveW - left - RIGHT_GAP);
        setPanelLeft(left);
        setPanelWidth(width);
      }
    };
    recalc();
    const id = window.requestAnimationFrame(recalc);
    window.addEventListener('resize', recalc);
    // também recalcula quando a página for rolada (pode mudar presença de scrollbar)
    window.addEventListener('scroll', recalc, { passive: true });
    // observe mudanças de layout (aparecimento/remoção de scrollbars ou mudança de conteúdo)
    let ro: ResizeObserver | undefined;
    try {
      if (typeof ResizeObserver !== 'undefined') {
        ro = new ResizeObserver(() => { requestAnimationFrame(recalc); });
        try { ro.observe(document.documentElement); } catch { /* ignore */ }
        try { ro.observe(document.body); } catch { /* ignore */ }
        // observe principal wrapper se disponível (atualiza quando tabela muda altura/scroll)
        try {
          const wrapper = document.querySelector('[data-role="main-table-wrapper"]') as HTMLElement | null;
          if (wrapper) ro.observe(wrapper);
        } catch { /* ignore */ }
      }
    } catch {
      /* ResizeObserver pode não existir em alguns ambientes */
    }
    return () => { window.cancelAnimationFrame(id); window.removeEventListener('resize', recalc); window.removeEventListener('scroll', recalc); if (ro) ro.disconnect(); };
  }, []);

  // Calcula largura em pixels da coluna 'Data' para terminar 26px antes do painel direito
  const [dataColPx, setDataColPx] = useState<number | null>(null);
  useEffect(() => {
    const recalc = () => {
      try {
        if (!isLg) { setDataColPx(null); return; }
        const tableEl = tableWrapperRef.current as HTMLElement | null;
        if (!tableEl) { setDataColPx(null); return; }
        const tableRect = tableEl.getBoundingClientRect();
        const desiredRight = panelLeft - 26; // px from viewport left
        const widthPx = Math.max(80, Math.round(desiredRight - tableRect.left));
        setDataColPx(widthPx);
      } catch {
        setDataColPx(null);
      }
    };
    recalc();
    const id = window.requestAnimationFrame(recalc);
    window.addEventListener('resize', recalc);
    return () => { window.cancelAnimationFrame(id); window.removeEventListener('resize', recalc); };
  }, [panelLeft, isLg]);

  type MatrixRow = {
    data: string;
    pep: string;
    valor: number;
    equipes: string;
    cidadeObra: string;
    motivoPrioridade: string;
    prioridade: string;
  };
  const [sortConfig, setSortConfig] = useState<{ key?: keyof MatrixRow; direction?: 'asc' | 'desc' }>({ key: 'data', direction: 'asc' });
  const [regions, setRegions] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<MatrizItem[]>([]);
  
  const [tiposList, setTiposList] = useState<string[]>([]);
  const [mesesList, setMesesList] = useState<string[]>([]);

  type ColumnKey = 'data' | 'pep' | 'valor' | 'equipes' | 'cidadeObra' | 'motivoPrioridade' | 'hash';
  const colPercents: Record<ColumnKey, number> = { data: 10, pep: 22, valor: 10, equipes: 18, cidadeObra: 22, motivoPrioridade: 14, hash: 4 };
  const getPercent = (key: ColumnKey) => colPercents[key];

  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'Previsão de Faturamento';
    return () => { document.title = prevTitle; };
  }, []);

  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

  const clearFilters = () => {
    setSelectedRegion('all');
    setActiveFilters({});
    setSelectedStartDate(undefined);
    setSelectedEndDate(undefined);
    setPepSearch('');
  setSelectedPrioridade('');
    setSelectedTipo('');
    setSelectedMes('');
    showToast('Filtros limpos!');
  };

  const clearPepSearch = () => { setPepSearch(''); showToast('Pesquisa PEP limpa!'); };

  const handleSort = (key: keyof MatrixRow) => {
    if (sortConfig.key === key) { setSortConfig({ key, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' }); return; }
    const numericKeys: (keyof MatrixRow)[] = ['valor'];
    if (numericKeys.includes(key) || key === 'data') setSortConfig({ key, direction: 'desc' }); else setSortConfig({ key, direction: 'asc' });
  };
  const getSortIcon = (columnKey: keyof MatrixRow) => { if (sortConfig.key !== columnKey) return <ChevronsUpDown className="w-4 h-4 text-gray-500" />; return sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4 text-green-600" /> : <ChevronDown className="w-4 h-4 text-green-600" />; };

  const tableWrapperRef = useRef<HTMLDivElement | null>(null);
  const scrollToRow = (idx: number) => {
    try {
      const container = tableWrapperRef.current;
      let el: HTMLElement | null = null;
      if (container) el = container.querySelector(`[data-row-index="${idx}"]`);
      if (!el) el = document.querySelector(`[data-row-index="${idx}"]`);
      if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } catch (err) {
      console.debug('scrollToRow error', err);
    }
  };

  const filteredData = React.useMemo(() => {
    const regionFilterForOthers = (activeFilters.comparison || (selectedRegion !== 'all' ? selectedRegion : undefined)) as string | undefined;
    let rowsForOthers = rawRows;
    if (regionFilterForOthers) rowsForOthers = rowsForOthers.filter(r => (r.seccional || '').trim() === regionFilterForOthers);
  if (selectedPrioridade) rowsForOthers = rowsForOthers.filter(r => String((r as unknown as Record<string, unknown>)['Motivo Prioridade'] ?? (r as unknown as Record<string, unknown>).motivoPrioridade ?? '').trim() === selectedPrioridade);
    if (selectedTipo) rowsForOthers = rowsForOthers.filter(r => (r.tipo || '').trim() === selectedTipo);
    if (selectedMes) rowsForOthers = rowsForOthers.filter(r => {
      const ro = r as unknown as Record<string, unknown>;
      return String(ro['anoCiclo'] ?? '').trim() === selectedMes;
    });
    // Filtro por intervalo de datas (usando a coluna DATA/Data)
    if (selectedStartDate || selectedEndDate) {
      const start = selectedStartDate ? new Date(selectedStartDate) : undefined;
      const end = selectedEndDate ? new Date(selectedEndDate) : undefined;
      if (start) start.setHours(0, 0, 0, 0);
      if (end) end.setHours(23, 59, 59, 999);
      rowsForOthers = rowsForOthers.filter(r => {
        const ro = r as unknown as Record<string, unknown>;
        const label = String(ro['DATA'] ?? ro['Data'] ?? '').trim();
        const t = (() => {
          if (!label) return Number.NaN;
          const m = label.match(/^(\d{1,2})[^\d](\d{1,2})[^\d](\d{2,4})$/);
          if (m) {
            const d = Number(m[1]);
            const mo = Number(m[2]) - 1;
            let y = Number(m[3]);
            if (y < 100) y += 2000;
            const dt = new Date(y, mo, d);
            return dt.getTime();
          }
          const ts = Date.parse(label);
          return Number.isNaN(ts) ? Number.NaN : ts;
        })();
        if (Number.isNaN(t)) return false;
        if (start && t < start.getTime()) return false;
        if (end && t > end.getTime()) return false;
        return true;
      });
    }
    if (pepSearch.trim()) rowsForOthers = rowsForOthers.filter(r => (r.pep || '').toLowerCase().includes(pepSearch.toLowerCase()));

    const tableRows = rowsForOthers.map(r => {
      const rowObj = r as unknown as Record<string, unknown>;
      const parseMoney = (v: unknown) => { if (v == null) return 0; if (typeof v === 'number') return v; const s = String(v); const cleaned = s.replace(/R\$/i, '').replace(/\./g, '').replace(/,/g, '.').trim(); const n = parseFloat(cleaned); return Number.isNaN(n) ? 0 : n; };
      return {
        data: String(rowObj['DATA'] ?? rowObj['Data'] ?? ''),
        pep: String(rowObj['PEP/ORDEM'] ?? rowObj['PEP'] ?? rowObj['pep'] ?? ''),
        valor: parseMoney(
          rowObj['valor']
          ?? rowObj['Valor faturamento (última prog)']
          ?? rowObj['Valor faturamento (ultima prog)']
          ?? rowObj['VALOR FATURAMENTO (ÚLTIMA PROG)']
          ?? rowObj['VALOR FATURAMENTO (ULTIMA PROG)']
          ?? rowObj['ValorFaturamentoUltimaProg']
          ?? rowObj['R$'] ?? rowObj['RS'] ?? rowObj['VALOR'] ?? rowObj['Valor']
        ),
        equipes: String(rowObj['EQUIPES'] ?? rowObj['EQUIPE'] ?? rowObj['Equipe'] ?? rowObj['equipe'] ?? ''),
        cidadeObra: String(rowObj['Cidade Obra'] ?? rowObj['Cidade da Obra'] ?? rowObj['CIDADE OBRA'] ?? rowObj['cidadeObra'] ?? ''),
        motivoPrioridade: String(rowObj['Motivo Prioridade'] ?? rowObj['motivoPrioridade'] ?? ''),
        prioridade: String(rowObj['Prioridade'] ?? rowObj['prioridade'] ?? ''),
      } as MatrixRow;
    });

    if (sortConfig.key) {
      const parseDate = (s: string): number => { if (!s) return Number.NaN; const str = String(s).trim(); const m = str.match(/^(\d{1,2})[^\d](\d{1,2})[^\d](\d{2,4})$/); if (m) { const d = Number(m[1]); const mo = Number(m[2]) - 1; let y = Number(m[3]); if (y < 100) y += 2000; const dt = new Date(y, mo, d); if (!Number.isNaN(dt.getTime())) return dt.getTime(); } const t = Date.parse(str); return Number.isNaN(t) ? Number.NaN : t; };
      tableRows.sort((a, b) => {
        const key = sortConfig.key as keyof MatrixRow; const dir = sortConfig.direction === 'asc' ? 1 : -1; const aValue = a[key]; const bValue = b[key];
        if (['valor'].includes(key as string)) {
          const an = Number(aValue); const bn = Number(bValue);
          if (Number.isNaN(an) && Number.isNaN(bn)) return 0; if (Number.isNaN(an)) return 1; if (Number.isNaN(bn)) return -1; return dir * (an - bn);
        }
        if (key === 'data') { const da = parseDate(String(aValue)); const db = parseDate(String(bValue)); if (Number.isNaN(da) && Number.isNaN(db)) return 0; if (Number.isNaN(da)) return 1; if (Number.isNaN(db)) return -1; return dir * (da - db); }
        const aStr = String(aValue || '').toLowerCase(); const bStr = String(bValue || '').toLowerCase(); if (aStr === bStr) return 0; return dir * (aStr < bStr ? -1 : 1);
      });
    }
    return { matrix: tableRows } as { matrix: MatrixRow[] };
  }, [rawRows, selectedRegion, activeFilters, pepSearch, sortConfig, selectedPrioridade, selectedTipo, selectedMes, selectedStartDate, selectedEndDate]);

  useEffect(() => {
    const handler = (ev: KeyboardEvent) => {
      const active = document.activeElement as HTMLElement | null;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return;
      const rows = (filteredData && Array.isArray(filteredData.matrix)) ? filteredData.matrix : [];
      if (!rows.length) return;
      if ((ev.ctrlKey || ev.metaKey) && ev.shiftKey && ev.key === 'ArrowDown') {
        ev.preventDefault(); const start = (typeof lastSelectedIndex === 'number' && lastSelectedIndex >= 0) ? lastSelectedIndex : 0; const toSelect = rows.slice(start).map(r => r.pep);
        setSelectedMatrixRows(prev => { const prefix = Array.isArray(prev) ? prev.filter(p => { const idx = rows.findIndex(r => r.pep === p); return idx >= 0 && idx < start; }) : []; return Array.from(new Set([...prefix, ...toSelect])); }); setLastSelectedIndex(rows.length - 1); scrollToRow(rows.length - 1); return;
      }
      if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
        ev.preventDefault(); let current = typeof lastSelectedIndex === 'number' && lastSelectedIndex >= 0 ? lastSelectedIndex : -1; if (current === -1 && Array.isArray(selectedMatrixRows) && selectedMatrixRows.length) { const firstPep = selectedMatrixRows[0]; const idx = rows.findIndex(r => r.pep === firstPep); if (idx >= 0) current = idx; }
        const dir = ev.key === 'ArrowDown' ? 1 : -1; let next = current + dir; if (next < 0) next = 0; if (next > rows.length - 1) next = rows.length - 1;
        if (ev.shiftKey && current >= 0) { const start = Math.min(current, next); const end = Math.max(current, next); const range = rows.slice(start, end + 1).map(r => r.pep);
          setSelectedMatrixRows(prev => { const preserved = Array.isArray(prev) ? prev.filter(p => { const idx = rows.findIndex(r => r.pep === p); return idx === -1 || idx < start || idx > end; }) : []; return Array.from(new Set([...preserved, ...range])); }); setLastSelectedIndex(next); scrollToRow(next); return; }
        setSelectedMatrixRows([rows[next].pep]); setLastSelectedIndex(next); scrollToRow(next); return;
      }
    };
    document.addEventListener('keydown', handler); return () => document.removeEventListener('keydown', handler);
  }, [lastSelectedIndex, filteredData, selectedMatrixRows]);

  useEffect(() => {
    const m = new Map<string, number>();
    for (const r of rawRows) { const s = (r.seccional || '').trim(); if (!s) continue; const v = typeof r.valor === 'number' ? r.valor : parseFloat(String(r.valor || '0').replace(/R\$\s?/, '').replace(/\./g, '').replace(/,/g, '.')) || 0; m.set(s, (m.get(s) || 0) + v); }
    const regionList = Array.from(m.entries()).sort((a, b) => b[1] - a[1]).map(([name]) => name); setRegions(regionList);
  }, [rawRows]);

  useEffect(() => {
    const invalid = new Set(['', null, undefined, '#N/A', 'N/A', 'na', 'NaN']);
    const statusSet = new Set<string>(); const mesCicloSet = new Set<string>(); const anoSet = new Set<string>(); const motivoSet = new Set<string>();
    for (const r of rawRows) {
      const s = (r.statusSap || '').toString().trim(); const mes = (r.tipo || '').toString().trim(); const ano = String((r as unknown as Record<string, unknown>).anoCiclo ?? '').trim();
      const rAny = r as unknown as Record<string, unknown>;
      const motivo = String(rAny['Motivo Prioridade'] ?? rAny['motivoPrioridade'] ?? '').trim();
      if (s && !invalid.has(s)) statusSet.add(s);
      if (mes && !invalid.has(mes)) { const n = parseInt(String(mes), 10); if (!Number.isNaN(n) && n >= 1 && n <= 12) mesCicloSet.add(String(n)); else mesCicloSet.add(mes); }
      if (ano && !invalid.has(ano)) anoSet.add(ano);
      if (motivo && !invalid.has(motivo)) motivoSet.add(motivo);
    }
    setTiposList(Array.from(mesCicloSet).sort((a, b) => (parseInt(String(a), 10) || 0) - (parseInt(String(b), 10) || 0)));
    setMesesList(Array.from(anoSet).sort());
    setMotivoPrioridadeList(Array.from(motivoSet).sort());
  }, [rawRows]);

  useEffect(() => { void loadFromFaturamento(); }, []);

  async function loadFromFaturamento() {
    try {
      const res = await getFaturamento();
      const data = (res.data || []) as Record<string, unknown>[];
      const mapped = data.map((row) => {
        const r = row as Record<string, unknown>;
        const normalizeKey = (s: string | undefined) => { if (!s) return ''; const nfd = s.toString().normalize('NFD'); const withoutDiacritics = nfd.replace(/[\u0300-\u036f]/g, ''); return withoutDiacritics.replace(/[^A-Za-z0-9]/g, '').toLowerCase(); };
        const normMap = new Map<string, unknown>(); for (const [k, v] of Object.entries(r || {})) normMap.set(normalizeKey(k), v);
        const get = (keys: (string | undefined)[]) => { for (const k of keys) { if (!k) continue; const nk = normalizeKey(k); if (normMap.has(nk)) { const val = normMap.get(nk); if (val !== undefined && val !== null) return val; } } return undefined; };
        const parseStr = (v: unknown) => v == null ? '' : String(v);
        const parseNumber = (v: unknown) => { if (v == null) return 0; if (typeof v === 'number') return v; const s = String(v); const cleaned = s.replace(/R\$/i, '').replace(/\./g, '').replace(/,/g, '.').trim(); const n = parseFloat(cleaned); return Number.isNaN(n) ? 0 : n; };

        const DATA = parseStr(get(['DATA', 'Data', 'data', 'DATA CONCLUSÃO', 'Data Conclusão']));
        const PEP_ORDEM = parseStr(get(['PEP/ORDEM', 'PEP', 'pep', 'Serviço', 'servico']));
        const STATUS_PROG = parseStr(get(['STATUS RETORNO PROG 2', 'STATUS RETORNO PROG', 'Status Retorno Prog', 'statusSap']));
        const MOTIVO_NAO_CUMPRIMENTO = parseStr(get(['MOTIVO NÃO CUMPRIMENTO DA PROG', 'Motivo Não Cumprimento', 'motivoNaoCumprimento', 'MOTIVO NÃO CUMPRIMENTO']));
        const MOTIVO_PRIORIDADE = parseStr(get(['Motivo Prioridade', 'motivoPrioridade']));
        const PRIORIDADE = parseStr(get(['Prioridade', 'prioridade']));

        const VAL_PROG = get(['Valor programado', 'Valor Programado', 'valorProgramado', 'Valor programado (R$)', 'Valor Programado (R$)']);
        const VAL_CONC = get(['Valor concluído', 'Valor Concluído', 'valorConcluido']);
        const VAL_PAR = get(['Valor parcial', 'Valor Parcial', 'valorParcial']);
        const VAL_CAN = get(['Valor cancelado', 'Valor Cancelado', 'valorCancelado']);
        const VAL_FAT_ULT_PROG = get([
          'Valor faturamento (última prog)',
          'Valor faturamento (ultima prog)',
          'VALOR FATURAMENTO (ÚLTIMA PROG)',
          'VALOR FATURAMENTO (ULTIMA PROG)',
          'ValorFaturamentoUltimaProg',
          'valorFaturamentoUltimaProg'
        ]);

  const valorProgramado = parseNumber(VAL_PROG);
        const valorConcluido = parseNumber(VAL_CONC);
        const valorParcial = parseNumber(VAL_PAR);
        const valorCancelado = parseNumber(VAL_CAN);
  const valorFaturUltimaProg = parseNumber(VAL_FAT_ULT_PROG);

        const pep = PEP_ORDEM;
        const prazo = parseStr(get(['PRAZO', 'Prazo', 'prazo']));
        const dataConclusao = parseStr(get(['DATA CONCLUSÃO', 'Data Conclusão', 'dataConclusao', 'DATA']));
        const seccional = parseStr(get(['Seccional Equipe', 'Seccional', 'SECCIONAL', 'seccional']));
        const mesCiclo = parseStr(get(['Mês Ciclo', 'Mes Ciclo', 'MesCiclo', 'tipo']));
        const anoCiclo = parseStr(get(['Ano ciclo', 'AnoCiclo', 'Ano']));

        const out: Record<string, unknown> = { ...(r || {}) };
        out['DATA'] = DATA; out['PEP/ORDEM'] = PEP_ORDEM; out['STATUS RETORNO PROG 2'] = STATUS_PROG; out['MOTIVO NÃO CUMPRIMENTO DA PROG'] = MOTIVO_NAO_CUMPRIMENTO; out['Motivo Prioridade'] = MOTIVO_PRIORIDADE; out['Prioridade'] = PRIORIDADE;
        out['Valor programado'] = VAL_PROG ?? valorProgramado; out['Valor concluído'] = VAL_CONC ?? valorConcluido; out['Valor parcial'] = VAL_PAR ?? valorParcial; out['Valor cancelado'] = VAL_CAN ?? valorCancelado;

        out['pep'] = pep; out['prazo'] = prazo; out['dataConclusao'] = dataConclusao; out['statusSap'] = STATUS_PROG; out['valorProgramado'] = valorProgramado; out['valorConcluido'] = valorConcluido; out['valorParcial'] = valorParcial; out['valorCancelado'] = valorCancelado;
        const fallbackValor = (r['R$'] ?? r['RS'] ?? r['VALOR'] ?? r['valor'] ?? 0) as unknown as number | string;
        out['valor'] = (VAL_FAT_ULT_PROG !== undefined && VAL_FAT_ULT_PROG !== null)
          ? valorFaturUltimaProg
          : (valorProgramado || valorConcluido || valorParcial || valorCancelado || fallbackValor);
        out['seccional'] = seccional; out['tipo'] = mesCiclo; out['anoCiclo'] = anoCiclo; out['statusEner'] = r['Status ENER'] ?? r['STATUS ENER'] ?? undefined; out['statusConc'] = r['Status CONC'] ?? r['STATUS CONC'] ?? undefined; out['statusServico'] = r['status serviço'] ?? r['STATUS SERVIÇO'] ?? undefined;

        return out as unknown as MatrizItem & Record<string, unknown>;
      });
      setRawRows(mapped as unknown as MatrizItem[]);
      showToast(`Previsão de Faturamento carregada: ${mapped.length} linhas`);
    // Diagnóstico: apenas loga no console; não exibe toast para evitar ruído quando a página carrega normalmente
      try {
        const statusRes = await axios.get('/api/sheets-status/');
        if (statusRes && statusRes.data) {
          const s = statusRes.data;
          console.info('sheets-status:', s);
      // Sem toast: problemas reais aparecerão no carregamento da tabela/gráficos
        }
      } catch (stErr) {
        console.debug('Erro ao consultar /api/sheets-status/:', stErr);
      }
    } catch (err) {
  console.error('Erro ao carregar faturamento:', err);
  try { setRawRows([]); } catch { /* ignore */ }
  const msg = formatAxiosError(err);
  showToast(`Erro ao carregar faturamento: ${msg}`);
    }
  }

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredData.matrix.map(row => ({
        'Data': row.data,
        'Serviço': row.pep,
        'Valor': row.valor,
        'EQUIPES': row.equipes,
        'Cidade Obra': row.cidadeObra,
        'Prioridade': row.motivoPrioridade,
        '#': getHashEmoji(row as unknown as Record<string, unknown>)
      }))
    );
    const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, worksheet, 'Faturamento'); XLSX.writeFile(workbook, 'faturamento.xlsx'); showToast('Arquivo Excel exportado com sucesso!');
  };

  const getHashEmoji = (row: Record<string, unknown>): string => {
    const rowAny = row as Record<string, unknown>;
    const rawHash = rowAny['#'] ?? rowAny['Hash'] ?? rowAny['hash'];
    const candidate = rawHash ?? rowAny['prioridade'] ?? rowAny['Motivo Prioridade'] ?? rowAny['motivoPrioridade'] ?? rowAny['statusProg'] ?? rowAny['statusSap'] ?? '';
    const v = String(candidate || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    if (!v) return '';
    if (v.includes('vermelh') || v.includes('red')) return '🔴';
    if (v.includes('amarel') || v.includes('yellow')) return '🟡';
    if (v.includes('caveir') || v.includes('skull')) return '💀';
    return '';
  };

  const totalValue = React.useMemo(() => filteredData.matrix.reduce((sum, row) => sum + (row.valor || 0), 0), [filteredData.matrix]);
  const totalPep = React.useMemo(() => { const unique = new Set<string>(); for (const row of filteredData.matrix) { const pep = String(row.pep || '').trim(); if (pep) unique.add(pep); } return unique.size; }, [filteredData.matrix]);
  const numberFmt2 = React.useMemo(() => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), []);
  const numberFmt0 = React.useMemo(() => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }), []);
  const formatValorShort = (n: number) => { const abs = Math.abs(n); if (abs >= 1_000_000) return `${numberFmt2.format(n / 1_000_000)} Mi`; if (abs >= 1_000) return `${numberFmt2.format(n / 1_000)} Mil`; return numberFmt2.format(n); };
  const monthNamePt = (value: string) => { const names = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']; const n = parseInt(String(value).trim(), 10); if (!Number.isNaN(n) && n >= 1 && n <= 12) return names[n - 1]; return String(value); };
  // (removido: badge de status não usado nesta matriz)

  // Totais por dia (Data | R$ Total), ignorando o filtro de data (aplica os demais filtros)
  const dailyTotals = React.useMemo(() => {
    // Aplica filtros atuais exceto intervalo de datas
    let rows = rawRows;
    const regionFilterForOthers = (activeFilters.comparison || (selectedRegion !== 'all' ? selectedRegion : undefined)) as string | undefined;
    if (regionFilterForOthers) rows = rows.filter(r => (r.seccional || '').trim() === regionFilterForOthers);
  if (selectedPrioridade) rows = rows.filter(r => String((r as unknown as Record<string, unknown>)['Motivo Prioridade'] ?? (r as unknown as Record<string, unknown>).motivoPrioridade ?? '').trim() === selectedPrioridade);
    if (selectedTipo) rows = rows.filter(r => (r.tipo || '').trim() === selectedTipo);
    if (selectedMes) rows = rows.filter(r => String((r as unknown as Record<string, unknown>)['anoCiclo'] ?? '').trim() === selectedMes);
    if (pepSearch.trim()) rows = rows.filter(r => (r.pep || '').toLowerCase().includes(pepSearch.toLowerCase()));

    const parseDateToTime = (s: string): number => {
      if (!s) return Number.NaN;
      const str = String(s).trim();
      const m = str.match(/^(\d{1,2})[^\d](\d{1,2})[^\d](\d{2,4})$/);
      if (m) {
        const d = Number(m[1]);
        const mo = Number(m[2]) - 1;
        let y = Number(m[3]);
        if (y < 100) y += 2000;
        const dt = new Date(y, mo, d);
        if (!Number.isNaN(dt.getTime())) return dt.getTime();
      }
      const t = Date.parse(str);
      return Number.isNaN(t) ? Number.NaN : t;
    };

    const map = new Map<string, { label: string; time: number; total: number }>();
    for (const r of rows) {
      const ro = r as unknown as Record<string, unknown>;
      const label = String(ro['DATA'] ?? ro['Data'] ?? '').trim();
      const valor = (() => {
        const v = (ro['valor'] ?? ro['Valor'] ?? 0) as unknown;
        if (typeof v === 'number') return v;
        const s = String(v).replace(/R\$/i, '').replace(/\./g, '').replace(/,/g, '.').trim();
        const n = parseFloat(s);
        return Number.isNaN(n) ? 0 : n;
      })();
      const time = parseDateToTime(label);
      const prev = map.get(label) || { label, time, total: 0 };
      prev.total += Number(valor || 0);
      map.set(label, prev);
    }
    const arr = Array.from(map.values());
    arr.sort((a, b) => {
      const at = Number.isNaN(a.time) ? Infinity : a.time;
      const bt = Number.isNaN(b.time) ? Infinity : b.time;
      if (at === bt) return a.label.localeCompare(b.label);
      return at - bt;
    });
    return arr;
  }, [rawRows, activeFilters, selectedRegion, selectedPrioridade, selectedTipo, selectedMes, pepSearch]);

  // Clique numa data do painel lateral: define start/end para aquele dia
  const handleSelectDay = (label: string) => {
    let dt: Date | null = null;
    const m = label.match(/^(\d{1,2})[^\d](\d{1,2})[^\d](\d{2,4})$/);
    if (m) {
      const d = Number(m[1]);
      const mo = Number(m[2]) - 1;
      let y = Number(m[3]);
      if (y < 100) y += 2000;
      dt = new Date(y, mo, d);
    } else {
      const t = Date.parse(label);
      if (!Number.isNaN(t)) dt = new Date(t);
    }
    if (!dt || Number.isNaN(dt.getTime())) return;
    const start = new Date(dt); start.setHours(0, 0, 0, 0);
    const end = new Date(dt); end.setHours(23, 59, 59, 999);
    // Toggle: se já está selecionado este mesmo dia, limpa filtro; senão aplica
    if (selectedStartDate && selectedEndDate) {
      const s = new Date(selectedStartDate); s.setHours(0,0,0,0);
      const e = new Date(selectedEndDate); e.setHours(23,59,59,999);
      if (s.getTime() === start.getTime() && e.getTime() === end.getTime()) {
        setSelectedStartDate(undefined);
        setSelectedEndDate(undefined);
        return;
      }
    }
    setSelectedStartDate(start);
    setSelectedEndDate(end);
  };

  return (
    <div className="relative z-10 min-h-screen bg-transparent lovable">
      <FundoAnimado showBadge={false} />
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-green-500 shadow-md bg-gradient-to-r from-green-600 via-green-600/90 to-green-700">
        <div className="relative flex items-center justify-between h-16 px-4 pr-8 lg:px-6">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <h1 className="font-inter text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-wide leading-none text-white drop-shadow-[0_3px_6px_rgba(0,0,0,0.35)]">Previsão de Faturamento</h1>
          </div>
          <div className="flex items-center gap-3 lg:gap-6">
            <Button variant="outline" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)} className="flex items-center gap-2 text-gray-700 transition-all duration-200 bg-white border-gray-300 shadow-md lg:hidden rounded-xl hover:shadow-lg hover:bg-gray-50">
              <Menu className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center px-2 ml-4 overflow-hidden font-bold text-center bg-white shadow-md cursor-pointer rounded-xl hover:shadow-lg hover:bg-gray-50" onClick={() => navigate('/obras')} title="Ir para Obras" role="button" tabIndex={0}>
                <img src={LogoSetup} alt="Grupo Setup" className="object-contain w-auto h-10 max-w-full" />
              </div>
              <Button variant="outline" size="sm" onClick={clearFilters} title="Limpar filtros" className="flex items-center justify-center w-10 h-10 p-0 text-gray-700 transition-all duration-200 bg-white border-gray-300 shadow-md rounded-xl hover:shadow-lg hover:bg-gray-50">
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 lg:gap-4">
            <div className="flex items-center gap-2 lg:gap-3">
              <span className="hidden text-xs text-white lg:text-sm sm:inline">Valor Total</span>
              <div data-role="valor-total-card" className="px-2 py-1 text-sm font-semibold text-green-600 bg-white rounded-lg shadow-md lg:px-4 lg:py-2 lg:rounded-xl lg:text-base w-[105px] text-center whitespace-nowrap">{formatValorShort(totalValue)}</div>
            </div>
            <div className="flex items-center gap-2 lg:gap-3">
              <span className="hidden text-xs text-white lg:text-sm sm:inline">PEP</span>
              <div className="px-2 py-1 text-sm font-semibold text-green-600 bg-white rounded-lg shadow-md lg:px-4 lg:py-2 lg:rounded-xl lg:text-base w-[105px] text-center whitespace-nowrap">{totalPep}</div>
            </div>
          </div>
        </div>
      </header>

  <div className="relative flex [--gap:8px] sm:[--gap:16px] lg:[--gap:24px]" style={{ paddingTop: 'calc(3rem + 10px)' }}>
        {sidebarOpen && (<div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />)}

        <aside className={cn("fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 shadow-md overflow-y-auto z-50 transition-transform duration-300","lg:translate-x-0 lg:fixed lg:z-auto lg:h-[calc(100vh-4rem)]", sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0")} style={{ direction: 'rtl' }}>
          <div className="p-4 space-y-4 lg:p-6 lg:space-y-6" style={{ direction: 'ltr' }}>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold tracking-wider text-gray-500 uppercase">Regiões</h3>
              <div className="space-y-2">
                {regions.map((region) => (
                  <Button key={region} variant={selectedRegion === region ? "default" : "outline"} onClick={() => { setSelectedRegion(selectedRegion === region ? 'all' : region); setSidebarOpen(false); }} className="justify-start w-full text-sm transition-all duration-200 shadow-md rounded-xl hover:shadow-lg" size="sm">{region}</Button>
                ))}
              </div>
            </div>

            <div className="pt-4 space-y-3 border-t border-gray-200">
              <h3 className="text-sm font-semibold tracking-wider text-gray-500 uppercase">Filtros</h3>
              <select value={selectedPrioridade} onChange={(e) => setSelectedPrioridade(e.target.value)} className={`w-full h-10 px-3 text-sm border rounded-xl shadow-md transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${selectedPrioridade ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-900 border-gray-200'}`}>
                <option value="">Prioridade</option>
                {motivoPrioridadeList.map((m) => (<option key={m} value={m}>{m}</option>))}
              </select>
              <select value={selectedTipo} onChange={(e) => setSelectedTipo(e.target.value)} className={`w-full h-10 px-3 text-sm border rounded-xl shadow-md transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${selectedTipo ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-900 border-gray-200'}`}>
                <option value="">Mês Ciclo</option>
                {[...tiposList].sort((a, b) => (parseInt(String(a), 10) || 0) - (parseInt(String(b), 10) || 0)).map((t) => (<option key={t} value={t}>{monthNamePt(String(t))}</option>))}
              </select>
              <select value={selectedMes} onChange={(e) => setSelectedMes(e.target.value)} className={`w-full h-10 px-3 text-sm border rounded-xl shadow-md transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${selectedMes ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-900 border-gray-200'}`}>
                <option value="">Ano ciclo</option>
                {mesesList.map((m) => (<option key={m} value={m}>{m}</option>))}
              </select>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <DateRangeFilter startDate={selectedStartDate} endDate={selectedEndDate} onStartDateChange={setSelectedStartDate} onEndDateChange={setSelectedEndDate} />
            </div>

            <div className="pt-4 border-t border-gray-200">
              <PEPSearch searchValue={pepSearch} onSearchChange={setPepSearch} onClearSearch={clearPepSearch} />
            </div>
          </div>
        </aside>

  <main className="flex-1 w-full px-[var(--gap)] pt-0 pb-[var(--gap)] lg:ml-64 lg:mr-72" style={{ marginRight: isLg ? panelWidth : undefined }}>
          <div className="mb-8" />

          <Card className="bg-white border-gray-200 shadow-card hover:shadow-card-hover">
            <CardHeader className="flex flex-row items-center justify-between bg-white border-b border-gray-300 rounded-t-xl">
              <CardTitle className="text-lg font-semibold text-secondary-foreground">Matriz de Previsão de Faturamento</CardTitle>
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleExportExcel} className="flex items-center gap-2 text-gray-700 transition-all duration-200 bg-white border border-gray-300 shadow-md rounded-xl hover:bg-gray-50 hover:shadow-lg focus:outline-none focus:ring-0 ring-0">
                  <Copy className="w-4 h-4" /> Exportar Excel
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-hidden overflow-y-auto" ref={tableWrapperRef} data-role="main-table-wrapper">
          <Table style={{ tableLayout: 'auto', width: '100%' }}>
                  <colgroup>
                    {/* aumenta a coluna 'data' para criar espaçamento até a matriz lateral; usa px calc se disponível */}
                    <col style={dataColPx ? { width: `${dataColPx}px` } : { width: `calc(${getPercent('data')}% + 26px)` }} />
                    <col style={{ width: `${getPercent('pep')}%` }} />
                    <col style={{ width: `${getPercent('valor')}%` }} />
                    <col style={{ width: `${getPercent('equipes')}%` }} />
                    <col style={{ width: `${getPercent('cidadeObra')}%` }} />
                    <col style={{ width: `${getPercent('motivoPrioridade')}%` }} />
                    <col style={{ width: `${getPercent('hash')}%` }} />
                  </colgroup>
                    <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-100">
                      {([
                        { key: 'data', label: 'Data', sortable: true },
                        { key: 'pep', label: 'Serviços', sortable: true },
                        { key: 'valor', label: 'Valor', sortable: true },
                        { key: 'equipes', label: 'EQUIPES', sortable: true },
                        { key: 'cidadeObra', label: 'Cidade Obra', sortable: true },
                        { key: 'motivoPrioridade', label: 'Prioridade', sortable: true },
                        { key: 'hash', label: '#', sortable: false },
                      ] as { key: ColumnKey; label: string; sortable?: boolean }[]).map(col => (
                        <TableHead
                          key={col.key}
                          className={`relative font-semibold text-gray-700 transition-colors select-none hover:bg-gray-200 ${col.key !== 'hash' ? 'cursor-pointer' : ''} ${col.key === 'pep' ? 'whitespace-nowrap' : ''}`}
                          style={{ width: col.key === 'data' ? (dataColPx ? `${dataColPx}px` : `calc(${getPercent('data')}% + 26px)`) : `${getPercent(col.key)}%`, minWidth: 0 }}
                          onClick={() => { if (col.sortable) handleSort(col.key as keyof MatrixRow); }}
                        >
                          <div className={cn("flex items-center gap-2", ['pep'].includes(col.key) ? 'justify-center text-center' : '')}>
                            {col.label} {col.sortable ? getSortIcon(col.key as keyof MatrixRow) : null}
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.matrix.map((row, index) => (
                      <TableRow data-row-index={index} key={index} className={cn("cursor-pointer transition-all duration-200 select-none transform-gpu hover:scale-[1.01]", (Array.isArray(selectedMatrixRows) && selectedMatrixRows.includes(row.pep)) ? "bg-green-50 border-l-4 border-l-green-600 shadow-md hover:bg-green-100" : "hover:bg-gray-50 hover:shadow-md")} onClick={(e: React.MouseEvent) => {
                        if (e.shiftKey && typeof lastSelectedIndex === 'number' && lastSelectedIndex !== null) { e.preventDefault(); const start = Math.min(lastSelectedIndex, index); const end = Math.max(lastSelectedIndex, index); const range = filteredData.matrix.slice(start, end + 1).map(r => r.pep); setSelectedMatrixRows(prev => { const preserved = Array.isArray(prev) ? prev.filter(p => { const idx = filteredData.matrix.findIndex(r => r.pep === p); return idx === -1 || idx < start || idx > end; }) : []; return Array.from(new Set([...preserved, ...range])); }); setLastSelectedIndex(index); scrollToRow(index); return; }
                        if ((e.ctrlKey || e.metaKey)) { e.preventDefault(); setSelectedMatrixRows(prev => { if (Array.isArray(prev) && prev.includes(row.pep)) return prev.filter(p => p !== row.pep); return Array.isArray(prev) ? [...prev, row.pep] : [row.pep]; }); setLastSelectedIndex(index); scrollToRow(index);
                        } else { setSelectedMatrixRows([row.pep]); setLastSelectedIndex(index); scrollToRow(index); }
                      }} onContextMenu={(e: React.MouseEvent) => {
                        e.preventDefault(); const cx = e.clientX; const cy = e.clientY; setContextPos({ x: cx, y: cy }); setContextItems([
                          { id: 'copy-servicos', label: 'COPIAR SERVIÇOS', onClick: () => { const selected = (Array.isArray(selectedMatrixRows) && selectedMatrixRows.length) ? selectedMatrixRows : [row.pep]; const lines = filteredData.matrix.filter(r => selected.includes(r.pep)).map(r => r.pep); navigator.clipboard.writeText(lines.join('\n')).then(() => showToast('Serviços copiados!')).catch(() => showToast('Erro ao copiar')); setContextOpen(false); } },
                          { id: 'copy-table', label: 'COPIAR TABELA', onClick: () => { const selected = (Array.isArray(selectedMatrixRows) && selectedMatrixRows.length) ? selectedMatrixRows : [row.pep]; const rowsToCopy = filteredData.matrix.filter(r => selected.includes(r.pep)); const tsv = rowsToCopy.map(r => [r.pep, r.data, r.valor, r.equipes, r.cidadeObra].join('\t')).join('\n'); navigator.clipboard.writeText(tsv).then(() => showToast('Tabela copiada!')).catch(() => showToast('Erro ao copiar')); setContextOpen(false); } }
                        ]); setContextOpen(true);
                      }} onAuxClick={(e: React.MouseEvent) => { if ((e as React.MouseEvent).button === 1) { e.preventDefault(); const raw = String(row.valor || '0'); navigator.clipboard.writeText(raw).then(() => { showToast(`Valor R$ ${row.valor.toLocaleString('pt-BR')} copiado!`); }).catch(() => showToast('Erro ao copiar valor')); } }} title="Ctrl/Cmd+clique para selecionar múltiplas linhas. Clique com o botão direito para abrir menu de copiar">
                        {([
                          { key: 'data' as ColumnKey },
                          { key: 'pep' as ColumnKey },
                          { key: 'valor' as ColumnKey },
                          { key: 'equipes' as ColumnKey },
                          { key: 'cidadeObra' as ColumnKey },
                          { key: 'motivoPrioridade' as ColumnKey },
                          { key: 'hash' as ColumnKey },
                        ]).map(col => {
                          const style = { width: col.key === 'data' ? (dataColPx ? `${dataColPx}px` : `calc(${getPercent('data')}% + 26px)`) : `${getPercent(col.key)}%`, minWidth: 0 } as React.CSSProperties;
                          let content: React.ReactNode = null; let className = 'overflow-hidden text-sm truncate whitespace-nowrap text-ellipsis';
                          if (col.key === 'data') { content = row.data; className = 'font-mono text-sm whitespace-nowrap'; }
                          else if (col.key === 'pep') { content = row.pep; className = 'font-mono text-sm truncate'; }
                          else if (col.key === 'valor') { content = row.valor.toLocaleString('pt-BR'); className = 'text-sm text-right truncate'; }
                          else if (col.key === 'equipes') { content = row.equipes; className = 'overflow-hidden text-sm truncate whitespace-nowrap text-ellipsis'; }
                          else if (col.key === 'cidadeObra') { content = row.cidadeObra; className = 'overflow-hidden text-sm truncate whitespace-nowrap text-ellipsis'; }
                          else if (col.key === 'motivoPrioridade') { content = row.motivoPrioridade; className = 'overflow-hidden text-sm truncate whitespace-nowrap text-ellipsis'; }
                          else if (col.key === 'hash') { content = getHashEmoji(row as unknown as Record<string, unknown>); className = 'text-center'; }
                          return (<TableCell key={col.key} className={className} style={style}>{content}</TableCell>);
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </main>

        {/* Aside direito: Totais por Dia */}
        <aside className={cn(
          "hidden lg:flex fixed bottom-0 bg-transparent border-0 shadow-none z-50 top-[calc(5rem+10px)]"
        )} style={{ left: isLg ? panelLeft : undefined, width: isLg ? panelWidth : undefined }}>
          <div className="flex flex-col w-full h-full min-h-0 px-3 pt-0 pb-3 pointer-events-auto">
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-white border border-gray-200 rounded-xl shadow-card">
              <div className="sticky top-0 z-10 flex items-center justify-between px-3 py-2 text-xs font-semibold tracking-wide text-gray-600 uppercase border-b border-gray-200 bg-gray-50 rounded-t-xl">
                <span>Data</span>
                <span>R$ Total</span>
              </div>
              <div className="flex-1 min-h-0 overflow-x-hidden overflow-y-auto">
                {dailyTotals.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-gray-500">Sem dados</div>
                ) : (
                  <Table className="w-full" style={{ tableLayout: 'fixed' }}>
                    <colgroup>
                      <col style={{ width: '60%' }} />
                      <col style={{ width: '40%' }} />
                    </colgroup>
                    <TableBody>
                      {dailyTotals.map((d, idx) => {
                        const isSelected = (() => {
                          if (!selectedStartDate || !selectedEndDate) return false;
                          const selStart = new Date(selectedStartDate); selStart.setHours(0,0,0,0);
                          const selEnd = new Date(selectedEndDate); selEnd.setHours(23,59,59,999);
                          let t = Number.NaN;
                          const m = d.label.match(/^(\d{1,2})[^\d](\d{1,2})[^\d](\d{2,4})$/);
                          if (m) {
                            const day = Number(m[1]); const month = Number(m[2]) - 1; let y = Number(m[3]); if (y < 100) y += 2000; t = new Date(y, month, day).getTime();
                          } else {
                            const parsed = Date.parse(d.label); t = Number.isNaN(parsed) ? Number.NaN : parsed;
                          }
                          if (Number.isNaN(t)) return false;
                          return t >= selStart.getTime() && t <= selEnd.getTime();
                        })();
                        return (
                          <TableRow
                            key={idx}
                            className={cn("hover:bg-gray-50 cursor-pointer", isSelected ? "bg-green-50 border-l-4 border-l-green-600" : "")}
                            onClick={() => handleSelectDay(d.label)}
                            title="Clique para filtrar por este dia"
                          >
                            <TableCell className="py-2 pr-2 font-mono text-sm truncate">{d.label}</TableCell>
                            <TableCell className="py-2 font-mono text-sm text-right">{numberFmt0.format(d.total)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>

      <ContextMenu open={contextOpen} position={contextPos} items={contextItems} onClose={() => setContextOpen(false)} />
    </div>
  );
}
