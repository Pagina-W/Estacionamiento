import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'

export default function Header() {
  const navigate = useNavigate()
  const { ses, salir, entrar } = useApp()
  return (
    <header>
      <div className="wrap">
        <div className="logo" onClick={() => navigate('/')}>📍 Go<span>Parking</span></div>
        <nav>
          {ses ? (
            <>
              <span className="hide-m" style={{ fontSize: '.85rem' }}>{ses.nombre} · {ses.role}</span>
              {ses.role === 'propietario' && (
                <button className="btn sm ghost" onClick={() => navigate('/propietario')}>Mi panel</button>
              )}
              <button className="btn sm dark" onClick={salir}>Salir</button>
            </>
          ) : (
            <>
              <button className="btn sm ghost" onClick={() => entrar('cliente')}>Cliente</button>
              <button className="btn sm" onClick={() => entrar('propietario')}>Rentar mi espacio</button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
