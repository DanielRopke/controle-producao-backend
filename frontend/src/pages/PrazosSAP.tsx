// Dashboard consolidado: conteúdo migrado da antiga PrazosSAP1
import React, { useEffect, useState, useRef } from 'react';
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

interface DashboardData {
	statusENER: { name: string; value: number; qtd: number }[]; // Valor (R$) e quantidade
	statusCONC: { name: string; value: number; qtd: number }[];
	comparison: { name: string; value: number; qtd: number }[];
	reasons: { name: string; value: number; qtd: number }[];
	matrix: { pep: string; prazo: string; dataConclusao: string; status: string; rs: number }[];
}

export default function PrazosSAP() {
	const [selectedRegion, setSelectedRegion] = useState<string>('all');
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [pepSearch, setPepSearch] = useState('');
	const [selectedStartDate, setSelectedStartDate] = useState<Date | undefined>(undefined);
	const [selectedEndDate, setSelectedEndDate] = useState<Date | undefined>(undefined);
	const [selectedStatusSap, setSelectedStatusSap] = useState<string>('');
	const [selectedTipo, setSelectedTipo] = useState<string>('');
	const [selectedMes, setSelectedMes] = useState<string>('');
	const [selectedMatrixRow, setSelectedMatrixRow] = useState<string | null>(null);
	const [sortConfig, setSortConfig] = useState<{ key?: keyof DashboardData['matrix'][0]; direction?: 'asc' | 'desc' }>({});
	const [regions, setRegions] = useState<string[]>([]);
	const [rawRows, setRawRows] = useState<MatrizItem[]>([]);
	const [statusEnerMap, setStatusEnerMap] = useState<Record<string, Record<string, number>>>({});
	const [statusConcMap, setStatusConcMap] = useState<Record<string, Record<string, number>>>({});
	const [reasonsMap, setReasonsMap] = useState<Record<string, Record<string, number>>>({});
	const [statusSapList, setStatusSapList] = useState<string[]>([]);
	const [tiposList, setTiposList] = useState<string[]>([]);
	const [mesesList, setMesesList] = useState<string[]>([]);

	// Estados para filtros interativos
	const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

	const clearFilters = () => {
		setSelectedRegion('all');
		setActiveFilters({});
		setSelectedStartDate(undefined);
		setSelectedEndDate(undefined);
		setPepSearch('');
	};

	const clearPepSearch = () => {
		setPepSearch('');
		console.log('[TOAST] Pesquisa PEP limpa!');
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
		if (activeFilters.statusENER && anyHasEner) rowsForOthers = rowsForOthers.filter(r => (r.statusEner || '').trim() === activeFilters.statusENER);
		if (activeFilters.statusCONC && anyHasConc) rowsForOthers = rowsForOthers.filter(r => (r.statusConc || '').trim() === activeFilters.statusCONC);
		if (activeFilters.reasons && anyHasMotivos) rowsForOthers = rowsForOthers.filter(r => (r.statusServico || '').trim() === activeFilters.reasons);
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
			return arr.sort((a, b) => b.value - a.value);
		};

		const statusENER = hasEner ? (function() { const m = new Map<string, { valor: number; qtd: number }>(); for (const r of rowsForOthers) { const k = (r.statusEner || '').trim(); if (!k) continue; const v = typeof r.valor === 'number' ? r.valor : parseFloat(String(r.valor || '0').replace(/R\$\s?/, '').replace(/\./g, '').replace(/,/g, '.')) || 0; const cur = m.get(k) || { valor: 0, qtd: 0 }; m.set(k, { valor: cur.valor + v, qtd: cur.qtd + 1 }); } return Array.from(m.entries()).map(([name, obj]) => ({ name, value: obj.valor, qtd: obj.qtd })).sort((a, b) => b.value - a.value); })() : sumFromMap(statusEnerMap);
		const statusCONC = hasConc ? (function() { const m = new Map<string, { valor: number; qtd: number }>(); for (const r of rowsForOthers) { const k = (r.statusConc || '').trim(); if (!k) continue; const v = typeof r.valor === 'number' ? r.valor : parseFloat(String(r.valor || '0').replace(/R\$\s?/, '').replace(/\./g, '').replace(/,/g, '.')) || 0; const cur = m.get(k) || { valor: 0, qtd: 0 }; m.set(k, { valor: cur.valor + v, qtd: cur.qtd + 1 }); } return Array.from(m.entries()).map(([name, obj]) => ({ name, value: obj.valor, qtd: obj.qtd })).sort((a, b) => b.value - a.value); })() : sumFromMap(statusConcMap);
		const reasons = hasMotivos ? (function() { const m = new Map<string, { valor: number; qtd: number }>(); for (const r of rowsForOthers) { const k = (r.statusServico || '').trim(); if (!k) continue; const v = typeof r.valor === 'number' ? r.valor : parseFloat(String(r.valor || '0').replace(/R\$\s?/, '').replace(/\./g, '').replace(/,/g, '.')) || 0; const cur = m.get(k) || { valor: 0, qtd: 0 }; m.set(k, { valor: cur.valor + v, qtd: cur.qtd + 1 }); } return Array.from(m.entries()).map(([name, obj]) => ({ name, value: obj.valor, qtd: obj.qtd })).sort((a, b) => b.value - a.value); })() : sumFromMap(reasonsMap);
		const comparison = (function() { const m = new Map<string, { valor: number; qtd: number }>(); for (const r of rowsForComparison) { const s = (r.seccional || '').trim(); if (!s) continue; const v = typeof r.valor === 'number' ? r.valor : parseFloat(String(r.valor || '0').replace(/R\$\s?/, '').replace(/\./g, '').replace(/,/g, '.')) || 0; const cur = m.get(s) || { valor: 0, qtd: 0 }; m.set(s, { valor: cur.valor + v, qtd: cur.qtd + 1 }); } return Array.from(m.entries()).map(([name, obj]) => ({ name, value: obj.valor, qtd: obj.qtd })).sort((a, b) => b.value - a.value); })();

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
			tableRows = [...tableRows].sort((a, b) => {
				const aValue = a[sortConfig.key!];
				const bValue = b[sortConfig.key!];
				if (sortConfig.key === 'rs') {
					return sortConfig.direction === 'asc'
						? (aValue as number) - (bValue as number)
						: (bValue as number) - (aValue as number);
				} else {
					const aStr = String(aValue).toLowerCase();
					const bStr = String(bValue).toLowerCase();
					if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
					if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
					return 0;
				};
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
						console.log(`[TOAST] Imagem do gráfico ${chartName} copiada!`);
					}).catch(() => {
						console.log(`[TOAST] Erro ao copiar imagem do gráfico ${chartName}`);
					});
				}
			});
		} catch (error) {
			console.error('Erro ao capturar gráfico:', error);
			console.log(`[TOAST] Erro ao copiar imagem do gráfico ${chartName}`);
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
		console.log('[TOAST] Arquivo Excel exportado com sucesso!');
	};

	// KPIs devem refletir os filtros atuais sobre as linhas usadas na tabela e outros gráficos (rowsForOthers)
	const totalValue = React.useMemo(() => filteredData.matrix.reduce((sum, row) => sum + (row.rs || 0), 0), [filteredData.matrix]);
	const totalPep = React.useMemo(() => filteredData.matrix.length, [filteredData.matrix.length]);

	return (
		<div className="min-h-screen lovable bg-background">
			<header className="fixed top-0 left-0 right-0 z-50 bg-green-600 border-b border-green-400 shadow-md">
				<div className="flex items-center justify-between h-16 px-4 lg:px-6">
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
							<div className="bg-white text-green-600 px-3 lg:px-4 py-2 rounded-xl font-bold shadow-md text-center text-sm lg:text-base w-[100px] lg:w-[120px]">
								setup
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={clearFilters}
								className="items-center hidden gap-2 text-gray-700 transition-all duration-200 bg-white border-gray-300 shadow-md sm:flex rounded-xl hover:shadow-lg hover:bg-gray-50"
							>
								<RotateCcw className="w-4 h-4" />
								<span className="hidden md:inline">Limpar Filtros</span>
							</Button>
						</div>
					</div>
					<div className="flex items-center gap-2 lg:gap-4">
						<div className="flex items-center gap-2 lg:gap-3">
							<span className="hidden text-xs text-white lg:text-sm sm:inline">Valor Total</span>
							<div className="px-2 py-1 text-sm font-semibold text-green-600 bg-white rounded-lg shadow-md lg:px-4 lg:py-2 lg:rounded-xl lg:text-base">
								R$ {totalValue.toLocaleString('pt-BR', { notation: 'compact' })}
							</div>
						</div>
						<div className="flex items-center gap-2 lg:gap-3">
							<span className="hidden text-xs text-white lg:text-sm sm:inline">PEP</span>
							<div className="px-2 py-1 text-sm font-semibold text-green-600 bg-white rounded-lg shadow-md lg:px-4 lg:py-2 lg:rounded-xl lg:text-base">
								{totalPep}
							</div>
						</div>
					</div>
				</div>
			</header>

			<div className="relative flex pt-16">
				{sidebarOpen && (
					<div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
				)}

				<aside className={cn(
					"fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 shadow-md overflow-y-auto z-50 transition-transform duration-300",
					"lg:translate-x-0 lg:fixed lg:z-auto lg:h-[calc(100vh-4rem)]",
					sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
				)} style={{ direction: 'rtl' }}>
					<div className="p-4 space-y-4 lg:p-6 lg:space-y-6" style={{ direction: 'ltr' }}>
						<div className="space-y-3">
							<h3 className="text-sm font-semibold tracking-wider text-gray-500 uppercase">Regiões</h3>
							<div className="space-y-2">
								<Button
									variant={selectedRegion === 'all' ? "default" : "outline"}
									onClick={() => { setSelectedRegion('all'); setSidebarOpen(false); }}
									className="justify-start w-full text-sm transition-all duration-200 shadow-md rounded-xl hover:shadow-lg"
									size="sm"
								>
									Todas as Regiões
								</Button>
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

						<div className="pt-4 space-y-3 border-t border-gray-200">
							<h3 className="text-sm font-semibold tracking-wider text-gray-500 uppercase">Filtros</h3>
							<select
								value={selectedStatusSap}
								onChange={(e) => setSelectedStatusSap(e.target.value)}
								className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg"
							>
								<option value="">Status SAP</option>
								{statusSapList.map((s) => (
									<option key={s} value={s}>{s}</option>
								))}
							</select>
							<select
								value={selectedTipo}
								onChange={(e) => setSelectedTipo(e.target.value)}
								className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg"
							>
								<option value="">Tipo</option>
								{tiposList.map((t) => (
									<option key={t} value={t}>{t}</option>
								))}
							</select>
							<select
								value={selectedMes}
								onChange={(e) => setSelectedMes(e.target.value)}
								className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg"
							>
								<option value="">Mês</option>
								{mesesList.map((m) => (
									<option key={m} value={m}>{m}</option>
								))}
							</select>
						</div>
					</div>
				</aside>

				<main className="flex-1 w-full p-2 sm:p-4 lg:p-6 lg:ml-64">
					<div className="lg:h-[calc(100vh-8rem)] lg:min-h-[500px] lg:max-h-[calc(100vh-8rem)] mb-8">
						<div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-3 lg:h-full lg:grid-rows-2">
							<Card className="shadow-card hover:shadow-card-hover bg-gradient-card backdrop-blur-sm border-gray-200 transform transition-all duration-300 hover:scale-[1.02] hover:bg-gradient-card-hover overflow-hidden" ref={statusENERRef} tabIndex={0}>
								<CardHeader className="flex flex-row items-center justify-between border-b border-gray-300 bg-gradient-secondary/40 backdrop-blur-sm rounded-t-xl">
									<CardTitle className="text-lg font-semibold text-secondary-foreground">Status ENER</CardTitle>
									<Button variant="outline" size="sm" onClick={() => copyChartImage(statusENERRef, 'Status ENER')} className="w-8 h-8 p-0 transition-all duration-200 rounded-lg shadow-button hover:shadow-button-hover bg-gradient-button hover:bg-gradient-button/80" title="Copiar imagem (ou clique no gráfico e Ctrl+C)">
										<Copy className="w-4 h-4" />
									</Button>
								</CardHeader>
								<CardContent className="p-4">
									<ChartContainer config={{ value: { label: "Valor (R$)", color: "hsl(var(--primary))" } }} className="h-64 sm:h-72 md:h-80 lg:h-[calc((100vh-20rem)/2)] lg:max-h-[350px] w-full">
										<ResponsiveContainer width="100%" height="100%">
											<BarChart data={filteredData.statusENER} margin={{ top: 20, right: 15, bottom: 50, left: 15 }}>
												<CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
												<XAxis dataKey="name" fontSize={12} tickMargin={8} />
												<YAxis fontSize={12} />
												<Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', boxShadow: 'var(--shadow-elegant)' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Valor']} />
												<Bar dataKey="value" fill="url(#chartGradient)" radius={[8, 8, 0, 0]} style={{ cursor: 'pointer' }}>
													{filteredData.statusENER.map((entry, index) => (
														<Cell key={`cell-${index}`} onClick={() => handleChartClick('statusENER', entry.name)} fill={activeFilters.statusENER === entry.name ? "hsl(var(--primary))" : "url(#chartGradient)"} stroke={activeFilters.statusENER === entry.name ? "hsl(var(--primary-foreground))" : "none"} strokeWidth={activeFilters.statusENER === entry.name ? 2 : 0} />
													))}
													<LabelList dataKey="qtd" position="top" fontSize={12} fill="hsl(var(--foreground))" fontWeight="semibold" />
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

							<Card className="shadow-card hover:shadow-card-hover bg-gradient-card backdrop-blur-sm border-gray-200 transform transition-all duration-300 hover:scale-[1.02] hover:bg-gradient-card-hover overflow-hidden" ref={comparisonRef} tabIndex={0}>
								<CardHeader className="flex flex-row items-center justify-between border-b border-gray-300 bg-gradient-secondary/40 backdrop-blur-sm rounded-t-xl">
									<CardTitle className="text-lg font-semibold text-secondary-foreground">Comparativo por Região</CardTitle>
									<Button variant="outline" size="sm" onClick={() => copyChartImage(comparisonRef, 'Comparativo')} className="w-8 h-8 p-0 transition-all duration-200 rounded-lg shadow-button hover:shadow-button-hover bg-gradient-button hover:bg-gradient-button/80" title="Copiar imagem (ou clique no gráfico e Ctrl+C)">
										<Copy className="w-4 h-4" />
									</Button>
								</CardHeader>
								<CardContent className="p-4">
									<ChartContainer config={{ value: { label: "Valor (R$)", color: "hsl(var(--primary))" } }} className="h-64 sm:h-72 md:h-80 lg:h-[calc((100vh-20rem)/2)] lg:max-h-[350px] w-full">
										<ResponsiveContainer width="100%" height="100%">
											<BarChart data={filteredData.comparison} margin={{ top: 20, right: 15, bottom: 50, left: 15 }}>
												<CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
												<XAxis dataKey="name" fontSize={12} tickMargin={8} />
												<YAxis fontSize={12} />
												<Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', boxShadow: 'var(--shadow-elegant)' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Valor']} />
												<Bar dataKey="value" fill="url(#chartGreenGradientComparison)" radius={[8, 8, 0, 0]} style={{ cursor: 'pointer' }}>
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
													<LabelList dataKey="qtd" position="top" fontSize={12} fill="hsl(var(--foreground))" fontWeight="semibold" />
												</Bar>
												<defs>
													<linearGradient id="chartGreenGradientComparison" x1="0" y1="0" x2="0" y2="1">
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

							<Card className="shadow-card hover:shadow-card-hover bg-gradient-card backdrop-blur-sm border-gray-200 transform transition-all duration-300 hover:scale-[1.02] hover:bg-gradient-card-hover overflow-hidden" ref={statusCONCRef} tabIndex={0}>
								<CardHeader className="flex flex-row items-center justify-between border-b border-gray-300 bg-gradient-secondary/40 backdrop-blur-sm rounded-t-xl">
									<CardTitle className="text-lg font-semibold text-secondary-foreground">Status CONC</CardTitle>
									<Button variant="outline" size="sm" onClick={() => copyChartImage(statusCONCRef, 'Status CONC')} className="w-8 h-8 p-0 transition-all duration-200 rounded-lg shadow-button hover:shadow-button-hover bg-gradient-button hover:bg-gradient-button/80" title="Copiar imagem (ou clique no gráfico e Ctrl+C)">
										<Copy className="w-4 h-4" />
									</Button>
								</CardHeader>
								<CardContent className="p-4">
									<ChartContainer config={{ value: { label: "Valor (R$)", color: "hsl(var(--primary))" } }} className="h-64 sm:h-72 md:h-80 lg:h-[calc((100vh-20rem)/2)] lg:max-h-[350px] w-full">
										<ResponsiveContainer width="100%" height="100%">
											<BarChart data={filteredData.statusCONC} margin={{ top: 20, right: 15, bottom: 50, left: 15 }}>
												<CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
												<XAxis dataKey="name" fontSize={12} tickMargin={8} />
												<YAxis fontSize={12} />
												<Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', boxShadow: 'var(--shadow-elegant)' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Valor']} />
												<Bar dataKey="value" fill="url(#chartGreenGradientConc)" radius={[8, 8, 0, 0]} style={{ cursor: 'pointer' }}>
													{filteredData.statusCONC.map((entry, index) => (
														<Cell key={`cell-${index}`} onClick={() => handleChartClick('statusCONC', entry.name)} fill={activeFilters.statusCONC === entry.name ? "hsl(var(--primary))" : "url(#chartGreenGradientConc)"} stroke={activeFilters.statusCONC === entry.name ? "hsl(var(--primary-foreground))" : "none"} strokeWidth={activeFilters.statusCONC === entry.name ? 2 : 0} />
													))}
													<LabelList dataKey="qtd" position="top" fontSize={12} fill="hsl(var(--foreground))" fontWeight="semibold" />
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

							<Card className="shadow-card hover:shadow-card-hover bg-gradient-card backdrop-blur-sm border-gray-200 transform transition-all duration-300 hover:scale-[1.02] hover:bg-gradient-card-hover overflow-hidden" ref={reasonsRef} tabIndex={0}>
								<CardHeader className="flex flex-row items-center justify-between border-b border-gray-300 bg-gradient-secondary/40 backdrop-blur-sm rounded-t-xl">
									<CardTitle className="text-lg font-semibold text-secondary-foreground">Motivos</CardTitle>
									<Button variant="outline" size="sm" onClick={() => copyChartImage(reasonsRef, 'Motivos')} className="w-8 h-8 p-0 transition-all duration-200 rounded-lg shadow-button hover:shadow-button-hover bg-gradient-button hover:bg-gradient-button/80" title="Copiar imagem (ou clique no gráfico e Ctrl+C)">
										<Copy className="w-4 h-4" />
									</Button>
								</CardHeader>
								<CardContent className="p-4">
									<ChartContainer config={{ value: { label: "Valor (R$)", color: "hsl(var(--primary))" } }} className="h-64 sm:h-72 md:h-80 lg:h-[calc((100vh-20rem)/2)] lg:max-h-[350px] w-full">
										<ResponsiveContainer width="100%" height="100%">
											<BarChart data={filteredData.reasons} margin={{ top: 20, right: 15, bottom: 50, left: 15 }}>
												<CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
												<XAxis dataKey="name" fontSize={12} tickMargin={8} />
												<YAxis fontSize={12} />
												<Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', boxShadow: 'var(--shadow-elegant)' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Valor']} />
												<Bar dataKey="value" fill="url(#chartGreenGradientReasons)" radius={[8, 8, 0, 0]} style={{ cursor: 'pointer' }}>
													{filteredData.reasons.map((entry, index) => (
														<Cell key={`cell-${index}`} onClick={() => handleChartClick('reasons', entry.name)} fill={activeFilters.reasons === entry.name ? "hsl(var(--primary))" : "url(#chartGreenGradientReasons)"} stroke={activeFilters.reasons === entry.name ? "hsl(var(--primary-foreground))" : "none"} strokeWidth={activeFilters.reasons === entry.name ? 2 : 0} />
													))}
													<LabelList dataKey="qtd" position="top" fontSize={12} fill="hsl(var(--foreground))" fontWeight="semibold" />
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

					<Card className="shadow-card hover:shadow-card-hover bg-gradient-card backdrop-blur-sm border-gray-200 transform transition-all duration-300 hover:scale-[1.01]">
						<CardHeader className="flex flex-row items-center justify-between border-b border-gray-300 bg-gradient-secondary/40 backdrop-blur-sm rounded-t-xl">
							<CardTitle className="text-lg font-semibold text-secondary-foreground">Matriz de Prazos SAP</CardTitle>
							<Button variant="outline" size="sm" onClick={handleExportExcel} className="flex items-center gap-2 transition-all duration-200 rounded-lg shadow-button hover:shadow-button-hover bg-gradient-button hover:bg-gradient-button/80">
								<Copy className="w-4 h-4" />
								Exportar Excel
							</Button>
						</CardHeader>
						<CardContent className="p-0">
							<div className="overflow-x-auto">
								<Table>
									<TableHeader>
										<TableRow className="bg-gray-50 hover:bg-gray-100">
											<TableHead className="font-semibold text-gray-700 transition-colors cursor-pointer select-none hover:bg-gray-200" onClick={() => handleSort('pep')}>
												<div className="flex items-center gap-2">PEP {getSortIcon('pep')}</div>
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
											<TableRow key={index} className={cn("cursor-pointer transition-all duration-200 select-none", selectedMatrixRow === row.pep ? "bg-green-50 border-l-4 border-l-green-600 shadow-md hover:bg-green-100" : "hover:bg-gray-50")} onClick={() => setSelectedMatrixRow(row.pep)}>
												<TableCell className="font-mono text-sm">{row.pep}</TableCell>
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
		</div>
	);
}
