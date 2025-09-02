import React, { useState, useRef, useEffect } from 'react';
import { fetchStatusEner } from '../services/api';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Copy, RotateCcw, Menu, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { ChartContainer } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { toast } from "sonner";
import { subDays } from 'date-fns';
import { DateRangeFilter } from './DateRangeFilter';
import { PEPSearch } from './PEPSearch';
import { cn } from "@/lib/utils";

interface DashboardData {
  regions: string[];
  statusENER: { name: string; value: number }[];
  statusCONC: { name: string; value: number }[];
  comparison: { name: string; value: number; qtd: number }[];
  reasons: { name: string; value: number }[];
  matrix: { pep: string; prazo: string; dataConclusao: string; status: string; rs: number }[];
}

const mockData: DashboardData = {
  regions: ['Campanha', 'Centro Sul', 'Litoral Sul', 'Sul'],
  statusENER: [
    { name: 'LIB /ENER', value: 53 },
    { name: 'Fora do Prazo', value: 22 },
    { name: 'Dentro do Prazo', value: 9 }
  ],
  statusCONC: [
    { name: 'Fora do Prazo', value: 48 },
    { name: 'Dentro do Prazo', value: 29 }
  ],
  comparison: [
    { name: 'Sul', value: 5350868, qtd: 641 },
    { name: 'Litoral Sul', value: 2555560, qtd: 280 },
    { name: 'Centro Sul', value: 1497167, qtd: 343 },
    { name: 'Campanha', value: 978705, qtd: 165 }
  ],
  reasons: [
    { name: 'Em Fechamento', value: 813 },
    { name: 'No Almox', value: 21 },
    { name: '#REF!', value: 1 },
    { name: 'Defeito Progeo', value: 1 }
  ],
  matrix: [
    { pep: 'RS-25030O4MMT1.2.0183', prazo: '03/06/2025', dataConclusao: '03/06/2025', status: 'Concluído', rs: 282 },
    { pep: 'RS-2301112UNR1.2.0200', prazo: '10/01/2025', dataConclusao: '10/01/2025', status: 'Concluído', rs: 330586 },
    { pep: 'RS-2402704ERD1.2.0651', prazo: '07/03/2025', dataConclusao: '07/03/2025', status: 'Pendente', rs: 6 },
    { pep: 'RS-2502804NIV1.2.0021', prazo: '16/01/2025', dataConclusao: '16/01/2025', status: 'Concluído', rs: 54 },
    { pep: 'RS-2402804NIV1.2.0057', prazo: '30/01/2025', dataConclusao: '30/01/2025', status: 'Pendente', rs: 24 },
    { pep: 'RS-2304712REG1.2.0008', prazo: '14/01/2025', dataConclusao: '14/01/2025', status: 'Concluído', rs: 271693 }
  ]
};

export function Dashboard() {
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('Status SAP');
  const [selectedType, setSelectedType] = useState<string>('Tipo');
  const [selectedMonth, setSelectedMonth] = useState<string>('Mês');
  
  // Estados para filtros interativos
  const [activeFilters, setActiveFilters] = useState<{
    statusENER?: string;
    statusCONC?: string;
    comparison?: string;
    reasons?: string;
  }>({});
  
  // Estado para o filtro de datas
  const [selectedStartDate, setSelectedStartDate] = useState<Date | undefined>(subDays(new Date(), 365));
  const [selectedEndDate, setSelectedEndDate] = useState<Date | undefined>(new Date());

  // Estado para controlar sidebar em mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Estados para pesquisa PEP e ordenação
  const [pepSearch, setPepSearch] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof DashboardData['matrix'][0] | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });

  // Estado para linha selecionada da matriz
  const [selectedMatrixRow, setSelectedMatrixRow] = useState<string | null>(null);

  // Função para limpar filtros
  const clearFilters = () => {
    setSelectedRegion('all');
    setSelectedStatus('Status SAP');
    setSelectedType('Tipo');
    setSelectedMonth('Mês');
    setSelectedStartDate(subDays(new Date(), 365));
    setSelectedEndDate(new Date());
    setActiveFilters({});
    setPepSearch('');
    setSortConfig({ key: null, direction: 'asc' });
    setSelectedMatrixRow(null);
    toast('Filtros limpos!');
  };

  // Função para selecionar linha da matriz
  const handleMatrixRowClick = (row: DashboardData['matrix'][0]) => {
    if (selectedMatrixRow === row.pep) {
      // Se a mesma linha já está selecionada, deseleciona
      setSelectedMatrixRow(null);
      toast('Seleção removida');
    } else {
      // Seleciona a nova linha
      setSelectedMatrixRow(row.pep);
      toast(`PEP selecionado: ${row.pep}`);
    }
  };

  // Função para limpar pesquisa PEP
  const clearPepSearch = () => {
    setPepSearch('');
    toast('Pesquisa PEP limpa!');
  };

  // Carrega Status ENER real do backend (substitui mock se retornar ok)
  useEffect(() => {
    let cancelled = false;
    fetchStatusEner()
      .then(items => {
        if (cancelled) return;
        // Atualiza somente a parte statusENER; mantém demais mocks até integração completa
        mockData.statusENER = items;
        // força re-render alterando estado irrelevante
        setSelectedRegion(r => r);
      })
      .catch(() => {/* silencioso: mantém mock */});
    return () => { cancelled = true; };
  }, []);

  // Função para ordenação das colunas
  const handleSort = (key: keyof DashboardData['matrix'][0]) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Função para renderizar ícone de ordenação
  const getSortIcon = (columnKey: keyof DashboardData['matrix'][0]) => {
    if (sortConfig.key !== columnKey) {
      return <ChevronsUpDown className="w-4 h-4 text-muted-foreground" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-primary" />
      : <ChevronDown className="w-4 h-4 text-primary" />;
  };

  // Funções para filtros interativos
  const handleChartClick = (chartType: string, dataPoint: any) => {
    const newFilters = { ...activeFilters };
    const filterKey = chartType as keyof typeof activeFilters;
    
    if (newFilters[filterKey] === dataPoint.name) {
      // Se já está filtrado por este item, remove o filtro
      delete newFilters[filterKey];
      toast(`Filtro removido: ${dataPoint.name}`);
    } else {
      // Aplica o novo filtro
      newFilters[filterKey] = dataPoint.name;
      toast(`Filtro aplicado: ${dataPoint.name}`);
    }
    
    setActiveFilters(newFilters);
  };
  
  // Refs para os gráficos
  const statusENERRef = useRef<HTMLDivElement>(null);
  const comparisonRef = useRef<HTMLDivElement>(null);
  const statusCONCRef = useRef<HTMLDivElement>(null);
  const reasonsRef = useRef<HTMLDivElement>(null);

  const filteredData = React.useMemo(() => {
    let data = { ...mockData };
    
    // Filtro por região
    if (selectedRegion !== 'all') {
      data.comparison = data.comparison.filter(item => item.name === selectedRegion);
    }
    
    // Filtro por linha selecionada da matriz
    if (selectedMatrixRow) {
      const selectedRow = mockData.matrix.find(row => row.pep === selectedMatrixRow);
      if (selectedRow) {
        // Simular dados baseados na linha selecionada
        const statusMultiplier = selectedRow.status === 'Concluído' ? 1.2 : 0.7;
        const valueMultiplier = selectedRow.rs > 100000 ? 1.5 : selectedRow.rs > 10000 ? 1.0 : 0.5;
        
        data.statusENER = data.statusENER.map(item => ({
          ...item,
          value: Math.round(item.value * statusMultiplier * 0.3)
        }));
        
        data.statusCONC = data.statusCONC.map(item => ({
          ...item,
          value: Math.round(item.value * statusMultiplier * 0.4)
        }));
        
        data.comparison = data.comparison.map(item => ({
          ...item,
          value: Math.round(selectedRow.rs * (item.name === 'Sul' ? 1.2 : item.name === 'Litoral Sul' ? 0.8 : 0.6)),
          qtd: Math.round(item.qtd * valueMultiplier * 0.2)
        }));
        
        data.reasons = data.reasons.map(item => ({
          ...item,
          value: Math.round(item.value * statusMultiplier * 0.2)
        }));
      }
    }

    // Aplicar filtros interativos
    if (Object.keys(activeFilters).length > 0) {
      // Simular filtros cruzados baseados nos filtros ativos
      if (activeFilters.comparison) {
        // Filtrar outros gráficos baseado na região selecionada
        const selectedRegionData = activeFilters.comparison;
        data.statusENER = data.statusENER.map(item => ({
          ...item,
          value: Math.round(item.value * (selectedRegionData === 'Sul' ? 1.2 : selectedRegionData === 'Litoral Sul' ? 0.8 : selectedRegionData === 'Centro Sul' ? 0.6 : 0.4))
        }));
        data.statusCONC = data.statusCONC.map(item => ({
          ...item,
          value: Math.round(item.value * (selectedRegionData === 'Sul' ? 1.1 : selectedRegionData === 'Litoral Sul' ? 0.9 : selectedRegionData === 'Centro Sul' ? 0.7 : 0.5))
        }));
        data.reasons = data.reasons.map(item => ({
          ...item,
          value: Math.round(item.value * (selectedRegionData === 'Sul' ? 1.3 : selectedRegionData === 'Litoral Sul' ? 0.7 : selectedRegionData === 'Centro Sul' ? 0.5 : 0.3))
        }));
      }
      
      if (activeFilters.statusENER) {
        // Filtrar baseado no status ENER selecionado
        const multiplier = activeFilters.statusENER === 'LIB /ENER' ? 1.5 : activeFilters.statusENER === 'Fora do Prazo' ? 0.8 : 0.3;
        data.comparison = data.comparison.map(item => ({
          ...item,
          value: Math.round(item.value * multiplier),
          qtd: Math.round(item.qtd * multiplier)
        }));
        data.statusCONC = data.statusCONC.map(item => ({
          ...item,
          value: Math.round(item.value * multiplier)
        }));
        data.reasons = data.reasons.map(item => ({
          ...item,
          value: Math.round(item.value * multiplier)
        }));
      }
      
      if (activeFilters.statusCONC) {
        // Filtrar baseado no status CONC selecionado
        const multiplier = activeFilters.statusCONC === 'Fora do Prazo' ? 1.2 : 0.6;
        data.comparison = data.comparison.map(item => ({
          ...item,
          value: Math.round(item.value * multiplier),
          qtd: Math.round(item.qtd * multiplier)
        }));
        data.statusENER = data.statusENER.map(item => ({
          ...item,
          value: Math.round(item.value * multiplier)
        }));
        data.reasons = data.reasons.map(item => ({
          ...item,
          value: Math.round(item.value * multiplier)
        }));
      }
      
      if (activeFilters.reasons) {
        // Filtrar baseado no motivo selecionado
        const multiplier = activeFilters.reasons === 'Em Fechamento' ? 1.1 : 0.2;
        data.comparison = data.comparison.map(item => ({
          ...item,
          value: Math.round(item.value * multiplier),
          qtd: Math.round(item.qtd * multiplier)
        }));
        data.statusENER = data.statusENER.map(item => ({
          ...item,
          value: Math.round(item.value * multiplier)
        }));
        data.statusCONC = data.statusCONC.map(item => ({
          ...item,
          value: Math.round(item.value * multiplier)
        }));
      }
    }

    // Filtro por pesquisa PEP
    if (pepSearch.trim()) {
      data.matrix = data.matrix.filter(item => 
        item.pep.toLowerCase().includes(pepSearch.toLowerCase())
      );
    }

    // Aplicar ordenação à matriz
    if (sortConfig.key) {
      data.matrix = [...data.matrix].sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];
        
        if (sortConfig.key === 'rs') {
          // Ordenação numérica para valores
          return sortConfig.direction === 'asc' 
            ? (aValue as number) - (bValue as number)
            : (bValue as number) - (aValue as number);
        } else {
          // Ordenação alfabética para strings
          const aStr = String(aValue).toLowerCase();
          const bStr = String(bValue).toLowerCase();
          if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
          if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
        }
      });
    }
    
    return data;
  }, [selectedRegion, activeFilters, pepSearch, sortConfig, selectedMatrixRow]);

  // Função para copiar imagem do gráfico
  const copyChartImage = async (chartRef: React.RefObject<HTMLDivElement>, chartName: string) => {
    if (!chartRef.current) return;
    
    try {
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true
      });
      
      canvas.toBlob((blob) => {
        if (blob) {
          const item = new ClipboardItem({ 'image/png': blob });
          navigator.clipboard.write([item]).then(() => {
            toast(`Imagem do gráfico ${chartName} copiada!`);
          }).catch(() => {
            toast(`Erro ao copiar imagem do gráfico ${chartName}`);
          });
        }
      });
    } catch (error) {
      console.error('Erro ao capturar gráfico:', error);
      toast(`Erro ao copiar imagem do gráfico ${chartName}`);
    }
  };

  // Função para exportar Excel
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
    toast('Arquivo Excel exportado com sucesso!');
  };


  // Listener para Ctrl+C nos gráficos
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'c') {
        const activeElement = document.activeElement;
        
        if (statusENERRef.current?.contains(activeElement)) {
          event.preventDefault();
          copyChartImage(statusENERRef, 'Status ENER');
        } else if (comparisonRef.current?.contains(activeElement)) {
          event.preventDefault();
          copyChartImage(comparisonRef, 'Comparativo');
        } else if (statusCONCRef.current?.contains(activeElement)) {
          event.preventDefault();
          copyChartImage(statusCONCRef, 'Status CONC');
        } else if (reasonsRef.current?.contains(activeElement)) {
          event.preventDefault();
          copyChartImage(reasonsRef, 'Motivos');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const totalValue = filteredData.comparison.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="min-h-screen bg-gradient-page">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-gradient-primary backdrop-blur-sm border-primary/20 shadow-header">
        <div className="flex items-center justify-between h-16 px-4 lg:px-6">
          <div className="flex items-center gap-3 lg:gap-6">
            {/* Mobile menu button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex items-center gap-2 text-gray-700 transition-all duration-200 bg-white border-gray-300 lg:hidden rounded-xl shadow-button hover:shadow-button-hover hover:bg-gray-50"
            >
              <Menu className="w-4 h-4" />
            </Button>

            <div className="flex items-center gap-3">
              <div className="bg-primary-foreground text-primary px-3 lg:px-4 py-2 rounded-xl font-bold shadow-button text-center text-sm lg:text-base w-[100px] lg:w-[120px]">
                setup
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="items-center hidden gap-2 text-gray-700 transition-all duration-200 bg-white border-gray-300 sm:flex rounded-xl shadow-button hover:shadow-button-hover hover:bg-gray-50"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden md:inline">Limpar Filtros</span>
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-2 lg:gap-4">
            <div className="flex items-center gap-2 lg:gap-3">
              <span className="hidden text-xs lg:text-sm text-primary-foreground/80 sm:inline">Valor Total</span>
              <div className="px-2 py-1 text-sm font-semibold rounded-lg bg-primary-foreground/90 text-primary lg:px-4 lg:py-2 lg:rounded-xl shadow-button backdrop-blur-sm lg:text-base">
                R$ {totalValue.toLocaleString('pt-BR', { notation: 'compact' })}
              </div>
            </div>
            <div className="flex items-center gap-2 lg:gap-3">
              <span className="hidden text-xs lg:text-sm text-primary-foreground/80 sm:inline">PEP</span>
              <div className="px-2 py-1 text-sm font-semibold rounded-lg bg-primary-foreground/90 text-primary lg:px-4 lg:py-2 lg:rounded-xl shadow-button backdrop-blur-sm lg:text-base">
                1429
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="relative flex pt-16">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Responsive Sidebar */}
        <aside className={cn(
          "fixed left-0 top-16 bottom-0 w-64 bg-gradient-card/95 backdrop-blur-lg border-r border-border/50 shadow-sidebar overflow-y-auto z-50 transition-transform duration-300",
          "lg:translate-x-0 lg:fixed lg:z-auto lg:h-[calc(100vh-4rem)]",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}>
          <div className="p-4 space-y-4 lg:p-6 lg:space-y-6">
            {/* Close button for mobile */}
            <div className="flex justify-end lg:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="w-8 h-8 p-0"
              >
                ×
              </Button>
            </div>

            {/* Region Filters */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground">Regiões</h3>
              <div className="space-y-2">
                {mockData.regions.map((region) => (
                  <Button
                    key={region}
                    variant={selectedRegion === region ? "default" : "outline"}
                    onClick={() => {
                      setSelectedRegion(region);
                      setSidebarOpen(false);
                    }}
                    className="justify-start w-full text-sm transition-all duration-200 rounded-xl shadow-button hover:shadow-elegant"
                    size="sm"
                  >
                    {region}
                  </Button>
                ))}
              </div>
            </div>

            {/* Other Filters */}
            <div className="pt-4 space-y-4 border-t border-border/50">
              <h3 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground">Filtros</h3>
              <div className="space-y-3">
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-full rounded-xl shadow-button border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Status SAP">Status SAP</SelectItem>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-full rounded-xl shadow-button border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tipo">Tipo</SelectItem>
                    <SelectItem value="A">Tipo A</SelectItem>
                    <SelectItem value="B">Tipo B</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-full rounded-xl shadow-button border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mês">Mês</SelectItem>
                    <SelectItem value="Janeiro">Janeiro</SelectItem>
                    <SelectItem value="Fevereiro">Fevereiro</SelectItem>
                  </SelectContent>
                </Select>

                {/* Mobile clear filters button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    clearFilters();
                    setSidebarOpen(false);
                  }}
                  className="flex items-center w-full gap-2 text-gray-700 transition-all duration-200 bg-white border-gray-300 lg:hidden rounded-xl shadow-button hover:shadow-button-hover hover:bg-gray-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  Limpar Filtros
                </Button>
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="pt-4 border-t border-border/50">
              <DateRangeFilter
                startDate={selectedStartDate}
                endDate={selectedEndDate}
                onStartDateChange={setSelectedStartDate}
                onEndDateChange={setSelectedEndDate}
              />
            </div>

            {/* PEP Search */}
            <div className="pt-4 border-t border-border/50">
              <PEPSearch
                searchValue={pepSearch}
                onSearchChange={setPepSearch}
                onClearSearch={clearPepSearch}
              />
            </div>
          </div>
        </aside>

        {/* Main Content - Responsive */}
        <main className="flex-1 w-full p-2 sm:p-4 lg:p-6 lg:ml-64">
          {/* Gráficos 2x2 - ocupam 100% da viewport sem espaços vazios */}
          <div className="lg:h-[calc(100vh-8rem)] lg:min-h-[500px] lg:max-h-[calc(100vh-8rem)] mb-8">
            {/* Grid 2x2 dos gráficos - perfeitamente distribuído */}
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-3 lg:h-full lg:grid-rows-2">
                {/* Status ENER Chart */}
            <Card className="shadow-card hover:shadow-card-hover bg-gradient-card backdrop-blur-sm border-border/50 transform transition-all duration-300 hover:scale-[1.02] hover:bg-gradient-card-hover overflow-hidden" ref={statusENERRef} tabIndex={0}>
              <CardHeader className="flex flex-row items-center justify-between border-b bg-gradient-secondary/40 backdrop-blur-sm rounded-t-xl border-border/30">
                <CardTitle className="text-lg font-semibold text-secondary-foreground">Status ENER</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyChartImage(statusENERRef, 'Status ENER')}
                  className="w-8 h-8 p-0 transition-all duration-200 rounded-lg shadow-button hover:shadow-button-hover bg-gradient-button hover:bg-gradient-button/80"
                  title="Copiar imagem (ou clique no gráfico e Ctrl+C)"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="p-4">
                <ChartContainer
                  config={{
                    value: {
                      label: "Quantidade",
                      color: "hsl(var(--primary))",
                    },
                  }}
                  className="h-64 sm:h-72 md:h-80 lg:h-[calc((100vh-20rem)/2)] lg:max-h-[350px] w-full"
                >
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={filteredData.statusENER} margin={{ top: 20, right: 15, bottom: 50, left: 15 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" fontSize={12} tickMargin={8} />
                      <YAxis fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          boxShadow: 'var(--shadow-elegant)'
                        }} 
                      />
                       <Bar 
                         dataKey="value" 
                         fill="url(#chartGradient)" 
                         radius={[8, 8, 0, 0]}
                         onClick={(data) => handleChartClick('statusENER', data)}
                         style={{ cursor: 'pointer' }}
                       >
                         {filteredData.statusENER.map((entry, index) => (
                           <Cell 
                             key={`cell-${index}`}
                             fill={activeFilters.statusENER === entry.name ? "hsl(var(--primary))" : "url(#chartGradient)"}
                             stroke={activeFilters.statusENER === entry.name ? "hsl(var(--primary-foreground))" : "none"}
                             strokeWidth={activeFilters.statusENER === entry.name ? 2 : 0}
                           />
                         ))}
                         <LabelList 
                           dataKey="value" 
                           position="top" 
                           fontSize={12}
                           fill="hsl(var(--foreground))"
                           fontWeight="semibold"
                         />
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

            {/* Comparison Chart */}
            <Card className="shadow-card hover:shadow-card-hover bg-gradient-card backdrop-blur-sm border-border/50 transform transition-all duration-300 hover:scale-[1.02] hover:bg-gradient-card-hover overflow-hidden" ref={comparisonRef} tabIndex={0}>
              <CardHeader className="flex flex-row items-center justify-between border-b bg-gradient-secondary/40 backdrop-blur-sm rounded-t-xl border-border/30">
                <CardTitle className="text-lg font-semibold text-secondary-foreground">Comparativo por Seccional</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyChartImage(comparisonRef, 'Comparativo')}
                  className="w-8 h-8 p-0 transition-all duration-200 rounded-lg shadow-button hover:shadow-button-hover bg-gradient-button hover:bg-gradient-button/80"
                  title="Copiar imagem (ou clique no gráfico e Ctrl+C)"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="p-4">
                <ChartContainer
                  config={{
                    value: {
                      label: "Valor R$",
                      color: "hsl(var(--primary))",
                    },
                  }}
                  className="h-64 sm:h-72 md:h-80 lg:h-[calc((100vh-20rem)/2)] lg:max-h-[350px] w-full"
                >
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={filteredData.comparison} margin={{ top: 20, right: 15, bottom: 50, left: 15 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" fontSize={12} tickMargin={8} />
                      <YAxis fontSize={12} />
                      <Tooltip 
                        formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, 'Valor']}
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          boxShadow: 'var(--shadow-elegant)'
                        }} 
                      />
                       <Bar 
                         dataKey="value" 
                         fill="url(#chartGradient2)" 
                         radius={[8, 8, 0, 0]}
                         onClick={(data) => handleChartClick('comparison', data)}
                         style={{ cursor: 'pointer' }}
                       >
                         {filteredData.comparison.map((entry, index) => (
                           <Cell 
                             key={`cell-${index}`}
                             fill={activeFilters.comparison === entry.name ? "hsl(var(--primary))" : "url(#chartGradient2)"}
                             stroke={activeFilters.comparison === entry.name ? "hsl(var(--primary-foreground))" : "none"}
                             strokeWidth={activeFilters.comparison === entry.name ? 2 : 0}
                           />
                         ))}
                         <LabelList 
                           dataKey="value" 
                           position="top" 
                           fontSize={10}
                           fill="hsl(var(--foreground))"
                           fontWeight="semibold"
                           formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { notation: 'compact' })}`}
                         />
                       </Bar>
                       <defs>
                         <linearGradient id="chartGradient2" x1="0" y1="0" x2="0" y2="1">
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

            {/* Status CONC Chart */}
            <Card className="shadow-card hover:shadow-card-hover bg-gradient-card backdrop-blur-sm border-border/50 transform transition-all duration-300 hover:scale-[1.02] hover:bg-gradient-card-hover overflow-hidden" ref={statusCONCRef} tabIndex={0}>
              <CardHeader className="flex flex-row items-center justify-between border-b bg-gradient-secondary/40 backdrop-blur-sm rounded-t-xl border-border/30">
                <CardTitle className="text-lg font-semibold text-secondary-foreground">Status CONC</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyChartImage(statusCONCRef, 'Status CONC')}
                  className="w-8 h-8 p-0 transition-all duration-200 rounded-lg shadow-button hover:shadow-button-hover bg-gradient-button hover:bg-gradient-button/80"
                  title="Copiar imagem (ou clique no gráfico e Ctrl+C)"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="p-4">
                <ChartContainer
                  config={{
                    value: {
                      label: "Quantidade",
                      color: "hsl(var(--primary))",
                    },
                  }}
                  className="h-64 sm:h-72 md:h-80 lg:h-[calc((100vh-20rem)/2)] lg:max-h-[350px] w-full"
                >
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={filteredData.statusCONC} margin={{ top: 20, right: 15, bottom: 50, left: 15 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" fontSize={12} tickMargin={8} />
                      <YAxis fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          boxShadow: 'var(--shadow-elegant)'
                        }} 
                      />
                       <Bar 
                         dataKey="value" 
                         fill="url(#chartGradient3)" 
                         radius={[8, 8, 0, 0]}
                         onClick={(data) => handleChartClick('statusCONC', data)}
                         style={{ cursor: 'pointer' }}
                       >
                         {filteredData.statusCONC.map((entry, index) => (
                           <Cell 
                             key={`cell-${index}`}
                             fill={activeFilters.statusCONC === entry.name ? "hsl(var(--primary))" : "url(#chartGradient3)"}
                             stroke={activeFilters.statusCONC === entry.name ? "hsl(var(--primary-foreground))" : "none"}
                             strokeWidth={activeFilters.statusCONC === entry.name ? 2 : 0}
                           />
                         ))}
                         <LabelList 
                           dataKey="value" 
                           position="top" 
                           fontSize={12}
                           fill="hsl(var(--foreground))"
                           fontWeight="semibold"
                         />
                       </Bar>
                       <defs>
                         <linearGradient id="chartGradient3" x1="0" y1="0" x2="0" y2="1">
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

            {/* Reasons Chart */}
            <Card className="shadow-card hover:shadow-card-hover bg-gradient-card backdrop-blur-sm border-border/50 transform transition-all duration-300 hover:scale-[1.02] hover:bg-gradient-card-hover overflow-hidden" ref={reasonsRef} tabIndex={0}>
              <CardHeader className="flex flex-row items-center justify-between border-b bg-gradient-secondary/40 backdrop-blur-sm rounded-t-xl border-border/30">
                <CardTitle className="text-lg font-semibold text-secondary-foreground">Motivo de Não Fechado</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyChartImage(reasonsRef, 'Motivos')}
                  className="w-8 h-8 p-0 transition-all duration-200 rounded-lg shadow-button hover:shadow-button-hover bg-gradient-button hover:bg-gradient-button/80"
                  title="Copiar imagem (ou clique no gráfico e Ctrl+C)"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="p-4">
                <ChartContainer
                  config={{
                    value: {
                      label: "Quantidade",
                      color: "hsl(var(--primary))",
                    },
                  }}
                  className="h-64 sm:h-72 md:h-80 lg:h-[calc((100vh-20rem)/2)] lg:max-h-[350px] w-full"
                >
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={filteredData.reasons} margin={{ top: 20, right: 15, bottom: 50, left: 15 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" fontSize={12} tickMargin={8} />
                      <YAxis fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          boxShadow: 'var(--shadow-elegant)'
                        }} 
                      />
                       <Bar 
                         dataKey="value" 
                         fill="url(#chartGradient4)" 
                         radius={[8, 8, 0, 0]}
                         onClick={(data) => handleChartClick('reasons', data)}
                         style={{ cursor: 'pointer' }}
                       >
                         {filteredData.reasons.map((entry, index) => (
                           <Cell 
                             key={`cell-${index}`}
                             fill={activeFilters.reasons === entry.name ? "hsl(var(--primary))" : "url(#chartGradient4)"}
                             stroke={activeFilters.reasons === entry.name ? "hsl(var(--primary-foreground))" : "none"}
                             strokeWidth={activeFilters.reasons === entry.name ? 2 : 0}
                           />
                         ))}
                         <LabelList 
                           dataKey="value" 
                           position="top" 
                           fontSize={12}
                           fill="hsl(var(--foreground))"
                           fontWeight="semibold"
                         />
                       </Bar>
                       <defs>
                         <linearGradient id="chartGradient4" x1="0" y1="0" x2="0" y2="1">
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

          {/* Matrix Table */}
          <Card className="shadow-card hover:shadow-card-hover bg-gradient-card backdrop-blur-sm border-border/50 transform transition-all duration-300 hover:scale-[1.01]">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-gradient-secondary/40 backdrop-blur-sm rounded-t-xl border-border/30">
              <CardTitle className="text-lg font-semibold text-secondary-foreground">Matriz de Prazos SAP</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                className="flex items-center gap-2 transition-all duration-200 rounded-lg shadow-button hover:shadow-button-hover bg-gradient-button hover:bg-gradient-button/80"
              >
                <Copy className="w-4 h-4" />
                Exportar Excel
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/40">
                      <TableHead 
                        className="font-semibold transition-colors cursor-pointer select-none text-secondary-foreground hover:bg-muted/60"
                        onClick={() => handleSort('pep')}
                      >
                        <div className="flex items-center gap-2">
                          PEP
                          {getSortIcon('pep')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="font-semibold transition-colors cursor-pointer select-none text-secondary-foreground hover:bg-muted/60"
                        onClick={() => handleSort('prazo')}
                      >
                        <div className="flex items-center gap-2">
                          Prazo
                          {getSortIcon('prazo')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="font-semibold transition-colors cursor-pointer select-none text-secondary-foreground hover:bg-muted/60"
                        onClick={() => handleSort('dataConclusao')}
                      >
                        <div className="flex items-center gap-2">
                          Data Conclusão
                          {getSortIcon('dataConclusao')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="font-semibold transition-colors cursor-pointer select-none text-secondary-foreground hover:bg-muted/60"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center gap-2">
                          Status SAP
                          {getSortIcon('status')}
                        </div>
                      </TableHead>
                      <TableHead 
                        className="font-semibold transition-colors cursor-pointer select-none text-secondary-foreground hover:bg-muted/60"
                        onClick={() => handleSort('rs')}
                      >
                        <div className="flex items-center gap-2">
                          R$
                          {getSortIcon('rs')}
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.matrix.map((row, index) => (
                      <TableRow 
                        key={index} 
                        className={cn(
                          "cursor-pointer transition-all duration-200 select-none",
                          selectedMatrixRow === row.pep 
                            ? "bg-primary/10 border-l-4 border-l-primary shadow-md hover:bg-primary/15"
                            : selectedMatrixRow 
                              ? "opacity-50 hover:opacity-75 hover:bg-muted/10"
                              : "hover:bg-muted/20"
                        )}
                        onClick={() => handleMatrixRowClick(row)}
                      >
                        <TableCell className="font-mono text-sm">{row.pep}</TableCell>
                        <TableCell>{row.prazo}</TableCell>
                        <TableCell>{row.dataConclusao}</TableCell>
                        <TableCell>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            row.status === 'Concluído' 
                              ? 'bg-success/20 text-success-foreground border border-success/30' 
                              : 'bg-warning/20 text-warning-foreground border border-warning/30'
                          }`}>
                            {row.status}
                          </span>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {row.rs.toLocaleString('pt-BR')}
                        </TableCell>
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
