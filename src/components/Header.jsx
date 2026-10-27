import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'

export default function Header() {
  const navigate = useNavigate()
  const { ses, salir, entrar } = useApp()
  return (
    <header>
      <div className="wrap">
{/*Centrado del logo y nombre*/}
<div className="logo" onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
  <img src="src/components/20ub.jpg" width="50" height="50" alt="UbiPark" />
  <span style={{ transform: 'translateY(-2px)', fontWeight: 'bolder', fontSize: '25px' }}>
    <span style={{ color: 'black' }}>Ubi</span><span style={{ color: '#0090E7' }}>Park 
         </span> <img src="src/components/123.png" width="17" height="17"/>
  </span>
</div>
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
              <button className="btn sm ghost" onClick={() => entrar('cliente')}>Soy cliente</button>
              <button className="btn sm" onClick={() => entrar('propietario')}>Rentar mi espacio</button>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
