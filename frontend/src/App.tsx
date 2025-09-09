// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Toaster } from 'sonner'

// Import das páginas essenciais para este fluxo
import PrazosSAP from './pages/PrazosSAP'
import Obras from './pages/Obras'
import Programacao from './pages/Programacao'
import Faturamento from './pages/Faturamento'
import Login from './pages/Login'
import Cadastro from './pages/Cadastro'
import RecuperacaoSenha from './pages/RecuperacaoSenha'
import TestePagina from './pages/TestePagina'
import TesteBotao from './pages/TesteBotao'
import PrazosSAPSimples from './pages/PrazosSAPSimples'
import Home from './pages/Home'

// Componente interno que usa o hook useNavigate
function AppContent() {
  const isAuth = Boolean(localStorage.getItem('jwt_access'))

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
  <Route path="/login" element={<Login />} />
  <Route path="/cadastro" element={<Cadastro />} />
  <Route path="/recuperacao-senha" element={<RecuperacaoSenha />} />

      {/* RequireAuth protege as rotas abaixo e redireciona ao /login quando não autenticado */}
      <Route
        element={(
          function RequireAuth() {
            const hasToken = Boolean(localStorage.getItem('jwt_access'))
            return hasToken ? <Outlet /> : <Navigate to="/login" replace />
          }
        )()}
      >
        <Route path="/home" element={<Home />} />
        <Route path="/prazos-sap1" element={<PrazosSAP />} />
        <Route path="/prazos-sap-1" element={<PrazosSAP />} />
        <Route path="/prazos-sap" element={<PrazosSAP />} />
        <Route path="/teste" element={<TestePagina />} />
        <Route path="/programacao" element={<Programacao />} />
  <Route path="/faturamento" element={<Faturamento />} />
        <Route path="/teste-botao" element={<TesteBotao />} />
        <Route path="/prazos-sap-simples" element={<PrazosSAPSimples />} />
        <Route path="/obras" element={<Obras />} />
        {/* se o usuário acessar a raiz estando autenticado, mandamos para /home */}
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Route>

      {/* raiz pública aponta para login */}
  <Route path="/" element={<Navigate to={isAuth ? '/home' : '/login'} replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <Router>
  {/* Toaster global para exibir mensagens (sonner) */}
  <Toaster richColors position="bottom-right" />
      <AppContent />
    </Router>
  )
}
