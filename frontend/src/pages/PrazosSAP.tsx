// Dashboard consolidado: conteúdo migrado da antiga PrazosSAP1
import React, { useEffect, useState, useRef } from 'react';
import ContextMenu from '../components/ContextMenu';
import { useNavigate } from 'react-router-dom';
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Copy, RotateCcw, Menu, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { ChartContainer } from "../components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { DateRangeFilter } from '../components/DateRangeFilter';
import { PEPSearch } from '../components/PEPSearch';
import { cn } from "../lib/utils";
import { getMatrizDados, getStatusEnerPep, getStatusConcPep, getStatusServicoContagem, getStatusSapUnicos, getTiposUnicos, getMesesConclusao } from '../services/api';
import type { MatrizItem } from '../services/api';
import { showToast } from '../components/toast';
import LogoSetup from '../assets/LogoSetup1.png';
import { FundoAnimado } from '../components/FundoAnimado';

interface DashboardData {
	statusENER: { name: string; value: number; qtd: number }[]; // Valor (R$) e quantidade
	statusCONC: { name: string; value: number; qtd: number }[];
	comparison: { name: string; value: number; qtd: number }[];
	reasons: { name: string; value: number; qtd: number }[];
	matrix: { pep: string; prazo: string; dataConclusao: string; status: string; rs: number }[];
}

// Tipo mínimo para o renderer de rótulos das barras
type BarLabelProps = {
	x?: number | string;
	y?: number | string;
	width?: number | string;
	value?: number | string;
	index?: number;
};

// Tipos mínimos para renderizadores e callbacks do recharts (evitar `any`)
type ChartTickProps = { x?: number; y?: number; payload?: { value?: string } };
type BarDatumLike = { name?: string; payload?: { name?: string } } | undefined;

export default function PrazosSAP() {
	const navigate = useNavigate();
	const [selectedRegion, setSelectedRegion] = useState<string>('all');
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [pepSearch, setPepSearch] = useState('');
	const [selectedStartDate, setSelectedStartDate] = useState<Date | undefined>(undefined);
	const [selectedEndDate, setSelectedEndDate] = useState<Date | undefined>(undefined);
	const [selectedStatusSap, setSelectedStatusSap] = useState<string>('');
	const [selectedTipo, setSelectedTipo] = useState<string>('');
	const [selectedMes, setSelectedMes] = useState<string>('');
	const [selectedMatrixRows, setSelectedMatrixRows] = useState<string[]>([]);
	const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
	// Context menu state
	const [contextOpen, setContextOpen] = useState(false);
	const [contextPos, setContextPos] = useState({ x: 0, y: 0 });
	const [contextItems, setContextItems] = useState<{ id: string; label: string; onClick: () => void }[]>([]);

	// garante que os estados do menu de contexto sejam lidos pelo TS (evita TS6133)
	useEffect(() => {
		// leitura intencional para suprimir 'declared but never read' quando o compilador
		// não detecta uso em JSX em alguns casos.
		void contextOpen;
		void contextPos;
		void contextItems;
	}, [contextOpen, contextPos, contextItems]);

	const [sortConfig, setSortConfig] = useState<{ key?: keyof DashboardData['matrix'][0]; direction?: 'asc' | 'desc' }>({});
	const [regions, setRegions] = useState<string[]>([]);
	const [rawRows, setRawRows] = useState<MatrizItem[]>([]);
	const [statusEnerMap, setStatusEnerMap] = useState<Record<string, Record<string, number>>>({});
	const [statusConcMap, setStatusConcMap] = useState<Record<string, Record<string, number>>>({});
	const [reasonsMap, setReasonsMap] = useState<Record<string, Record<string, number>>>({});
	const [statusSapList, setStatusSapList] = useState<string[]>([]);
	const [tiposList, setTiposList] = useState<string[]>([]);
	const [mesesList, setMesesList] = useState<string[]>([]);

	// Título da janela quando nesta página
	useEffect(() => {
		const prevTitle = document.title;
		document.title = 'Prazos SAP';
		return () => {
			document.title = prevTitle;
		};
	}, []);

	// Estados para filtros interativos
	const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

	const clearFilters = () => {
		setSelectedRegion('all');
		setActiveFilters({});
		setSelectedStartDate(undefined);
		setSelectedEndDate(undefined);
		setPepSearch('');
		setSelectedStatusSap('');
		setSelectedTipo('');
		setSelectedMes('');
		showToast('Filtros limpos!');
	};

	const clearPepSearch = () => {
		setPepSearch('');
		showToast('Pesquisa PEP limpa!');
	};

	// Ordenação
	const handleSort = (key: keyof DashboardData['matrix'][0]) => {
		let direction: 'asc' | 'desc' = 'asc';
		if (sortConfig.key === key && sortConfig.direction === 'asc') {
			direction = 'desc';
		}
		setSortConfig({ key, direction });
	};

	const getSortIcon = (columnKey: keyof DashboardData['matrix'][0]) => {
		if (sortConfig.key !== columnKey) {
			return <ChevronsUpDown className="w-4 h-4 text-gray-500" />;
		}
		return sortConfig.direction === 'asc'
			? <ChevronUp className="w-4 h-4 text-green-600" />
			: <ChevronDown className="w-4 h-4 text-green-600" />;
	};

	// Filtros interativos
	const handleChartClick = (chartType: 'statusENER' | 'statusCONC' | 'reasons' | 'comparison', label: string) => {
		const newFilters = { ...activeFilters };
		if (newFilters[chartType] === label) {
			delete newFilters[chartType];
			console.log(`[TOAST] Filtro removido: ${label}`);
		} else {
			newFilters[chartType] = label;
			console.log(`[TOAST] Filtro aplicado: ${label}`);
		}
		setActiveFilters(newFilters);
	};

	// Refs dos gráficos
	const statusENERRef = useRef<HTMLDivElement>(null);
	const comparisonRef = useRef<HTMLDivElement>(null);
	const statusCONCRef = useRef<HTMLDivElement>(null);
	const reasonsRef = useRef<HTMLDivElement>(null);
	// Ref para o wrapper da tabela (usado para rolamento automático)
	const tableWrapperRef = useRef<HTMLDivElement | null>(null);

	// Helper para rolar a linha visível ao navegar por teclado/seleção
	const scrollToRow = (idx: number) => {
		try {
			const container = tableWrapperRef.current;
			let el: HTMLElement | null = null;
			if (container) {
				el = container.querySelector(`[data-row-index="${idx}"]`);
			}
			if (!el) {
				el = document.querySelector(`[data-row-index="${idx}"]`);
			}
			if (el) {
				el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
			}
		} catch (err) {
			// falhar silenciosamente se algo der errado
			console.debug('scrollToRow error', err);
		}
	};

	// Renderizador de rótulos: quando a barra estiver ativa, usa preto e negrito
	const makeLabelRenderer = (
		dataArr: { name: string; qtd: number }[],
		isActive: (name: string) => boolean,
	) => (props: BarLabelProps) => {
		const { x = 0, y = 0, width = 0, value, index = 0 } = props || {} as BarLabelProps;
		const item = dataArr?.[index];
		const active = item ? isActive(item.name) : false;
		const cx = Number(x) + Number(width) / 2;
		const cy = Number(y) - 6;
		return (
			<text
				x={cx}
				y={cy}
				textAnchor="middle"
				fill={active ? '#111827' : 'hsl(var(--foreground))'}
				fontWeight={active ? 700 : 400}
				fontSize={12}
			>
				{value}
			</text>
		);
	};

	// Formatação de valores curtos com 2 casas decimais e sufixos Mi/Mil
	const numberFmt2 = React.useMemo(() => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), []);
	const formatValorShort = (n: number) => {
		const abs = Math.abs(n);
		if (abs >= 1_000_000) return `${numberFmt2.format(n / 1_000_000)} Mi`;
		if (abs >= 1_000) return `${numberFmt2.format(n / 1_000)} Mil`;
		return numberFmt2.format(n);
	};

	// Renderizador para rótulos de Valor (barra azul) no comparativo
	const makeValueLabelRenderer = (
		dataArr: { name: string; value: number }[],
		isActive: (name: string) => boolean,
	) => (props: BarLabelProps) => {
		const { x = 0, y = 0, width = 0, value, index = 0 } = props || {} as BarLabelProps;
		const item = dataArr?.[index];
		const active = item ? isActive(item.name) : false;
		const cx = Number(x) + Number(width) / 2;
		const cy = Number(y) - 6;
		const v = Number(value) || 0;
		return (
			<text
				x={cx}
				y={cy}
				textAnchor="middle"
				fill={active ? '#111827' : 'hsl(var(--foreground))'}
				fontWeight={active ? 700 : 400}
				fontSize={12}
			>
				{formatValorShort(v)}
			</text>
		);
	};

	// Dados calculados
	const filteredData = React.useMemo(() => {
		// Sinais de suporte de campos na matriz
		const anyHasEner = rawRows.some(r => (r.statusEner || '').trim());
		const anyHasConc = rawRows.some(r => (r.statusConc || '').trim());
		const anyHasMotivos = rawRows.some(r => (r.statusServico || '').trim());

		// 1) Base de linhas para OUTROS gráficos e TABELA: respeita comparação e região
		const regionFilterForOthers = (activeFilters.comparison || (selectedRegion !== 'all' ? selectedRegion : undefined)) as string | undefined;
		let rowsForOthers = rawRows;
				if (regionFilterForOthers) rowsForOthers = rowsForOthers.filter(r => (r.seccional || '').trim() === regionFilterForOthers);

				// Filtragem por status ENER / CONC / Motivos.
				// Se a matriz (rawRows) possui os campos auxiliares, filtramos diretamente por eles.
				// Caso contrário, usamos os mapas agregados (statusEnerMap/statusConcMap/reasonsMap)
				// para derivar as seccionais válidas para o rótulo selecionado.
				if (activeFilters.statusENER) {
					if (anyHasEner) {
						rowsForOthers = rowsForOthers.filter(r => (r.statusEner || '').trim() === activeFilters.statusENER);
					} else if (statusEnerMap && statusEnerMap[activeFilters.statusENER]) {
						const allowed = new Set(Object.keys(statusEnerMap[activeFilters.statusENER] || {}));
						rowsForOthers = rowsForOthers.filter(r => allowed.has((r.seccional || '').trim()));
					}
				}

				if (activeFilters.statusCONC) {
					if (anyHasConc) {
						rowsForOthers = rowsForOthers.filter(r => (r.statusConc || '').trim() === activeFilters.statusCONC);
					} else if (statusConcMap && statusConcMap[activeFilters.statusCONC]) {
						const allowed = new Set(Object.keys(statusConcMap[activeFilters.statusCONC] || {}));
						rowsForOthers = rowsForOthers.filter(r => allowed.has((r.seccional || '').trim()));
					}
				}

				if (activeFilters.reasons) {
					if (anyHasMotivos) {
						rowsForOthers = rowsForOthers.filter(r => (r.statusServico || '').trim() === activeFilters.reasons);
					} else if (reasonsMap && reasonsMap[activeFilters.reasons]) {
						const allowed = new Set(Object.keys(reasonsMap[activeFilters.reasons] || {}));
						rowsForOthers = rowsForOthers.filter(r => allowed.has((r.seccional || '').trim()));
					}
				}
		if (pepSearch.trim()) rowsForOthers = rowsForOthers.filter(r => (r.pep || '').toLowerCase().includes(pepSearch.toLowerCase()));

		// 2) Base de linhas para COMPARATIVO: NÃO aplicar filtro de comparação nem selectedRegion, apenas demais filtros
		let rowsForComparison = rawRows;
		if (activeFilters.statusENER && anyHasEner) rowsForComparison = rowsForComparison.filter(r => (r.statusEner || '').trim() === activeFilters.statusENER);
		if (activeFilters.statusCONC && anyHasConc) rowsForComparison = rowsForComparison.filter(r => (r.statusConc || '').trim() === activeFilters.statusCONC);
		if (activeFilters.reasons && anyHasMotivos) rowsForComparison = rowsForComparison.filter(r => (r.statusServico || '').trim() === activeFilters.reasons);

		// 2) Agregações serão feitas inline abaixo

	// Se a matriz não tiver os campos (produção antiga), usar fallback dos mapas por contagem
	const hasEner = anyHasEner;
	const hasConc = anyHasConc;
	const hasMotivos = anyHasMotivos;

		const sumFromMap = (map: Record<string, Record<string, number>>) => {
			const arr: { name: string; value: number; qtd: number }[] = [];
			const regionFilter = (activeFilters.comparison || (selectedRegion !== 'all' ? selectedRegion : undefined)) as string | undefined;
			Object.entries(map).forEach(([status, byRegion]) => {
				let count = 0;
				if (regionFilter) {
					count = byRegion[regionFilter] || 0;
				} else {
					count = Object.values(byRegion).reduce((s, n) => s + (n || 0), 0);
				}
				arr.push({ name: status, value: count, qtd: count });
			});
			return arr.sort((a, b) => b.qtd - a.qtd);
		};

		const statusENER = hasEner ? (function() { const m = new Map<string, { valor: number; qtd: number }>(); for (const r of rowsForOthers) { const k = (r.statusEner || '').trim(); if (!k) continue; const v = typeof r.valor === 'number' ? r.valor : parseFloat(String(r.valor || '0').replace(/R\$\s?/, '').replace(/\./g, '').replace(/,/g, '.')) || 0; const cur = m.get(k) || { valor: 0, qtd: 0 }; m.set(k, { valor: cur.valor + v, qtd: cur.qtd + 1 }); } return Array.from(m.entries()).map(([name, obj]) => ({ name, value: obj.valor, qtd: obj.qtd })).sort((a, b) => b.qtd - a.qtd); })() : sumFromMap(statusEnerMap);
		const statusCONC = hasConc ? (function() { const m = new Map<string, { valor: number; qtd: number }>(); for (const r of rowsForOthers) { const k = (r.statusConc || '').trim(); if (!k) continue; const v = typeof r.valor === 'number' ? r.valor : parseFloat(String(r.valor || '0').replace(/R\$\s?/, '').replace(/\./g, '').replace(/,/g, '.')) || 0; const cur = m.get(k) || { valor: 0, qtd: 0 }; m.set(k, { valor: cur.valor + v, qtd: cur.qtd + 1 }); } return Array.from(m.entries()).map(([name, obj]) => ({ name, value: obj.valor, qtd: obj.qtd })).sort((a, b) => b.qtd - a.qtd); })() : sumFromMap(statusConcMap);
		const reasons = hasMotivos ? (function() { const m = new Map<string, { valor: number; qtd: number }>(); for (const r of rowsForOthers) { const k = (r.statusServico || '').trim(); if (!k) continue; const v = typeof r.valor === 'number' ? r.valor : parseFloat(String(r.valor || '0').replace(/R\$\s?/, '').replace(/\./g, '').replace(/,/g, '.')) || 0; const cur = m.get(k) || { valor: 0, qtd: 0 }; m.set(k, { valor: cur.valor + v, qtd: cur.qtd + 1 }); } return Array.from(m.entries()).map(([name, obj]) => ({ name, value: obj.valor, qtd: obj.qtd })).sort((a, b) => b.qtd - a.qtd); })() : sumFromMap(reasonsMap);
		const comparison = (function() { const m = new Map<string, { valor: number; qtd: number }>(); for (const r of rowsForComparison) { const s = (r.seccional || '').trim(); if (!s) continue; const v = typeof r.valor === 'number' ? r.valor : parseFloat(String(r.valor || '0').replace(/R\$\s?/, '').replace(/\./g, '').replace(/,/g, '.')) || 0; const cur = m.get(s) || { valor: 0, qtd: 0 }; m.set(s, { valor: cur.valor + v, qtd: cur.qtd + 1 }); } return Array.from(m.entries()).map(([name, obj]) => ({ name, value: obj.valor, qtd: obj.qtd })).sort((a, b) => b.qtd - a.qtd); })();

		// 3) Linhas da matriz (após filtros), com sort
		let tableRows: DashboardData['matrix'] = rowsForOthers.map(r => {
			const valorNum = typeof r.valor === 'number' ? r.valor : parseFloat(String(r.valor || '0').replace(/R\$\s?/, '').replace(/\./g, '').replace(/,/g, '.')) || 0;
			return {
				pep: String(r.pep || ''),
				prazo: String(r.prazo || ''),
				dataConclusao: String(r.dataConclusao || ''),
				status: String(r.statusSap || ''),
				rs: valorNum,
			};
		});

		if (sortConfig.key) {
			// Helpers para ordenar datas em formato dd/mm/aaaa (ou outros parseáveis)
			const parseDate = (s: string): number => {
				if (!s) return Number.NaN;
				const m = s.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
				if (m) {
					const d = Number(m[1]);
					const mo = Number(m[2]) - 1;
					const y = Number(m[3]);
					const dt = new Date(y, mo, d);
					return dt.getTime();
				}
				const t = Date.parse(s);
				return Number.isNaN(t) ? Number.NaN : t;
			};

			const compareNumbers = (x: number, y: number) => {
				if (Number.isNaN(x) && Number.isNaN(y)) return 0;
				if (Number.isNaN(x)) return 1; // valores vazios ao final
				if (Number.isNaN(y)) return -1;
				return x - y;
			};

			tableRows = [...tableRows].sort((a, b) => {
				const key = sortConfig.key!;
				const dir = sortConfig.direction === 'asc' ? 1 : -1;
				const aValue = a[key];
				const bValue = b[key];

				if (key === 'rs') {
					return dir * ((aValue as number) - (bValue as number));
				}

				if (key === 'prazo' || key === 'dataConclusao') {
					const da = parseDate(String(aValue));
					const db = parseDate(String(bValue));
					return dir * compareNumbers(da, db);
				}

				const aStr = String(aValue).toLowerCase();
				const bStr = String(bValue).toLowerCase();
				if (aStr < bStr) return -1 * dir;
				if (aStr > bStr) return 1 * dir;
				return 0;
			});
		}

		return {
			statusENER,
			statusCONC,
			comparison,
			reasons,
			matrix: tableRows,
		} as DashboardData;
	}, [rawRows, selectedRegion, activeFilters, pepSearch, sortConfig, statusEnerMap, statusConcMap, reasonsMap]);

	// Handler de teclado: navegação por setas e seleções estendidas
	useEffect(() => {
		const handler = (ev: KeyboardEvent) => {
			// não interferir quando um input/textarea ou elemento editável estiver focado
			const active = document.activeElement as HTMLElement | null;
			if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) return;

			const rows = (filteredData && Array.isArray(filteredData.matrix)) ? filteredData.matrix : [];
			if (!rows.length) return;

			// Ctrl/Cmd + Shift + ArrowDown => selecionar até o fim (comportamento já existente)
			if ((ev.ctrlKey || ev.metaKey) && ev.shiftKey && ev.key === 'ArrowDown') {
				ev.preventDefault();
				const start = (typeof lastSelectedIndex === 'number' && lastSelectedIndex >= 0) ? lastSelectedIndex : 0;
				const toSelect = rows.slice(start).map(r => r.pep);
				// preserva seleção anterior antes do start quando existir
				setSelectedMatrixRows(prev => {
					const prefix = Array.isArray(prev) ? prev.filter(p => {
						const idx = rows.findIndex(r => r.pep === p);
						return idx >= 0 && idx < start;
					}) : [];
					return Array.from(new Set([...prefix, ...toSelect]));
				});
				setLastSelectedIndex(rows.length - 1);
				scrollToRow(rows.length - 1);
				return;
			}

			// ArrowDown / ArrowUp navegação simples
			if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
				ev.preventDefault();
				// determina índice atual: preferir lastSelectedIndex, caso contrário usar primeiro selecionado
				let current = typeof lastSelectedIndex === 'number' && lastSelectedIndex >= 0 ? lastSelectedIndex : -1;
				if (current === -1 && Array.isArray(selectedMatrixRows) && selectedMatrixRows.length) {
					const firstPep = selectedMatrixRows[0];
					const idx = rows.findIndex(r => r.pep === firstPep);
					if (idx >= 0) current = idx;
				}

				const dir = ev.key === 'ArrowDown' ? 1 : -1;
				let next = current + dir;
				if (next < 0) next = 0;
				if (next > rows.length - 1) next = rows.length - 1;

				if (ev.shiftKey && current >= 0) {
					// estender seleção entre current e next, preservando seleção fora do intervalo atual
					const start = Math.min(current, next);
					const end = Math.max(current, next);
					const range = rows.slice(start, end + 1).map(r => r.pep);
					setSelectedMatrixRows(prev => {
						const preserved = Array.isArray(prev) ? prev.filter(p => {
							const idx = rows.findIndex(r => r.pep === p);
							return idx === -1 || idx < start || idx > end; // mantém itens fora do novo intervalo
						}) : [];
						return Array.from(new Set([...preserved, ...range]));
					});
					setLastSelectedIndex(next);
					scrollToRow(next);
					return;
				}

				// sem shift: selecionar apenas a próxima linha (substitui seleção)
				setSelectedMatrixRows([rows[next].pep]);
				setLastSelectedIndex(next);
				scrollToRow(next);
				return;
			}
		};
		document.addEventListener('keydown', handler);
		return () => document.removeEventListener('keydown', handler);
	}, [lastSelectedIndex, filteredData, selectedMatrixRows]);

	// Atualiza lista de regiões conforme dados carregados (sem aplicar filtros interativos)
	useEffect(() => {
		const m = new Map<string, number>();
		for (const r of rawRows) {
			const s = (r.seccional || '').trim();
			if (!s) continue;
			const v = typeof r.valor === 'number' ? r.valor : parseFloat(String(r.valor || '0').replace(/R\$\s?/, '').replace(/\./g, '').replace(/,/g, '.')) || 0;
			m.set(s, (m.get(s) || 0) + v);
		}
		const regionList = Array.from(m.entries()).sort((a, b) => b[1] - a[1]).map(([name]) => name);
		setRegions(regionList);
	}, [rawRows]);

	// Carregar listas dos filtros (Status SAP, Tipo, Mês)
	useEffect(() => {
		let isCancelled = false;
		Promise.all([getStatusSapUnicos(), getTiposUnicos(), getMesesConclusao()])
			.then(([s1, s2, s3]) => {
				if (isCancelled) return;
				setStatusSapList(s1.data || []);
				setTiposList(s2.data || []);
				setMesesList(s3.data || []);
			})
			.catch(err => {
				console.error('Erro ao carregar listas de filtros:', err);
				setStatusSapList([]);
				setTiposList([]);
				setMesesList([]);
			});
		return () => { isCancelled = true; };
	}, []);

	// Carga da matriz com filtros (exceto região/comparativo, que são aplicados apenas no cliente)
	useEffect(() => {
		let isCancelled = false;
		const fmt = (d?: Date) => d ? `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}` : undefined;
		const params: Record<string, string> = {};
		// NÃO enviar seccional aqui: manter todas as regiões para o gráfico comparativo
		const di = fmt(selectedStartDate);
		const df = fmt(selectedEndDate);
		if (di && df) {
			params.data_inicio = di;
			params.data_fim = df;
		}
		if (selectedStatusSap) params.status_sap = selectedStatusSap;
		if (selectedTipo) params.tipo = selectedTipo;
		if (selectedMes) params.mes = selectedMes;
		// Filtros interativos dos gráficos
		if (activeFilters.statusENER) params.status_ener = activeFilters.statusENER;
		if (activeFilters.statusCONC) params.status_conc = activeFilters.statusCONC;
		if (activeFilters.reasons) params.status_servico = activeFilters.reasons;
		const loadMatrix = async () => {
			try {
				const res = await getMatrizDados(params);
				if (isCancelled) return;
				const data = (res.data || []) as MatrizItem[];
				setRawRows(data);
				// Informe de sucesso com quantidade de linhas carregadas
				try { showToast(`PrazosSAP Carregado: ${data.length} linhas`); } catch { /* ignore toast errors */ }
			} catch (e) {
				console.error('Erro ao carregar matriz:', e);
				setRawRows([]);
			}
		};
		loadMatrix();
		return () => { isCancelled = true; };
	}, [selectedStartDate, selectedEndDate, selectedStatusSap, selectedTipo, selectedMes, activeFilters.statusENER, activeFilters.statusCONC, activeFilters.reasons]);

	// Fallback: buscar mapas agregados do backend quando necessário (produção antiga)
	useEffect(() => {
		let isCancelled = false;
		const fmt = (d?: Date) => d ? `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}` : undefined;
		const params: Record<string, string> = {};
		if (selectedRegion !== 'all') params.seccional = selectedRegion;
		const di = fmt(selectedStartDate);
		const df = fmt(selectedEndDate);
		if (di && df) {
			params.data_inicio = di;
			params.data_fim = df;
		}
		if (selectedStatusSap) params.status_sap = selectedStatusSap;
		if (selectedTipo) params.tipo = selectedTipo;
		if (selectedMes) params.mes = selectedMes;
		const fetchFallback = async () => {
			try {
				const [enerRes, concRes, reasonsRes] = await Promise.all([
					getStatusEnerPep(params),
					getStatusConcPep(params),
					getStatusServicoContagem(params),
				]);
				if (isCancelled) return;
				setStatusEnerMap(enerRes.data || {});
				setStatusConcMap(concRes.data || {});
				setReasonsMap(reasonsRes.data || {});
			} catch (e) {
				console.error('Erro ao carregar mapas de fallback:', e);
				if (isCancelled) return;
				setStatusEnerMap({});
				setStatusConcMap({});
				setReasonsMap({});
			}
		};
		fetchFallback();
		return () => { isCancelled = true; };
	}, [selectedRegion, selectedStartDate, selectedEndDate, selectedStatusSap, selectedTipo, selectedMes]);

	// Copiar imagem
	const copyChartImage = async (chartRef: React.RefObject<HTMLDivElement | null>, chartName: string) => {
		if (!chartRef.current) return;
		try {
			const canvas = await html2canvas(chartRef.current, { backgroundColor: '#ffffff', scale: 2, useCORS: true, allowTaint: true });
			canvas.toBlob((blob) => {
				if (blob) {
					const item = new ClipboardItem({ 'image/png': blob });
					navigator.clipboard.write([item]).then(() => {
						showToast(`Imagem do gráfico ${chartName} copiada!`);
					}).catch(() => {
						showToast(`Erro ao copiar imagem do gráfico ${chartName}`);
					});
				}
			});
		} catch (error) {
			console.error('Erro ao capturar gráfico:', error);
			showToast(`Erro ao copiar imagem do gráfico ${chartName}`);
		}
	};

	// Exportar Excel
	const handleExportExcel = () => {
		const worksheet = XLSX.utils.json_to_sheet(filteredData.matrix.map(row => ({
			'PEP': row.pep,
			'Prazo': row.prazo,
			'Data Conclusão': row.dataConclusao,
			'Status SAP': row.status,
			'Valor (R$)': row.rs
		})));
		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Prazos SAP');
		XLSX.writeFile(workbook, 'prazos_sap.xlsx');
		showToast('Arquivo Excel exportado com sucesso!');
	};

	// KPIs devem refletir os filtros atuais sobre as linhas usadas na tabela e outros gráficos (rowsForOthers)
	const totalValue = React.useMemo(() => filteredData.matrix.reduce((sum, row) => sum + (row.rs || 0), 0), [filteredData.matrix]);
	const totalPep = React.useMemo(() => filteredData.matrix.length, [filteredData.matrix.length]);

	return (
		<div className="relative z-10 min-h-screen bg-transparent lovable">
			{/* Fundo animado em toda a página (fixo atrás do conteúdo) - sem badge nesta página */}
			<FundoAnimado showBadge={false} />
			<header className="fixed top-0 left-0 right-0 z-50 border-b border-green-500 shadow-md bg-gradient-to-r from-green-600 via-green-600/90 to-green-700">
				<div className="relative flex items-center justify-between h-16 px-4 pr-8 lg:px-6">
					{/* Título centralizado */}
					<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
						<h1 className="font-inter text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-wide leading-none text-white drop-shadow-[0_3px_6px_rgba(0,0,0,0.35)]">
							Prazos SAP
						</h1>
					</div>
					<div className="flex items-center gap-3 lg:gap-6">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setSidebarOpen(!sidebarOpen)}
							className="flex items-center gap-2 text-gray-700 transition-all duration-200 bg-white border-gray-300 shadow-md lg:hidden rounded-xl hover:shadow-lg hover:bg-gray-50"
						>
							<Menu className="w-4 h-4" />
						</Button>
						<div className="flex items-center gap-3">
							<div
								className="flex items-center justify-center px-2 ml-4 overflow-hidden font-bold text-center bg-white shadow-md cursor-pointer rounded-xl hover:shadow-lg hover:bg-gray-50"
								onClick={() => navigate('/obras')}
								title="Ir para Obras"
								role="button"
								tabIndex={0}
							>
								<img src={LogoSetup} alt="Grupo Setup" className="object-contain w-auto h-10 max-w-full" />
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={clearFilters}
								title="Limpar filtros"
								className="flex items-center justify-center w-10 h-10 p-0 text-gray-700 transition-all duration-200 bg-white border-gray-300 shadow-md rounded-xl hover:shadow-lg hover:bg-gray-50"
							>
								<RotateCcw className="w-4 h-4" />
							</Button>
						</div>
					</div>
					<div className="flex items-center gap-2 lg:gap-4">
						<div className="flex items-center gap-2 lg:gap-3">
							<span className="hidden text-xs text-white lg:text-sm sm:inline">Valor Total</span>
							<div className="px-2 py-1 text-sm font-semibold text-green-600 bg-white rounded-lg shadow-md lg:px-4 lg:py-2 lg:rounded-xl lg:text-base w-[105px] text-center whitespace-nowrap">
								{formatValorShort(totalValue)}
							</div>
						</div>
						<div className="flex items-center gap-2 lg:gap-3">
							<span className="hidden text-xs text-white lg:text-sm sm:inline">PEP</span>
							<div className="px-2 py-1 text-sm font-semibold text-green-600 bg-white rounded-lg shadow-md lg:px-4 lg:py-2 lg:rounded-xl lg:text-base w-[105px] text-center whitespace-nowrap">
								{totalPep}
							</div>
						</div>
					</div>
				</div>
			</header>

			<div className="relative flex" style={{ paddingTop: 'calc(4rem + 16px)' }}>
				{sidebarOpen && (
					<div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
				)}

				<aside className={cn(
					"fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 shadow-md overflow-y-auto z-50 transition-transform duration-300",
					"lg:translate-x-0 lg:fixed lg:z-auto lg:h-[calc(100vh-4rem)]",
					sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
				)} style={{ direction: 'rtl' }}>
					<div className="p-4 space-y-4 lg:p-6 lg:space-y-6" style={{ direction: 'ltr' }}>
						{/* Logo removido do sidebar para manter apenas no header */}
						<div className="space-y-3">
							<h3 className="text-sm font-semibold tracking-wider text-gray-500 uppercase">Regiões</h3>
							<div className="space-y-2">
								{regions.map((region) => (
									<Button
										key={region}
										variant={selectedRegion === region ? "default" : "outline"}
										onClick={() => {
											setSelectedRegion(selectedRegion === region ? 'all' : region);
											setSidebarOpen(false);
										}}
										className="justify-start w-full text-sm transition-all duration-200 shadow-md rounded-xl hover:shadow-lg"
										size="sm"
									>
										{region}
									</Button>
								))}
							</div>
						</div>

						<div className="pt-4 space-y-3 border-t border-gray-200">
							<h3 className="text-sm font-semibold tracking-wider text-gray-500 uppercase">Filtros</h3>
							<select
								value={selectedStatusSap}
								onChange={(e) => setSelectedStatusSap(e.target.value)}
								className={`w-full h-10 px-3 text-sm border rounded-xl shadow-md transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${selectedStatusSap ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-900 border-gray-200'}`}
							>
								<option value="">Status SAP</option>
								{statusSapList.map((s) => (
									<option key={s} value={s}>{s}</option>
								))}
							</select>
							<select
								value={selectedTipo}
								onChange={(e) => setSelectedTipo(e.target.value)}
								className={`w-full h-10 px-3 text-sm border rounded-xl shadow-md transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${selectedTipo ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-900 border-gray-200'}`}
							>
								<option value="">Tipo</option>
								{tiposList.map((t) => (
									<option key={t} value={t}>{t}</option>
								))}
							</select>
							<select
								value={selectedMes}
								onChange={(e) => setSelectedMes(e.target.value)}
								className={`w-full h-10 px-3 text-sm border rounded-xl shadow-md transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${selectedMes ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-900 border-gray-200'}`}
							>
								<option value="">Mês</option>
								{mesesList.map((m) => (
									<option key={m} value={m}>{m}</option>
								))}
							</select>
						</div>

						<div className="pt-4 border-t border-gray-200">
							<DateRangeFilter
								startDate={selectedStartDate}
								endDate={selectedEndDate}
								onStartDateChange={setSelectedStartDate}
								onEndDateChange={setSelectedEndDate}
							/>
						</div>

						<div className="pt-4 border-t border-gray-200">
							<PEPSearch searchValue={pepSearch} onSearchChange={setPepSearch} onClearSearch={clearPepSearch} />
						</div>
					</div>
				</aside>

				<main className="flex-1 w-full px-2 sm:px-4 lg:px-6 pt-0 pb-2 sm:pb-4 lg:pb-6 lg:ml-64">
					<div className="lg:h-[calc(100vh-8rem)] lg:min-h-[500px] lg:max-h-[calc(100vh-8rem)] mb-8">
						<div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-3 lg:h-full lg:grid-rows-2">
								<Card className="shadow-card hover:shadow-card-hover bg-white border-gray-200 transform transition-all duration-300 hover:scale-[1.02] overflow-hidden" ref={statusENERRef} tabIndex={0}>
								<CardHeader className="flex flex-row items-center justify-between bg-white border-b border-gray-300 rounded-t-xl">
									<CardTitle className="text-lg font-semibold text-secondary-foreground">Status ENER</CardTitle>
									<Button
										size="sm"
										onClick={() => copyChartImage(statusENERRef, 'Status ENER')}
										className="w-8 h-8 p-0 text-gray-700 transition-all duration-200 bg-white border border-gray-300 shadow-md rounded-xl hover:bg-gray-50 hover:shadow-lg focus:outline-none focus:ring-0 ring-0"
										title="Copiar imagem (ou clique no gráfico e Ctrl+C)"
									>
										<Copy className="w-4 h-4" />
									</Button>
								</CardHeader>
								<CardContent className="p-4">
									<ChartContainer config={{ value: { label: "Valor (R$)", color: "hsl(var(--primary))" } }} className="h-64 sm:h-72 md:h-80 lg:h-[calc((100vh-20rem)/2)] lg:max-h-[350px] w-full">
										<ResponsiveContainer width="100%" height="100%">
											<BarChart data={filteredData.statusENER} margin={{ top: 20, right: 15, bottom: 50, left: 15 }}>
												<CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
												<XAxis dataKey="name" fontSize={12} tickMargin={8} tick={(props: unknown) => {
													const p = props as ChartTickProps;
													const value = p && p.payload ? p.payload.value : '';
													return (
														<g transform={`translate(${p.x},${p.y})`} style={{ cursor: 'pointer' }} onClick={() => handleChartClick('statusENER', String(value))}>
															<text x={0} y={0} dy={16} textAnchor="middle" fontSize={12} fill="currentColor">{String(value)}</text>
														</g>
													);
												}} />
												<YAxis fontSize={12} />
												<Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', boxShadow: 'var(--shadow-elegant)' }} formatter={(value: number) => [value.toLocaleString('pt-BR'), 'Qtd']} />
												<Bar dataKey="qtd" fill="url(#chartGradient)" radius={[8, 8, 0, 0]} style={{ cursor: 'pointer' }} onClick={(d: unknown, i: number) => {
													const dd = d as BarDatumLike;
													const name = (dd && (dd.name || (dd.payload && dd.payload.name))) || (filteredData.statusENER[i] && filteredData.statusENER[i].name);
													if (name) handleChartClick('statusENER', String(name));
												}}>
													{filteredData.statusENER.map((entry, index) => (
														<Cell key={`cell-${index}`} onClick={() => handleChartClick('statusENER', entry.name)} fill={activeFilters.statusENER === entry.name ? "hsl(var(--primary))" : "url(#chartGradient)"} stroke={activeFilters.statusENER === entry.name ? "hsl(var(--primary-foreground))" : "none"} strokeWidth={activeFilters.statusENER === entry.name ? 2 : 0} />
													))}
													<LabelList dataKey="qtd" content={makeLabelRenderer(
														filteredData.statusENER,
														(name: string) => activeFilters.statusENER === name,
													)} />
												</Bar>
												<defs>
													<linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
														<stop offset="0%" stopColor="hsl(142 90% 45%)" />
														<stop offset="50%" stopColor="hsl(142 85% 42%)" />
														<stop offset="100%" stopColor="hsl(142 76% 36%)" />
													</linearGradient>
												</defs>
											</BarChart>
										</ResponsiveContainer>
									</ChartContainer>
								</CardContent>
							</Card>

								<Card className="shadow-card hover:shadow-card-hover bg-white border-gray-200 transform transition-all duration-300 hover:scale-[1.02] overflow-hidden" ref={comparisonRef} tabIndex={0}>
								<CardHeader className="flex flex-row items-center justify-between bg-white border-b border-gray-300 rounded-t-xl">
									<CardTitle className="text-lg font-semibold text-secondary-foreground">Comparativo por Região</CardTitle>
									<Button
										size="sm"
										onClick={() => copyChartImage(comparisonRef, 'Comparativo')}
										className="w-8 h-8 p-0 text-gray-700 transition-all duration-200 bg-white border border-gray-300 shadow-md rounded-xl hover:bg-gray-50 hover:shadow-lg focus:outline-none focus:ring-0 ring-0"
										title="Copiar imagem (ou clique no gráfico e Ctrl+C)"
									>
										<Copy className="w-4 h-4" />
									</Button>
								</CardHeader>
								<CardContent className="p-4">
									<ChartContainer config={{ value: { label: "Valor (R$)", color: "hsl(var(--primary))" } }} className="h-64 sm:h-72 md:h-80 lg:h-[calc((100vh-20rem)/2)] lg:max-h-[350px] w-full">
										<ResponsiveContainer width="100%" height="100%">
											<BarChart data={filteredData.comparison} margin={{ top: 20, right: 20, bottom: 50, left: 20 }} barGap={4} barCategoryGap={16}>
												<CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
												<XAxis dataKey="name" fontSize={12} tickMargin={8} tick={(props: unknown) => {
													const p = props as ChartTickProps;
													const value = p && p.payload ? p.payload.value : '';
													return (
														<g transform={`translate(${p.x},${p.y})`} style={{ cursor: 'pointer' }} onClick={() => handleChartClick('comparison', String(value))}>
															<text x={0} y={0} dy={16} textAnchor="middle" fontSize={12} fill="currentColor">{String(value)}</text>
														</g>
													);
												}} />
												<YAxis yAxisId="left" fontSize={12} />
												<YAxis yAxisId="right" orientation="right" fontSize={12} hide />
												<Tooltip
													contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', boxShadow: 'var(--shadow-elegant)' }}
													formatter={(value, _name, item) => {
														const num = typeof value === 'number' ? value : Number(value) || 0;
														// item pode ser Payload | Payload[]; tratamos a primeira ocorrência
														type TP = { dataKey?: string | number } | undefined;
														const payload = (Array.isArray(item) ? item[0] : item) as TP;
														const dataKey = payload && payload.dataKey;
														if (dataKey === 'value') return [`R$ ${num.toLocaleString('pt-BR')}`, 'Valor'];
														return [num.toLocaleString('pt-BR'), 'Qtd'];
													}}
												/>
												<Bar yAxisId="left" dataKey="qtd" fill="url(#chartGreenGradientComparison)" radius={[8, 8, 0, 0]} style={{ cursor: 'pointer' }} onClick={(d: unknown, i: number) => {
													const dd = d as BarDatumLike;
													const name = (dd && (dd.name || (dd.payload && dd.payload.name))) || (filteredData.comparison[i] && filteredData.comparison[i].name);
													if (name) handleChartClick('comparison', String(name));
												}}>
													{filteredData.comparison.map((entry, index) => {
														const highlight = activeFilters.comparison || (selectedRegion !== 'all' ? selectedRegion : '');
														const isHighlighted = highlight && highlight === entry.name;
														return (
															<Cell
																key={`cell-${index}`}
																onClick={() => handleChartClick('comparison', entry.name)}
																fill={isHighlighted ? "hsl(var(--primary))" : "url(#chartGreenGradientComparison)"}
																stroke={isHighlighted ? "hsl(var(--primary-foreground))" : "none"}
																strokeWidth={isHighlighted ? 2 : 0}
															/>
														);
													})}
													<LabelList dataKey="qtd" content={makeLabelRenderer(
														filteredData.comparison,
														(name: string) => {
															const highlight = activeFilters.comparison || (selectedRegion !== 'all' ? selectedRegion : '');
															return highlight === name;
														},
													)} />
												</Bar>
												<Bar yAxisId="right" dataKey="value" fill="url(#chartBlueGradientValue)" radius={[8, 8, 0, 0]} style={{ cursor: 'pointer' }} onClick={(d: unknown, i: number) => {
													const dd = d as BarDatumLike;
													const name = (dd && (dd.name || (dd.payload && dd.payload.name))) || (filteredData.comparison[i] && filteredData.comparison[i].name);
													if (name) handleChartClick('comparison', String(name));
												}}>
													{filteredData.comparison.map((entry, index) => {
														const highlight = activeFilters.comparison || (selectedRegion !== 'all' ? selectedRegion : '');
														const isHighlighted = highlight && highlight === entry.name;
														return (
															<Cell
																key={`cellv-${index}`}
																onClick={() => handleChartClick('comparison', entry.name)}
																fill={isHighlighted ? "#1e3a8a" : "url(#chartBlueGradientValue)"}
																stroke={isHighlighted ? "#0b173d" : "none"}
																strokeWidth={isHighlighted ? 2 : 0}
															/>
														);
													})}
													<LabelList dataKey="value" content={makeValueLabelRenderer(
														filteredData.comparison,
														(name: string) => {
															const highlight = activeFilters.comparison || (selectedRegion !== 'all' ? selectedRegion : '');
															return highlight === name;
														},
													)} />
												</Bar>
												<defs>
													<linearGradient id="chartGreenGradientComparison" x1="0" y1="0" x2="0" y2="1">
														<stop offset="0%" stopColor="hsl(142 90% 45%)" />
														<stop offset="50%" stopColor="hsl(142 85% 42%)" />
														<stop offset="100%" stopColor="hsl(142 76% 36%)" />
													</linearGradient>
													<linearGradient id="chartBlueGradientValue" x1="0" y1="0" x2="0" y2="1">
														<stop offset="0%" stopColor="#3b82f6" />
														<stop offset="50%" stopColor="#1d4ed8" />
														<stop offset="100%" stopColor="#1e3a8a" />
													</linearGradient>
												</defs>
											</BarChart>
										</ResponsiveContainer>
									</ChartContainer>
								</CardContent>
							</Card>

								<Card className="shadow-card hover:shadow-card-hover bg-white border-gray-200 transform transition-all duration-300 hover:scale-[1.02] overflow-hidden" ref={statusCONCRef} tabIndex={0}>
								<CardHeader className="flex flex-row items-center justify-between bg-white border-b border-gray-300 rounded-t-xl">
									<CardTitle className="text-lg font-semibold text-secondary-foreground">Status CONC</CardTitle>
									<Button
										size="sm"
										onClick={() => copyChartImage(statusCONCRef, 'Status CONC')}
										className="w-8 h-8 p-0 text-gray-700 transition-all duration-200 bg-white border border-gray-300 shadow-md rounded-xl hover:bg-gray-50 hover:shadow-lg focus:outline-none focus:ring-0 ring-0"
										title="Copiar imagem (ou clique no gráfico e Ctrl+C)"
									>
										<Copy className="w-4 h-4" />
									</Button>
								</CardHeader>
								<CardContent className="p-4">
									<ChartContainer config={{ value: { label: "Valor (R$)", color: "hsl(var(--primary))" } }} className="h-64 sm:h-72 md:h-80 lg:h-[calc((100vh-20rem)/2)] lg:max-h-[350px] w-full">
										<ResponsiveContainer width="100%" height="100%">
											<BarChart data={filteredData.statusCONC} margin={{ top: 20, right: 15, bottom: 50, left: 15 }}>
												<CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
												<XAxis dataKey="name" fontSize={12} tickMargin={8} tick={(props: unknown) => {
													const p = props as ChartTickProps;
													const value = p && p.payload ? p.payload.value : '';
													return (
														<g transform={`translate(${p.x},${p.y})`} style={{ cursor: 'pointer' }} onClick={() => handleChartClick('statusCONC', String(value))}>
															<text x={0} y={0} dy={16} textAnchor="middle" fontSize={12} fill="currentColor">{String(value)}</text>
														</g>
													);
												}} />
												<YAxis fontSize={12} />
												<Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', boxShadow: 'var(--shadow-elegant)' }} formatter={(value: number) => [value.toLocaleString('pt-BR'), 'Qtd']} />
												<Bar dataKey="qtd" fill="url(#chartGreenGradientConc)" radius={[8, 8, 0, 0]} style={{ cursor: 'pointer' }} onClick={(d: unknown, i: number) => {
													const dd = d as BarDatumLike;
													const name = (dd && (dd.name || (dd.payload && dd.payload.name))) || (filteredData.statusCONC[i] && filteredData.statusCONC[i].name);
													if (name) handleChartClick('statusCONC', String(name));
												}}>
													{filteredData.statusCONC.map((entry, index) => (
														<Cell key={`cell-${index}`} onClick={() => handleChartClick('statusCONC', entry.name)} fill={activeFilters.statusCONC === entry.name ? "hsl(var(--primary))" : "url(#chartGreenGradientConc)"} stroke={activeFilters.statusCONC === entry.name ? "hsl(var(--primary-foreground))" : "none"} strokeWidth={activeFilters.statusCONC === entry.name ? 2 : 0} />
													))}
													<LabelList dataKey="qtd" content={makeLabelRenderer(
														filteredData.statusCONC,
														(name: string) => activeFilters.statusCONC === name,
													)} />
												</Bar>
												<defs>
													<linearGradient id="chartGreenGradientConc" x1="0" y1="0" x2="0" y2="1">
														<stop offset="0%" stopColor="hsl(142 90% 45%)" />
														<stop offset="50%" stopColor="hsl(142 85% 42%)" />
														<stop offset="100%" stopColor="hsl(142 76% 36%)" />
													</linearGradient>
												</defs>
											</BarChart>
										</ResponsiveContainer>
									</ChartContainer>
								</CardContent>
							</Card>

								<Card className="shadow-card hover:shadow-card-hover bg-white border-gray-200 transform transition-all duration-300 hover:scale-[1.02] overflow-hidden" ref={reasonsRef} tabIndex={0}>
								<CardHeader className="flex flex-row items-center justify-between bg-white border-b border-gray-300 rounded-t-xl">
									<CardTitle className="text-lg font-semibold text-secondary-foreground">Motivos</CardTitle>
									<Button
										size="sm"
										onClick={() => copyChartImage(reasonsRef, 'Motivos')}
										className="w-8 h-8 p-0 text-gray-700 transition-all duration-200 bg-white border border-gray-300 shadow-md rounded-xl hover:bg-gray-50 hover:shadow-lg focus:outline-none focus:ring-0 ring-0"
										title="Copiar imagem (ou clique no gráfico e Ctrl+C)"
									>
										<Copy className="w-4 h-4" />
									</Button>
								</CardHeader>
								<CardContent className="p-4">
									<ChartContainer config={{ value: { label: "Valor (R$)", color: "hsl(var(--primary))" } }} className="h-64 sm:h-72 md:h-80 lg:h-[calc((100vh-20rem)/2)] lg:max-h-[350px] w-full">
										<ResponsiveContainer width="100%" height="100%">
											<BarChart data={filteredData.reasons} margin={{ top: 20, right: 15, bottom: 50, left: 15 }}>
												<CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
												<XAxis dataKey="name" fontSize={12} tickMargin={8} tick={(props: unknown) => {
													const p = props as ChartTickProps;
													const value = p && p.payload ? p.payload.value : '';
													return (
														<g transform={`translate(${p.x},${p.y})`} style={{ cursor: 'pointer' }} onClick={() => handleChartClick('reasons', String(value))}>
															<text x={0} y={0} dy={16} textAnchor="middle" fontSize={12} fill="currentColor">{String(value)}</text>
														</g>
													);
												}} />
												<YAxis fontSize={12} />
												<Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', boxShadow: 'var(--shadow-elegant)' }} formatter={(value: number) => [value.toLocaleString('pt-BR'), 'Qtd']} />
												<Bar dataKey="qtd" fill="url(#chartGreenGradientReasons)" radius={[8, 8, 0, 0]} style={{ cursor: 'pointer' }} onClick={(d: unknown, i: number) => {
													const dd = d as BarDatumLike;
													const name = (dd && (dd.name || (dd.payload && dd.payload.name))) || (filteredData.reasons[i] && filteredData.reasons[i].name);
													if (name) handleChartClick('reasons', String(name));
												}}>
													{filteredData.reasons.map((entry, index) => (
														<Cell key={`cell-${index}`} onClick={() => handleChartClick('reasons', entry.name)} fill={activeFilters.reasons === entry.name ? "hsl(var(--primary))" : "url(#chartGreenGradientReasons)"} stroke={activeFilters.reasons === entry.name ? "hsl(var(--primary-foreground))" : "none"} strokeWidth={activeFilters.reasons === entry.name ? 2 : 0} />
													))}
													<LabelList dataKey="qtd" content={makeLabelRenderer(
														filteredData.reasons,
														(name: string) => activeFilters.reasons === name,
													)} />
												</Bar>
												<defs>
													<linearGradient id="chartGreenGradientReasons" x1="0" y1="0" x2="0" y2="1">
														<stop offset="0%" stopColor="hsl(142 90% 45%)" />
														<stop offset="50%" stopColor="hsl(142 85% 42%)" />
														<stop offset="100%" stopColor="hsl(142 76% 36%)" />
													</linearGradient>
												</defs>
											</BarChart>
										</ResponsiveContainer>
									</ChartContainer>
								</CardContent>
							</Card>
						</div>
					</div>

					<Card className="shadow-card hover:shadow-card-hover bg-white border-gray-200 transform transition-all duration-300 hover:scale-[1.01]">
						<CardHeader className="flex flex-row items-center justify-between bg-white border-b border-gray-300 rounded-t-xl">
							<CardTitle className="text-lg font-semibold text-secondary-foreground">Matriz de Prazos SAP</CardTitle>
							<Button
								size="sm"
								onClick={handleExportExcel}
								className="flex items-center gap-2 text-gray-700 transition-all duration-200 bg-white border border-gray-300 shadow-md rounded-xl hover:bg-gray-50 hover:shadow-lg focus:outline-none focus:ring-0 ring-0"
							>
								<Copy className="w-4 h-4" />
								Exportar Excel
							</Button>
						</CardHeader>
						<CardContent className="p-0">
							<div className="overflow-x-auto" ref={tableWrapperRef}>
								<Table>
									<TableHeader>
										<TableRow className="bg-gray-50 hover:bg-gray-100">
											<TableHead className="font-semibold text-gray-700 transition-colors cursor-pointer select-none hover:bg-gray-200" onClick={() => handleSort('pep')}>
												<div className="flex items-center gap-2">PEP {getSortIcon('pep')}</div>
											</TableHead>
											<TableHead className="font-semibold text-gray-700 transition-colors cursor-pointer select-none hover:bg-gray-200" onClick={() => handleSort('prazo')}>
												<div className="flex items-center gap-2">Prazo {getSortIcon('prazo')}</div>
											</TableHead>
											<TableHead className="font-semibold text-gray-700 transition-colors cursor-pointer select-none hover:bg-gray-200" onClick={() => handleSort('dataConclusao')}>
												<div className="flex items-center gap-2">Data Conclusão {getSortIcon('dataConclusao')}</div>
											</TableHead>
											<TableHead className="font-semibold text-gray-700 transition-colors cursor-pointer select-none hover:bg-gray-200" onClick={() => handleSort('status')}>
												<div className="flex items-center gap-2">Status SAP {getSortIcon('status')}</div>
											</TableHead>
											<TableHead className="font-semibold text-gray-700 transition-colors cursor-pointer select-none hover:bg-gray-200" onClick={() => handleSort('rs')}>
												<div className="flex items-center gap-2">R$ {getSortIcon('rs')}</div>
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{filteredData.matrix.map((row, index) => (
											<TableRow
												data-row-index={index}
												key={index}
												className={cn(
													"cursor-pointer transition-all duration-200 select-none",
													(Array.isArray(selectedMatrixRows) && selectedMatrixRows.includes(row.pep))
														? "bg-green-50 border-l-4 border-l-green-600 shadow-md hover:bg-green-100"
														: "hover:bg-gray-50"
												)}
												onClick={(e: React.MouseEvent) => {
												// Shift+click => range select (preserva seleção existente fora do intervalo)
												if (e.shiftKey && typeof lastSelectedIndex === 'number' && lastSelectedIndex !== null) {
													e.preventDefault();
													const start = Math.min(lastSelectedIndex, index);
													const end = Math.max(lastSelectedIndex, index);
													const range = filteredData.matrix.slice(start, end + 1).map(r => r.pep);
													setSelectedMatrixRows(prev => {
														const preserved = Array.isArray(prev) ? prev.filter(p => {
															const idx = filteredData.matrix.findIndex(r => r.pep === p);
															return idx === -1 || idx < start || idx > end; // mantém itens fora do novo intervalo
														}) : [];
														return Array.from(new Set([...preserved, ...range]));
													});
													setLastSelectedIndex(index);
													scrollToRow(index);
													return;
												}
												// Ctrl (Windows/Linux) ou Meta (Mac) -> toggle selection
												if ((e.ctrlKey || e.metaKey)) {
													e.preventDefault();
													setSelectedMatrixRows(prev => {
														if (Array.isArray(prev) && prev.includes(row.pep)) return prev.filter(p => p !== row.pep);
														return Array.isArray(prev) ? [...prev, row.pep] : [row.pep];
													});
													// atualiza índice do último clique
													setLastSelectedIndex(index);
													scrollToRow(index);
												} else {
													// single selection
													setSelectedMatrixRows([row.pep]);
													setLastSelectedIndex(index);
													scrollToRow(index);
												}
												}
											}
											onContextMenu={(e: React.MouseEvent) => {
												e.preventDefault();
												// open reusable context menu with two actions
												const cx = e.clientX;
												const cy = e.clientY;
												setContextPos({ x: cx, y: cy });
												setContextItems([
													{
														id: 'copy-servicos',
														label: 'COPIAR SERVIÇOS',
														onClick: () => {
															const selected = (Array.isArray(selectedMatrixRows) && selectedMatrixRows.length) ? selectedMatrixRows : [row.pep];
															const lines = filteredData.matrix.filter(r => selected.includes(r.pep)).map(r => r.pep);
															navigator.clipboard.writeText(lines.join('\n')).then(() => showToast('Serviços copiados!')).catch(() => showToast('Erro ao copiar'));
															setContextOpen(false);
														}
													},
													{
														id: 'copy-table',
														label: 'COPIAR TABELA',
														onClick: () => {
															const selected = (Array.isArray(selectedMatrixRows) && selectedMatrixRows.length) ? selectedMatrixRows : [row.pep];
															const rowsToCopy = filteredData.matrix.filter(r => selected.includes(r.pep));
															const tsv = rowsToCopy.map(r => [r.pep, r.prazo, r.dataConclusao, r.status, r.rs].join('\t')).join('\n');
															navigator.clipboard.writeText(tsv).then(() => showToast('Tabela copiada!')).catch(() => showToast('Erro ao copiar'));
															setContextOpen(false);
														}
													}
												]);
												setContextOpen(true);
											}}
											onAuxClick={(e: React.MouseEvent) => {
												// botão do meio (wheel/middle) geralmente tem button === 1
												if ((e as React.MouseEvent).button === 1) {
													e.preventDefault();
													const raw = String(row.rs || '0');
													navigator.clipboard.writeText(raw).then(() => {
													showToast(`Valor R$ ${row.rs.toLocaleString('pt-BR')} copiado!`);
													}).catch(() => showToast('Erro ao copiar valor'));
												}
											}}
											title="Ctrl/Cmd+clique para selecionar múltiplas linhas. Clique com o botão direito para abrir menu de copiar"
											>
												<TableCell className="font-mono text-sm">{row.pep}</TableCell>
												<TableCell className="text-sm">{row.prazo}</TableCell>
												<TableCell className="text-sm">{row.dataConclusao}</TableCell>
												<TableCell>
													<span className={`px-3 py-1 rounded-full text-xs font-medium ${row.status === 'Concluído' ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-yellow-100 text-yellow-800 border border-yellow-300'}`}>
														{row.status}
													</span>
												</TableCell>
												<TableCell className="font-semibold">{row.rs.toLocaleString('pt-BR')}</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
						</CardContent>
					</Card>
				</main>
			</div>

		{/* Context menu shared component */}
		<ContextMenu
			open={contextOpen}
			position={contextPos}
			items={contextItems}
			onClose={() => setContextOpen(false)}
		/>
		</div>
	);
}
