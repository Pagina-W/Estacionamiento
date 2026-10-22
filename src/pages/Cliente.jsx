import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DB, avg, dist, stars } from '../lib/db.js'
import { useApp } from '../context/AppContext.jsx'

export default function Cliente() {
  const navigate = useNavigate()
  const { user, toast } = useApp() 
  const [pos, setPos] = useState(null)
  const track = useRef(null)
  const car = useRef(null)

  useEffect(() => { 
    document.title = 'GoParking | Panel de Cliente' 
  }, [])

  let lugares = DB.get('lugares', [])
  if (pos) {
    lugares = lugares
      .map((l) => ({ ...l, d: l.lat ? dist(pos[0], pos[1], l.lat, l.lng) : 1e9 }))
      .sort((a, b) => a.d - b.d)
  }

  const cerca = () => {
    if (!navigator.geolocation) return toast('Tu navegador no permite ubicación')
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPos([p.coords.latitude, p.coords.longitude])
        setTimeout(() => car.current?.scrollIntoView({ behavior: 'smooth' }), 0)
      },
      () => toast('No pudimos obtener tu ubicación')
    )
  }

  const sc = (d) => track.current?.scrollBy({ left: d * 320, behavior: 'smooth' })

  return (
    <div className="view on">
      <div className="hero" style={{ padding: '24px 0' }}>
        <div className="wrap">
          <h2>¡Hola, {user?.nombre || 'Cliente'}!</h2>
          <p>Explora las cocheras disponibles y reserva tu espacio.</p>
          <button className="btn ghost" style={{ marginTop: 12 }} onClick={cerca}>
            Ver lugares cerca de mí
          </button>
        </div>
      </div>

      {/* CARRUSEL DE LUGARES DESTACADOS */}
      <section className="blk">
        <div className="wrap">
          <div className="row">
            <div>
              <h2 className="title">{pos ? 'Cerca de ti' : 'Lugares destacados'}</h2>
              <p className="sub">Desliza o usa las flechas. Toca una tarjeta para ver toda la información.</p>
            </div>
            <div className="nav-c">
              <button onClick={() => sc(-1)}>←</button>
              <button onClick={() => sc(1)}>→</button>
            </div>
          </div>
          <div className="car" ref={car}>
            <div className="track" ref={track}>
              {lugares.map((l) => (
                <div className="card" key={l.id} onClick={() => navigate('/lugar/' + l.id)}>
                  <div className="ph" style={l.fotos[0] ? { backgroundImage: `url(${l.fotos[0]})` } : undefined}>
                    {l.fotos[0] ? '' : l.ico || '🅿️'}
                    <span className={'tag ' + (l.lleno ? 'full' : 'ok')}>
                      {l.lleno ? 'Lleno' : 'Disponible'}
                    </span>
                  </div>
                  <div className="cb">
                    <div className="stars">{stars(avg(l.id))}</div>
                    <h3>{l.nombre}</h3>
                    <small style={{ color: '#58708a' }}>
                      {l.localidad}, {l.municipio}
                      {l.d && l.d < 1e8 ? ' · ' + l.d.toFixed(1) + ' km' : ''}
                    </small>
                    <div className="cf">
                      <div className="price">${l.pph}<small>/hora</small></div>
                      <div className="arrow">→</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}