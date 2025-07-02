import { useNavigate } from 'react-router-dom'
import fundo from '../assets/fundo1.png'
import imagemBotao from '../assets/obras.png'

function Home() {
  const navigate = useNavigate()

  const handleLogout = () => {
    navigate('/login')
  }

  return (
    <div
      className="relative flex h-screen"
      style={{
        backgroundImage: `url(${fundo})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        overflowX: 'hidden',  // sem rolagem horizontal
        overflowY: 'hidden',  // sem rolagem vertical no container principal
        color: 'white',
      }}
    >
      {/* Botão "Sair" fixado no canto superior direito */}
      <div
        className="absolute"
        style={{
          top: '20px',
          right: '40px',
          zIndex: 50,
        }}
      >
        <button
          onClick={handleLogout}
          className="bg-white text-blue-900 font-bold px-4 py-2 rounded hover:bg-gray-100 transition"
        >
          Sair
        </button>
      </div>

      {/* Lado esquerdo */}
      <div
        className="flex flex-col w-2/2 p-12 overflow-y-auto" // ⚠️ rolagem vertical apenas aqui
        style={{ maxHeight: '100vh' }} // limite para ativar scroll quando necessário
      >
        {/* Texto centralizado horizontalmente, um pouco mais abaixo */}
        <div className="mb-12 flex justify-center">
          <h1 className="text-white italic text-6xl font-serif leading-tight">
            Setor:
          </h1>
        </div>

        {/* Conteúdo dividido em duas colunas */}
        <div className="flex flex-1">
          {/* Metade esquerda do lado esquerdo - botão com texto abaixo */}
          <div className="w-1/2 flex flex-col items-center">
            <button
              onClick={() => navigate('/obras')}
              style={{
                borderColor: 'white',
                borderWidth: '5px',
                borderStyle: 'solid',
                borderRadius: '1rem',
                overflow: 'hidden',
                padding: '12px',
                width: '180px',
                height: '180px',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                transition: 'transform 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <img
                src={imagemBotao}
                alt="Botão Obras"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  borderRadius: '0.75rem',
                  display: 'block',
                }}
              />
            </button>

            {/* Texto abaixo do botão */}
            <span
              style={{
                marginTop: '0.75rem',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '1.25rem',
                userSelect: 'none',
                textAlign: 'center',
                width: '180px',
              }}
            >
              OBRAS
            </span>
          </div>

          {/* Metade direita do lado esquerdo - vazio */}
          <div className="w-1/2"></div>
        </div>
      </div>

      {/* Lado direito vazio por enquanto */}
      <div className="w-1/2 p-12"></div>
    </div>
  )
}

export default Home
