// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'

// Import das páginas essenciais para este fluxo
import PrazosSAP from './pages/PrazosSAP'
import Obras from './pages/Obras'
import Programacao from './pages/Programacao'
import Login from './pages/Login'
import TestePagina from './pages/TestePagina'
import TesteBotao from './pages/TesteBotao'
import PrazosSAPSimples from './pages/PrazosSAPSimples'
import Home from './pages/Home'

// Componente interno que usa o hook useNavigate
function AppContent() {
  // Removemos o estado logado pois não estamos usando no momento
  // Para desenvolvimento, manteremos acesso direto às rotas sem autenticação
  
  const navigate = useNavigate()

  const handleLogin = () => {
    localStorage.setItem('logado', 'true')
    navigate('/home')
  }

  // Removido redirecionamento forçado para facilitar desenvolvimento
  /*
  useEffect(() => {
    if (!logado) {
      navigate('/login')
    }
  }, [logado, navigate])
  */

  return (
    <Routes>
      <Route path="/login" element={<Login onLogin={handleLogin} />} />
  <Route path="/home" element={<Home />} />
  <Route path="/prazos-sap1" element={<PrazosSAP />} />
  <Route path="/prazos-sap-1" element={<PrazosSAP />} />
  <Route path="/prazos-sap" element={<PrazosSAP />} />
  <Route path="/teste" element={<TestePagina />} />
  <Route path="/programacao" element={<Programacao />} />
      <Route path="/teste-botao" element={<TesteBotao />} />
      <Route path="/prazos-sap-simples" element={<PrazosSAPSimples />} />
  <Route path="/obras" element={<Obras />} />
  <Route path="/" element={<PrazosSAP />} />
  <Route path="*" element={<Navigate to="/prazos-sap" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}
