import type { MatrizItem } from '../services/api'

/**
 * Componente de tabela para exibir matriz de prazos SAP.
 * @param dados - Array de itens da matriz (MatrizItem)
 */

/** Props do componente TabelaMatriz */
interface Props {
  /** Lista de itens da matriz */
  dados: MatrizItem[]
}

/**
 * Renderiza a tabela de prazos SAP.
 */
export function TabelaMatriz({ dados }: Props) {
  const safeDados = Array.isArray(dados) ? dados : [];

  return (
    <>
      <div style={{ height: 16 }} />
      <div
        className="flex flex-col w-full gap-0 rounded-3xl"
        style={{
          background: 'linear-gradient(135deg, #bbf7d0 0%, #a7f3d0 100%)',
          borderRadius: '1.5rem',
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.10)'
        }}
      >
        <div className="px-6 py-4 rounded-t-3xl" style={{ background: 'transparent', borderTopLeftRadius: '1.5rem', borderTopRightRadius: '1.5rem' }}>
          <h2 className="text-center font-semibold font-serif text-gray-700 text-[20px] m-0">Matriz de Prazos SAP</h2>
        </div>
        <div
          className="w-full p-0 overflow-x-auto rounded-3xl"
          style={{
            background: '#fff',
            borderRadius: '1.5rem',
            overflow: 'hidden',
          }}
        >
          <table
            className="min-w-full text-sm text-left text-gray-700 border-separate table-auto"
            style={{ borderSpacing: 0, width: '100%' }}
          >
            <thead className="bg-gradient-to-r from-green-100 to-green-200">
              <tr>
                <th scope="col" className="py-3 px-4 font-bold text-green-700 border border-[#d1fae5] text-center">PEP</th>
                <th scope="col" className="py-3 px-4 font-bold text-green-700 border border-[#d1fae5] text-center">Prazo</th>
                <th scope="col" className="py-3 px-4 font-bold text-green-700 border border-[#d1fae5] text-center">Data Conclusão</th>
                <th scope="col" className="py-3 px-4 font-bold text-green-700 border border-[#d1fae5] text-center">Status SAP</th>
                <th scope="col" className="py-3 px-4 font-bold text-green-700 border border-[#d1fae5] text-center">R$</th>
              </tr>
            </thead>
            <tbody>
              {safeDados.length > 0 ? (
                safeDados.map((item, idx) => (
                  <tr
                    key={idx}
                    className={
                      `transition-colors duration-150 ${idx % 2 === 0 ? 'bg-green-50' : ''}`
                    }
                  >
                    <td className="py-2 px-4 font-mono text-gray-800 border border-[#d1fae5]" aria-label="PEP">{item.pep || '-'}</td>
                    <td className="py-2 px-4 border border-[#d1fae5]" aria-label="Prazo">{item.prazo || '-'}</td>
                    <td className="py-2 px-4 border border-[#d1fae5]" aria-label="Data Conclusão">{item.dataConclusao || '-'}</td>
                    <td className="py-2 px-4 border border-[#d1fae5]" aria-label="Status SAP">
                      <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">{item.statusSap || '-'}</span>
                    </td>
                    <td className="py-2 px-4 font-semibold text-green-700 border border-[#d1fae5]" aria-label="Valor">{item.valor || '-'}</td>
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
