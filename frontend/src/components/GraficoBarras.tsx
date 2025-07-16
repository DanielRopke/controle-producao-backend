import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LabelList, CartesianGrid
} from 'recharts'

interface Props {
  titulo: string
  dados: { status: string, count: number }[]
  cor?: string
}

export function GraficoBarras({ titulo, dados, cor = "#4ade80" }: Props) {
  return (
    <div
      className="p-6 rounded-3xl shadow-lg h-[280px] flex flex-col"
      style={{
        background: 'linear-gradient(135deg, #bbf7d0 0%, #a7f3d0 100%)',
        borderRadius: '1.25rem',
        boxShadow: '0 2px 16px rgba(0,0,0,0.08)'
      }}
    >
      <h2 className="text-center font-semibold mb-4 font-serif text-gray-700 text-[20px]">{titulo}</h2>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados} margin={{ top: 20, right: 30, left: 30, bottom: 40 }}>
          <foreignObject x={0} y={0} width="100%" height="100%">
            <div style={{width: '100%', height: '100%', background: 'rgba(255,255,255,0.9)', borderRadius: 20, backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(16px)'}} />
          </foreignObject>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="status" tick={{ fill: '#4a4a4a' }} />
          <YAxis hide />
          <Tooltip />
          <Bar dataKey="count" fill={cor}>
            <LabelList dataKey="count" position="top" fill="#333" fontSize={12} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
