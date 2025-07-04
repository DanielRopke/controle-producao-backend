// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'

// Import das páginas
import Home from './pages/Home'
import Obras from './pages/Obras'
import PrazosSAP from './pages/PrazosSAP'
import Programacao from './pages/Programacao'
import Faturamento from './pages/Faturamento'
import ParetoObras from './pages/ParetoObras'
import ParetoManutencao from './pages/ParetoManutencao'
import GAQLP from './pages/GAQLP'
import KPIManutencao from './pages/KPIManutencao'
import CarteiraObras from './pages/CarteiraObras'
import PrioridadeObras from './pages/PrioridadeObras'
import Mapa from './pages/Mapa'
import DefeitosProgeo from './pages/DefeitosProgeo'
import Login from './pages/Login'

function App() {
  const [logado, setLogado] = useState<boolean>(() => {
    return localStorage.getItem('logado') === 'true'
  })

  const navigate = useNavigate()

  const handleLogin = () => {
    setLogado(true)
    localStorage.setItem('logado', 'true')
    navigate('/home')
  }

  useEffect(() => {
    if (!logado) {
      navigate('/login')
    }
  }, [logado, navigate])

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login onLogin={handleLogin} />} />

      {logado ? (
        <>
          <Route path="/home" element={<Home />} />
          <Route path="/obras" element={<Obras />} />
          <Route path="/prazos-sap" element={<PrazosSAP />} />
          <Route path="/programacao" element={<Programacao />} />
          <Route path="/faturamento" element={<Faturamento />} />
          <Route path="/pareto-obras" element={<ParetoObras />} />
          <Route path="/pareto-manutencao" element={<ParetoManutencao />} />
          <Route path="/ga-qlp" element={<GAQLP />} />
          <Route path="/kpi-manutencao" element={<KPIManutencao />} />
          <Route path="/carteira-obras" element={<CarteiraObras />} />
          <Route path="/prioridade-obras" element={<PrioridadeObras />} />
          <Route path="/mapa" element={<Mapa />} />
          <Route path="/defeitos-progeo" element={<DefeitosProgeo />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </>
      ) : (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  )
}

export default function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  )
}
