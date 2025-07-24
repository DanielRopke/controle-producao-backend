
import React from 'react';
// @ts-ignore
import html2canvas from 'html2canvas';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LabelList, CartesianGrid
} from 'recharts'

/** Props do componente GraficoBarras */
interface Props {
  /** Título do gráfico */
  titulo: string
  /** Dados do gráfico (status e contagem) */
  dados: Array<{ status: string; count: number; seccional?: string }>
  /** Cor da barra (opcional) */
  cor?: string
  /** Callback ao clicar em uma barra */
  onBarClick?: (item: { status: string, count: number }) => void
}

/**
 * Renderiza gráfico de barras usando Recharts.
 */
export function GraficoBarras({ titulo, dados, cor = "#4ade80" }: Props) {
  // ...existing code...
  // Função para copiar imagem do quadrado grande
  // Função para copiar imagem do gráfico
  const copiarImagemPadrao = async () => {
    if (!graficoRef.current) return;
    html2canvas(graficoRef.current, {}).then((canvas: HTMLCanvasElement) => {
      canvas.toBlob((blob: Blob | null) => {
        if (blob) {
          const item = new ClipboardItem({ 'image/png': blob });
          navigator.clipboard.write([item]);
        }
      });
    });
  };
  const [selecionado, setSelecionado] = React.useState(false);
  const graficoRef = React.useRef<HTMLDivElement>(null);

  const handleGraficoClick = () => {
    setSelecionado(true);
    setTimeout(() => setSelecionado(false), 800);
  };

  // Removido copiarImagem não utilizado

  return (
    <div
      ref={graficoRef}
      className="p-6 rounded-3xl shadow-lg h-[280px] flex flex-col relative"
      style={{
        background: 'linear-gradient(135deg, #bbf7d0 0%, #a7f3d0 100%)',
        borderRadius: '1.25rem',
        boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
        border: selecionado ? '4px solid #3182ce' : 'none',
        transition: 'border 0.2s',
      }}
      onClick={handleGraficoClick}
    >
      <button
        title="Copiar imagem do gráfico"
        onClick={e => { e.stopPropagation(); copiarImagemPadrao(); }}
        style={{ position: 'absolute', top: 12, right: 12, zIndex: 20, width: 32, height: 32, background: '#fff', borderRadius: 8, border: '2px solid #4ade80', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
      >
        {/* Ícone clássico de copiar (duas folhas) */}
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="6" y="6" width="9" height="12" rx="2" fill="#bbf7d0" stroke="#22c55e" strokeWidth="1.5" />
          <rect x="3" y="3" width="9" height="12" rx="2" fill="#fff" stroke="#22c55e" strokeWidth="1.2" />
        </svg>
      </button>
      <h2 className="text-center font-semibold mb-4 font-serif text-gray-700 text-[20px]">{titulo}</h2>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={Array.isArray(dados) ? dados : []} margin={{ top: 20, right: 30, left: 30, bottom: 40 }}>
          <foreignObject x={0} y={0} width="100%" height="100%">
            <div style={{width: '100%', height: '100%', background: 'rgba(255,255,255,0.9)', borderRadius: 20, backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(16px)'}} />
          </foreignObject>
            <div style={{width: '100%', height: '100%', background: 'rgba(255,255,255,0.9)', borderRadius: 20, backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(16px)'}} />
          <YAxis hide />
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="status" tick={{ fill: '#4a4a4a' }} interval={0} />
          <YAxis hide />
          <Tooltip />
          <Bar dataKey="count" fill={cor} aria-label="Barra de contagem">
            <LabelList dataKey="count" position="top" fill="#333" fontSize={12} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
