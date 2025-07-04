import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function PrazosSAP() {
  const [seccionais, setSeccionais] = useState([]);
  const [selectedSeccional, setSelectedSeccional] = useState(null);
  const [carteiraData, setCarteiraData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Busca os seccionais únicos
  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/seccionais/')
      .then(res => setSeccionais(res.data))
      .catch(err => console.error('Erro ao buscar seccionais:', err));
  }, []);

  // Busca todos os dados da carteira para filtrar depois
  useEffect(() => {
    if (selectedSeccional) {
      setLoading(true);
      axios.get('http://127.0.0.1:8000/api/carteira/')
        .then(res => {
          // Filtra só as linhas do seccional selecionado
          const filtered = res.data.filter(item => {
            // A coluna pode se chamar 'SECCIONAL' ou 'SECCIONAL\nOBRA'
            const secc = item['SECCIONAL'] || item['SECCIONAL\nOBRA'] || '';
            return secc === selectedSeccional;
          });
          setCarteiraData(filtered);
          setLoading(false);
        })
        .catch(err => {
          console.error('Erro ao buscar carteira:', err);
          setLoading(false);
        });
    } else {
      setCarteiraData([]);
    }
  }, [selectedSeccional]);

  return (
    <div style={{ display: 'flex', padding: '20px' }}>
      {/* Coluna dos botões */}
      <div style={{ marginRight: '30px' }}>
        <h3>Seccionais</h3>
        {seccionais.map((sec) => (
          <button
            key={sec}
            style={{
              display: 'block',
              marginBottom: '8px',
              backgroundColor: sec === selectedSeccional ? '#1976d2' : '#eee',
              color: sec === selectedSeccional ? '#fff' : '#000',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '5px',
              cursor: 'pointer',
              width: '150px',
              textAlign: 'left',
            }}
            onClick={() => setSelectedSeccional(sec)}
          >
            {sec}
          </button>
        ))}
      </div>

      {/* Tabela ou lista filtrada */}
      <div style={{ flexGrow: 1 }}>
        <h3>Dados da Carteira{selectedSeccional ? ` - ${selectedSeccional}` : ''}</h3>
        {loading ? (
          <p>Carregando...</p>
        ) : (
          carteiraData.length === 0 ? (
            <p>Selecione um seccional para visualizar os dados.</p>
          ) : (
            <table border="1" cellPadding="6" cellSpacing="0" style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  {/* Colunas principais para exemplo */}
                  <th>PEP</th>
                  <th>SECCIONAL</th>
                  <th>CIDADE</th>
                  <th>EQUIPE</th>
                  <th>VALOR</th>
                </tr>
              </thead>
              <tbody>
                {carteiraData.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item['PEP'] || ''}</td>
                    <td>{item['SECCIONAL'] || item['SECCIONAL\nOBRA'] || ''}</td>
                    <td>{item['CIDADE'] || item['CIDADE\nOBRA'] || ''}</td>
                    <td>{item['EQUIPE'] || ''}</td>
                    <td>{item['VALOR'] || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>
    </div>
  );
}
