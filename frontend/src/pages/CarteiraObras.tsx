// Página: Carteira de Obras
// Layout baseado em PrazosSAP, sem chamadas à API e sem dados (apenas estrutura visual)
import React, { useEffect, useState, useRef, useMemo } from 'react';
import ContextMenu from '../components/ContextMenu';
import { useNavigate } from 'react-router-dom';
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Copy, RotateCcw, Menu, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { ChartContainer } from "../components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { DateRangeFilter } from '../components/DateRangeFilter';
import { PEPSearch } from '../components/PEPSearch';
import useGoogleSheetCarteira from '../hooks/useGoogleSheetCarteira';
import { cn } from "../lib/utils";
import LogoSetup from '../assets/LogoSetup1.png';
import { FundoAnimado } from '../components/FundoAnimado';

type ChartTickProps = { x?: number; y?: number; payload?: { value?: string } };

export default function CarteiraObras() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pepSearch, setPepSearch] = useState('');
  const [selectedStartDate, setSelectedStartDate] = useState<Date | undefined>(undefined);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | undefined>(undefined);
  const [selectedStatusSap, setSelectedStatusSap] = useState<string>('');
  const [selectedTipo, setSelectedTipo] = useState<string>('');
  const [selectedMes, setSelectedMes] = useState<string>('');
  // selection state intentionally omitted in layout-only page
  const [contextOpen, setContextOpen] = useState(false);
  const [contextPos] = useState({ x: 0, y: 0 });
  const [contextItems] = useState<{ id: string; label: string; onClick: () => void }[]>([]);

  useEffect(() => { void contextOpen; void contextPos; void contextItems; }, [contextOpen, contextPos, contextItems]);

  const [sortConfig, setSortConfig] = useState<{ key?: string; direction?: 'asc' | 'desc' }>({});
  const [regions] = useState<string[]>([]);

  // Empty datasets (layout-only)
  // datasets intentionally empty for layout-only
  const [statusSapList] = useState<string[]>([]);
  const [tiposList] = useState<string[]>([]);
  const [mesesList] = useState<string[]>([]);

  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'Carteira de Obras';
    return () => { document.title = prevTitle; };
  }, []);

  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

  const clearFilters = () => {
    setActiveFilters({});
    setSelectedStartDate(undefined);
    setSelectedEndDate(undefined);
    setPepSearch('');
    setSelectedStatusSap('');
    setSelectedTipo('');
    setSelectedMes('');
  };

  const clearPepSearch = () => { setPepSearch(''); };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const getSortIcon = (columnKey: string) => {
    if (sortConfig.key !== columnKey) return <ChevronsUpDown className="w-4 h-4 text-gray-500" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4 text-green-600" /> : <ChevronDown className="w-4 h-4 text-green-600" />;
  };

  const handleChartClick = (chartType: 'statusENER' | 'statusCONC' | 'reasons' | 'comparison', label: string) => {
    const newFilters = { ...activeFilters };
    if (newFilters[chartType] === label) delete newFilters[chartType]; else newFilters[chartType] = label;
    setActiveFilters(newFilters);
  };

  const statusENER: { name: string; value: number; qtd: number }[] = [];
  const statusCONC: { name: string; value: number; qtd: number }[] = [];
  const comparison: { name: string; value: number; qtd: number }[] = [];
  const reasons: { name: string; value: number; qtd: number }[] = [];

  const filteredData: { statusENER: typeof statusENER; statusCONC: typeof statusCONC; comparison: typeof comparison; reasons: typeof reasons; matrix: Array<{ pep?: string; prazo?: string; dataConclusao?: string; status?: string; rs?: number }>; } = { statusENER, statusCONC, comparison, reasons, matrix: [] };

  const emAndamentoRef = useRef<HTMLDivElement>(null);
  const comparisonRef = useRef<HTMLDivElement>(null);
  const statusCONCRef = useRef<HTMLDivElement>(null);
  const reasonsRef = useRef<HTMLDivElement>(null);
  const tableWrapperRef = useRef<HTMLDivElement | null>(null);

  // scrollToRow intentionally removed in layout-only page

  const numberFmt2 = React.useMemo(() => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), []);
  const currencyFmt = React.useMemo(() => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }), []);
  const formatValorShort = (n: number) => {
    const abs = Math.abs(n);
    if (abs >= 1_000_000) return `${numberFmt2.format(n / 1_000_000)} Mi`;
    if (abs >= 1_000) return `${numberFmt2.format(n / 1_000)} Mil`;
    return numberFmt2.format(n);
  };

  const totalValue = 0;
  const totalPep = 0;

  const copyChartImage = async (chartRef: React.RefObject<HTMLDivElement | null>, chartName: string) => {
    if (!chartRef.current) return;
    try {
      // lightweight screenshot - keep minimal to avoid heavy libs here
      // if html2canvas is needed, we can add later; for now just show toast via ContextMenu or similar
      // no-op placeholder
      console.debug('copyChartImage placeholder', chartName);
    } catch (error) {
      console.error('Erro ao capturar gráfico:', error);
    }
  };

  // Hook: carregar dados da planilha (CarteiraObras)
  const { matriz } = useGoogleSheetCarteira('1wj3AZ5__Ak8THPHu-Lr1iGU-7l9fX8sf6MVY-kBMFhI');

  // Dados para o gráfico "Em Andamento": filtrar por statusAgrupado === 'Em Andamento', agrupar por statusFim
  const emAndamentoData = useMemo(() => {
    if (!matriz || matriz.length === 0) return [] as Array<{ name: string; pepCount: number; valor: number }>
    const map = new Map<string, { pepSet: Set<string>; valor: number }>()
    matriz.forEach((r, idx) => {
      const grouped = String(r.statusAgrupado || '').trim().toLowerCase()
      if (grouped !== 'em andamento') return
      const statusFim = String(r.statusFim || 'Sem Status').trim() || 'Sem Status'
      const pepKey = String(r.pep || '').trim() || `__row_${idx}`
      const cur = map.get(statusFim) || { pepSet: new Set<string>(), valor: 0 }
      cur.pepSet.add(pepKey)
      cur.valor = (cur.valor || 0) + (Number(r.valor) || 0)
      map.set(statusFim, cur)
    })
    const out: Array<{ name: string; pepCount: number; valor: number }> = []
    for (const [name, v] of map.entries()) out.push({ name, pepCount: v.pepSet.size, valor: Math.round(v.valor || 0) })
    out.sort((a, b) => b.pepCount - a.pepCount)
    return out
  }, [matriz])

  // helper left intentionally for future wiring
  // formatarValorRS reserved for future wiring

  return (
    <div className="relative z-10 min-h-screen bg-transparent">
      <FundoAnimado showBadge={false} />
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-green-500 shadow-md bg-gradient-to-r from-green-600 via-green-600/90 to-green-700">
        <div className="relative flex items-center justify-between h-16 px-4 pr-8 lg:px-6">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <h1 className="font-inter text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-wide leading-none text-white">Carteira de Obras</h1>
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
              <div className="px-2 py-1 text-sm font-semibold text-green-600 bg-white rounded-lg shadow-md lg:px-4 lg:py-2 lg:rounded-xl lg:text-base w-[105px] text-center whitespace-nowrap">{formatValorShort(totalValue)}</div>
            </div>
            <div className="flex items-center gap-2 lg:gap-3">
              <span className="hidden text-xs text-white lg:text-sm sm:inline">PEP</span>
              <div className="px-2 py-1 text-sm font-semibold text-green-600 bg-white rounded-lg shadow-md lg:px-4 lg:py-2 lg:rounded-xl lg:text-base w-[105px] text-center whitespace-nowrap">{totalPep}</div>
            </div>
          </div>
        </div>
      </header>

      <div className="relative flex" style={{ paddingTop: 'calc(4rem + 16px)' }}>
        {sidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        <aside className={cn(
          "fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 shadow-md overflow-y-auto z-50 transition-transform duration-300",
          "lg:translate-x-0 lg:fixed lg:z-auto lg:h-[calc(100vh-4rem)]",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )} style={{ direction: 'rtl' }}>
          <div className="p-4 space-y-4 lg:p-6 lg:space-y-6" style={{ direction: 'ltr' }}>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold tracking-wider text-gray-500 uppercase">Regiões</h3>
              <div className="space-y-2">
                {regions.map((region) => (
                  <Button key={region} variant="outline" className="justify-start w-full text-sm transition-all duration-200 shadow-md rounded-xl hover:shadow-lg" size="sm">{region}</Button>
                ))}
              </div>
            </div>

            <div className="pt-4 space-y-3 border-t border-gray-200">
              <h3 className="text-sm font-semibold tracking-wider text-gray-500 uppercase">Filtros</h3>
              <select value={selectedStatusSap} onChange={(e) => setSelectedStatusSap(e.target.value)} className={`w-full h-10 px-3 text-sm border rounded-xl shadow-md transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${selectedStatusSap ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-900 border-gray-200'}`}>
                <option value="">Status SAP</option>
                {statusSapList.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={selectedTipo} onChange={(e) => setSelectedTipo(e.target.value)} className={`w-full h-10 px-3 text-sm border rounded-xl shadow-md transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${selectedTipo ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-900 border-gray-200'}`}>
                <option value="">Tipo</option>
                {tiposList.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <select value={selectedMes} onChange={(e) => setSelectedMes(e.target.value)} className={`w-full h-10 px-3 text-sm border rounded-xl shadow-md transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${selectedMes ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-900 border-gray-200'}`}>
                <option value="">Mês</option>
                {mesesList.map((m) => <option key={m} value={m}>{m}</option>)}
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

        <main className="flex-1 w-full px-2 pt-0 pb-2 sm:px-4 lg:px-6 sm:pb-4 lg:pb-6 lg:ml-64">
          <div className="lg:h-[calc(100vh-8rem)] lg:min-h-[500px] lg:max-h-[calc(100vh-8rem)] mb-8">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-3 lg:h-full lg:grid-rows-2">
              <Card className="shadow-card hover:shadow-card-hover bg-white border-gray-200 transform transition-all duration-300 hover:scale-[1.02] overflow-hidden" ref={emAndamentoRef} tabIndex={0}>
                <CardHeader className="flex flex-row items-center justify-between bg-white border-b border-gray-300 rounded-t-xl">
                  <CardTitle className="text-lg font-semibold text-secondary-foreground">Em Andamento</CardTitle>
                  <Button size="sm" onClick={() => copyChartImage(emAndamentoRef, 'Em Andamento')} className="w-8 h-8 p-0 text-gray-700 transition-all duration-200 bg-white border border-gray-300 shadow-md rounded-xl hover:bg-gray-50 hover:shadow-lg focus:outline-none focus:ring-0 ring-0" title="Copiar imagem (ou clique no gráfico e Ctrl+C)"><Copy className="w-4 h-4" /></Button>
                </CardHeader>
                <CardContent className="p-4">
                  <ChartContainer config={{ value: { label: "Valor (R$)", color: "hsl(var(--primary))" } }} className="h-64 sm:h-72 md:h-80 lg:h-[calc((100vh-20rem)/2)] lg:max-h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={emAndamentoData} margin={{ top: 20, right: 20, bottom: 50, left: 20 }} barGap={8} barCategoryGap={16}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" fontSize={12} tickMargin={8} tick={(props: unknown) => { const p = props as ChartTickProps; const value = p && p.payload ? p.payload.value : ''; return (<g transform={`translate(${p.x},${p.y})`} style={{ cursor: 'pointer' }} onClick={() => handleChartClick('statusENER', String(value))}><text x={0} y={0} dy={16} textAnchor="middle" fontSize={12} fill="currentColor">{String(value)}</text></g>); }} />
                        <YAxis yAxisId="left" fontSize={12} />
                        <YAxis yAxisId="right" orientation="right" fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', boxShadow: 'var(--shadow-elegant)' }} formatter={(value: number | string, name?: string | number) => {
                          if (String(name) === 'valor') return [currencyFmt.format(Number(value) || 0), 'R$']
                          return [(Number(value) || 0).toLocaleString('pt-BR'), 'PEP']
                        }} />
                        <Bar yAxisId="left" dataKey="pepCount" fill="url(#chartGradientPep)" radius={[8, 8, 0, 0]} style={{ cursor: 'pointer' }}>
                          {emAndamentoData.map((entry, index) => (<Cell key={`cell-pep-${index}`} fill={activeFilters['statusENER'] === entry.name ? "hsl(var(--primary))" : "url(#chartGradientPep)"} />))}
                          <LabelList dataKey="pepCount" content={() => null} />
                        </Bar>
                        <Bar yAxisId="right" dataKey="valor" fill="url(#chartGradientValor)" radius={[8, 8, 0, 0]} style={{ cursor: 'pointer' }}>
                          {emAndamentoData.map((_, index) => (<Cell key={`cell-valor-${index}`} fill={"url(#chartGradientValor)"} />))}
                          <LabelList dataKey="valor" content={() => null} />
                        </Bar>
                        <defs>
                          <linearGradient id="chartGradientPep" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(142 90% 45%)" /><stop offset="50%" stopColor="hsl(142 85% 42%)" /><stop offset="100%" stopColor="hsl(142 76% 36%)" /></linearGradient>
                          <linearGradient id="chartGradientValor" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" /><stop offset="50%" stopColor="#1d4ed8" /><stop offset="100%" stopColor="#1e3a8a" /></linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card className="shadow-card hover:shadow-card-hover bg-white border-gray-200 transform transition-all duration-300 hover:scale-[1.02] overflow-hidden" ref={comparisonRef} tabIndex={0}>
                <CardHeader className="flex flex-row items-center justify-between bg-white border-b border-gray-300 rounded-t-xl">
                  <CardTitle className="text-lg font-semibold text-secondary-foreground">Comparativo por Região</CardTitle>
                  <Button size="sm" onClick={() => copyChartImage(comparisonRef, 'Comparativo')} className="w-8 h-8 p-0 text-gray-700 transition-all duration-200 bg-white border border-gray-300 shadow-md rounded-xl hover:bg-gray-50 hover:shadow-lg focus:outline-none focus:ring-0 ring-0" title="Copiar imagem (ou clique no gráfico e Ctrl+C)"><Copy className="w-4 h-4" /></Button>
                </CardHeader>
                <CardContent className="p-4">
                  <ChartContainer config={{ value: { label: "Valor (R$)", color: "hsl(var(--primary))" } }} className="h-64 sm:h-72 md:h-80 lg:h-[calc((100vh-20rem)/2)] lg:max-h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={filteredData.comparison} margin={{ top: 20, right: 20, bottom: 50, left: 20 }} barGap={4} barCategoryGap={16}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" fontSize={12} tickMargin={8} tick={(props: unknown) => { const p = props as ChartTickProps; const value = p && p.payload ? p.payload.value : ''; return (<g transform={`translate(${p.x},${p.y})`} style={{ cursor: 'pointer' }} onClick={() => handleChartClick('comparison', String(value))}><text x={0} y={0} dy={16} textAnchor="middle" fontSize={12} fill="currentColor">{String(value)}</text></g>); }} />
                        <YAxis yAxisId="left" fontSize={12} />
                        <YAxis yAxisId="right" orientation="right" fontSize={12} hide />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', boxShadow: 'var(--shadow-elegant)' }} formatter={(value) => { const num = typeof value === 'number' ? value : Number(value) || 0; return [num.toLocaleString('pt-BR'), '']; }} />
                        <Bar yAxisId="left" dataKey="qtd" fill="url(#chartGreenGradientComparison)" radius={[8, 8, 0, 0]} style={{ cursor: 'pointer' }}>
                          {filteredData.comparison.map((_, index) => (<Cell key={`cell-${index}`} fill={"url(#chartGreenGradientComparison)"} />))}
                          <LabelList dataKey="qtd" content={() => null} />
                        </Bar>
                        <Bar yAxisId="right" dataKey="value" fill="url(#chartBlueGradientValue)" radius={[8, 8, 0, 0]} style={{ cursor: 'pointer' }}>
                          {filteredData.comparison.map((_, index) => (<Cell key={`cellv-${index}`} fill={"url(#chartBlueGradientValue)"} />))}
                          <LabelList dataKey="value" content={() => null} />
                        </Bar>
                        <defs>
                          <linearGradient id="chartGreenGradientComparison" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(142 90% 45%)" /><stop offset="50%" stopColor="hsl(142 85% 42%)" /><stop offset="100%" stopColor="hsl(142 76% 36%)" /></linearGradient>
                          <linearGradient id="chartBlueGradientValue" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" /><stop offset="50%" stopColor="#1d4ed8" /><stop offset="100%" stopColor="#1e3a8a" /></linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card className="shadow-card hover:shadow-card-hover bg-white border-gray-200 transform transition-all duration-300 hover:scale-[1.02] overflow-hidden" ref={statusCONCRef} tabIndex={0}>
                <CardHeader className="flex flex-row items-center justify-between bg-white border-b border-gray-300 rounded-t-xl">
                  <CardTitle className="text-lg font-semibold text-secondary-foreground">Status CONC</CardTitle>
                  <Button size="sm" onClick={() => copyChartImage(statusCONCRef, 'Status CONC')} className="w-8 h-8 p-0 text-gray-700 transition-all duration-200 bg-white border border-gray-300 shadow-md rounded-xl hover:bg-gray-50 hover:shadow-lg focus:outline-none focus:ring-0 ring-0" title="Copiar imagem (ou clique no gráfico e Ctrl+C)"><Copy className="w-4 h-4" /></Button>
                </CardHeader>
                <CardContent className="p-4">
                  <ChartContainer config={{ value: { label: "Valor (R$)", color: "hsl(var(--primary))" } }} className="h-64 sm:h-72 md:h-80 lg:h-[calc((100vh-20rem)/2)] lg:max-h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={filteredData.statusCONC} margin={{ top: 20, right: 15, bottom: 50, left: 15 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" fontSize={12} tickMargin={8} tick={(props: unknown) => { const p = props as ChartTickProps; const value = p && p.payload ? p.payload.value : ''; return (<g transform={`translate(${p.x},${p.y})`} style={{ cursor: 'pointer' }} onClick={() => handleChartClick('statusCONC', String(value))}><text x={0} y={0} dy={16} textAnchor="middle" fontSize={12} fill="currentColor">{String(value)}</text></g>); }} />
                        <YAxis fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', boxShadow: 'var(--shadow-elegant)' }} formatter={(value: number) => [value.toLocaleString('pt-BR'), 'Qtd']} />
                        <Bar dataKey="qtd" fill="url(#chartGreenGradientConc)" radius={[8, 8, 0, 0]} style={{ cursor: 'pointer' }}>
                          {filteredData.statusCONC.map((_, index) => (<Cell key={`cell-${index}`} fill={"url(#chartGreenGradientConc)"} />))}
                          <LabelList dataKey="qtd" content={() => null} />
                        </Bar>
                        <defs>
                          <linearGradient id="chartGreenGradientConc" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(142 90% 45%)" /><stop offset="50%" stopColor="hsl(142 85% 42%)" /><stop offset="100%" stopColor="hsl(142 76% 36%)" /></linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card className="shadow-card hover:shadow-card-hover bg-white border-gray-200 transform transition-all duration-300 hover:scale-[1.02] overflow-hidden" ref={reasonsRef} tabIndex={0}>
                <CardHeader className="flex flex-row items-center justify-between bg-white border-b border-gray-300 rounded-t-xl">
                  <CardTitle className="text-lg font-semibold text-secondary-foreground">Motivos</CardTitle>
                  <Button size="sm" onClick={() => copyChartImage(reasonsRef, 'Motivos')} className="w-8 h-8 p-0 text-gray-700 transition-all duration-200 bg-white border border-gray-300 shadow-md rounded-xl hover:bg-gray-50 hover:shadow-lg focus:outline-none focus:ring-0 ring-0" title="Copiar imagem (ou clique no gráfico e Ctrl+C)"><Copy className="w-4 h-4" /></Button>
                </CardHeader>
                <CardContent className="p-4">
                  <ChartContainer config={{ value: { label: "Valor (R$)", color: "hsl(var(--primary))" } }} className="h-64 sm:h-72 md:h-80 lg:h-[calc((100vh-20rem)/2)] lg:max-h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={filteredData.reasons} margin={{ top: 20, right: 15, bottom: 50, left: 15 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" fontSize={12} tickMargin={8} interval={0} minTickGap={0} tick={(props: unknown) => { const p = props as ChartTickProps; const value = p && p.payload ? p.payload.value : ''; return (<g transform={`translate(${p.x},${p.y})`} style={{ cursor: 'pointer' }} onClick={() => handleChartClick('reasons', String(value))}><text x={0} y={0} dy={16} textAnchor="middle" fontSize={12} fill="currentColor">{String(value)}</text></g>); }} />
                        <YAxis fontSize={12} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', boxShadow: 'var(--shadow-elegant)' }} formatter={(value: number) => [value.toLocaleString('pt-BR'), 'Qtd']} />
                        <Bar dataKey="qtd" fill="url(#chartGreenGradientReasons)" radius={[8, 8, 0, 0]} style={{ cursor: 'pointer' }}>
                          {filteredData.reasons.map((_, index) => (<Cell key={`cell-${index}`} fill={"url(#chartGreenGradientReasons)"} />))}
                          <LabelList dataKey="qtd" content={() => null} />
                        </Bar>
                        <defs>
                          <linearGradient id="chartGreenGradientReasons" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(142 90% 45%)" /><stop offset="50%" stopColor="hsl(142 85% 42%)" /><stop offset="100%" stopColor="hsl(142 76% 36%)" /></linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-card hover:shadow-card-hover bg-white border-gray-200 transform transition-all duration-300 hover:scale-[1.01]">
              <CardHeader className="flex flex-row items-center justify-between bg-white border-b border-gray-300 rounded-t-xl">
                <CardTitle className="text-lg font-semibold text-secondary-foreground">Matriz de Carteira de Obras</CardTitle>
                <Button size="sm" onClick={() => { /* export placeholder */ }} className="flex items-center gap-2 text-gray-700 transition-all duration-200 bg-white border border-gray-300 shadow-md rounded-xl hover:bg-gray-50 hover:shadow-lg focus:outline-none focus:ring-0 ring-0"><Copy className="w-4 h-4" />Exportar Excel</Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto" ref={tableWrapperRef}>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 hover:bg-gray-100">
                        <TableHead className="font-semibold text-gray-700 transition-colors cursor-pointer select-none hover:bg-gray-200" onClick={() => handleSort('pep')}><div className="flex items-center gap-2">PEP {getSortIcon('pep')}</div></TableHead>
                        <TableHead className="font-semibold text-gray-700 transition-colors cursor-pointer select-none hover:bg-gray-200" onClick={() => handleSort('prazo')}><div className="flex items-center gap-2">Prazo {getSortIcon('prazo')}</div></TableHead>
                        <TableHead className="font-semibold text-gray-700 transition-colors cursor-pointer select-none hover:bg-gray-200" onClick={() => handleSort('dataConclusao')}><div className="flex items-center gap-2">Data Conclusão {getSortIcon('dataConclusao')}</div></TableHead>
                        <TableHead className="font-semibold text-gray-700 transition-colors cursor-pointer select-none hover:bg-gray-200" onClick={() => handleSort('status')}><div className="flex items-center gap-2">Status SAP {getSortIcon('status')}</div></TableHead>
                        <TableHead className="font-semibold text-gray-700 transition-colors cursor-pointer select-none hover:bg-gray-200" onClick={() => handleSort('rs')}><div className="flex items-center gap-2">R$ {getSortIcon('rs')}</div></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.matrix.map((row, index) => (
                        <TableRow data-row-index={index} key={index} className="hover:bg-gray-50">
                          <TableCell className="font-mono text-sm">{row.pep}</TableCell>
                          <TableCell className="text-sm">{row.prazo}</TableCell>
                          <TableCell className="text-sm">{row.dataConclusao}</TableCell>
                          <TableCell><span className={`px-3 py-1 rounded-full text-xs font-medium ${row.status === 'Concluído' ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-yellow-100 text-yellow-800 border border-yellow-300'}`}>{row.status}</span></TableCell>
                          <TableCell className="font-semibold">{row.rs?.toLocaleString?.('pt-BR')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <ContextMenu open={contextOpen} position={contextPos} items={contextItems} onClose={() => setContextOpen(false)} />
    </div>
  );
}
