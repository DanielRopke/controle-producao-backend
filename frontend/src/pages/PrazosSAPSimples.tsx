// no React import required

export default function PrazosSAPSimples() {
  
  return (
    <div className="min-h-screen bg-white">
      {/* Cabeçalho */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-green-600 shadow-md">
        <div className="flex items-center justify-between h-16 px-6">
          <div className="text-xl font-bold text-white">Dashboard Prazos SAP</div>
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 font-semibold text-green-600 bg-white shadow-md rounded-xl">
              R$ 10.385.300
            </div>
            <div className="px-4 py-2 font-semibold text-green-600 bg-white shadow-md rounded-xl">
              1429 PEPs
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <div className="p-6 pt-20">
        <div className="grid grid-cols-1 gap-6 mb-6 md:grid-cols-2">
          {/* Card 1 */}
          <div className="p-5 bg-white border border-gray-200 shadow-md rounded-xl">
            <div className="flex items-center justify-between p-3 mb-4 rounded-lg bg-green-50">
              <h3 className="font-semibold text-green-800">Status ENER</h3>
              <button className="p-1 bg-white rounded-md shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </svg>
              </button>
            </div>
            <div className="flex items-center justify-center rounded-lg h-60 bg-gray-50">
              <div className="text-gray-500">Gráfico Status ENER</div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-5 bg-white border border-gray-200 shadow-md rounded-xl">
            <div className="flex items-center justify-between p-3 mb-4 rounded-lg bg-blue-50">
              <h3 className="font-semibold text-blue-800">Comparativo por Região</h3>
              <button className="p-1 bg-white rounded-md shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </svg>
              </button>
            </div>
            <div className="flex items-center justify-center rounded-lg h-60 bg-gray-50">
              <div className="text-gray-500">Gráfico Comparativo</div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-5 bg-white border border-gray-200 shadow-md rounded-xl">
            <div className="flex items-center justify-between p-3 mb-4 rounded-lg bg-purple-50">
              <h3 className="font-semibold text-purple-800">Status CONC</h3>
              <button className="p-1 bg-white rounded-md shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </svg>
              </button>
            </div>
            <div className="flex items-center justify-center rounded-lg h-60 bg-gray-50">
              <div className="text-gray-500">Gráfico Status CONC</div>
            </div>
          </div>

          {/* Card 4 */}
          <div className="p-5 bg-white border border-gray-200 shadow-md rounded-xl">
            <div className="flex items-center justify-between p-3 mb-4 rounded-lg bg-red-50">
              <h3 className="font-semibold text-red-800">Motivos</h3>
              <button className="p-1 bg-white rounded-md shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </svg>
              </button>
            </div>
            <div className="flex items-center justify-center rounded-lg h-60 bg-gray-50">
              <div className="text-gray-500">Gráfico Motivos</div>
            </div>
          </div>
        </div>

        {/* Tabela */}
        <div className="p-5 bg-white border border-gray-200 shadow-md rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Matriz de Prazos SAP</h3>
            <button className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
              </svg>
              Exportar Excel
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 font-semibold text-left text-gray-700">PEP</th>
                  <th className="px-4 py-2 font-semibold text-left text-gray-700">Status SAP</th>
                  <th className="px-4 py-2 font-semibold text-left text-gray-700">R$</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100 cursor-pointer hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-sm">RS-25030O4MMT1.2.0183</td>
                  <td className="px-4 py-3">
                    <span className="px-3 py-1 text-xs font-medium text-green-800 bg-green-100 border border-green-200 rounded-full">
                      Concluído
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold">282</td>
                </tr>
                <tr className="border-b border-gray-100 cursor-pointer hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-sm">RS-2301112UNR1.2.0200</td>
                  <td className="px-4 py-3">
                    <span className="px-3 py-1 text-xs font-medium text-green-800 bg-green-100 border border-green-200 rounded-full">
                      Concluído
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold">330.586</td>
                </tr>
                <tr className="border-b border-gray-100 cursor-pointer hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-sm">RS-2402704ERD1.2.0651</td>
                  <td className="px-4 py-3">
                    <span className="px-3 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 border border-yellow-200 rounded-full">
                      Pendente
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold">6</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
