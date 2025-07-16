import type { MatrizItem } from '../types'

interface Props {
  dados: MatrizItem[]
}

export function TabelaMatriz({ dados }: Props) {
  const safeDados = Array.isArray(dados) ? dados : [];

  return (
    <>
      <div style={{ height: 16 }} />
      <div
        className="w-full flex flex-col gap-0 rounded-3xl"
        style={{
          background: 'linear-gradient(135deg, #bbf7d0 0%, #a7f3d0 100%)',
          borderRadius: '1.5rem',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.10)'
        }}
      >
        <div className="rounded-t-3xl px-6 py-4" style={{ background: 'transparent', borderTopLeftRadius: '1.5rem', borderTopRightRadius: '1.5rem' }}>
          <h2 className="text-center font-semibold font-serif text-gray-700 text-[20px] m-0">Matriz de Prazos SAP</h2>
        </div>
        <div
          className="rounded-3xl p-0 w-full overflow-x-auto"
          style={{
            background: '#fff',
            borderRadius: '1.5rem',
            overflow: 'hidden',
          }}
        >
          <table
            className="min-w-full table-auto text-sm text-left text-gray-700 border-separate"
            style={{ borderSpacing: 0, width: '100%' }}
          >
            <thead className="bg-gradient-to-r from-green-100 to-green-200">
              <tr>
                <th className="py-3 px-4 font-bold text-green-700 border border-[#d1fae5]">PEP</th>
                <th className="py-3 px-4 font-bold text-green-700 border border-[#d1fae5]">Prazo</th>
                <th className="py-3 px-4 font-bold text-green-700 border border-[#d1fae5]">Data Conclusão</th>
                <th className="py-3 px-4 font-bold text-green-700 border border-[#d1fae5]">Status SAP</th>
                <th className="py-3 px-4 font-bold text-green-700 border border-[#d1fae5]">R$</th>
              </tr>
            </thead>
            <tbody>
              {safeDados.length > 0 ? (
                safeDados.map((item, idx) => (
                  <tr
                    key={idx}
                    className={
                      `transition-colors duration-150`
                    }
                  >
                    <td className="py-2 px-4 font-mono text-gray-800 border border-[#d1fae5]">{item.pep}</td>
                    <td className="py-2 px-4 border border-[#d1fae5]">{item.prazo}</td>
                    <td className="py-2 px-4 border border-[#d1fae5]">{item.dataConclusao}</td>
                    <td className="py-2 px-4 border border-[#d1fae5]">
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">{item.statusSap}</span>
                    </td>
                    <td className="py-2 px-4 font-semibold text-green-700 border border-[#d1fae5]">{item.valor}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center text-gray-400 py-4 border border-[#d1fae5]">Nenhum dado disponível</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
