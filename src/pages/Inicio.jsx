import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DB, avg, dist, stars } from '../lib/db.js'
import { useApp } from '../context/AppContext.jsx'

/* PÁGINA DE INICIO: carrusel, cerca de mí, reseñas */
export default function Inicio() {
  const navigate = useNavigate()
  const { entrar, toast } = useApp()
  const [pos, setPos] = useState(null)
  const track = useRef(null)
  const car = useRef(null)

  useEffect(() => { document.title = 'GoParking | Renta de estacionamientos locales' }, [])

  let lugares = DB.get('lugares', [])
  if (pos) {
    lugares = lugares
      .map((l) => ({ ...l, d: l.lat ? dist(pos[0], pos[1], l.lat, l.lng) : 1e9 }))
      .sort((a, b) => a.d - b.d)
  }
  const resenas = DB.get('resenas', []).slice(-3)

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
      <div className="hero"><div className="wrap">
        <div>
          <span className="pill">ESTACIONAMIENTO LOCAL Y SEGURO</span>
          <h1>Encuentra tu lugar y reserva en minutos</h1>
          <p>Conoce el lugar, sus medidas y fotos. Habla directo con el dueño por WhatsApp y recibe tu folio con QR. Sin pagos en la plataforma.</p>
          <div style={{ marginTop: 22 }}><button className="btn ghost" onClick={cerca}>📍 Ver lugares cerca de mí</button></div>
        </div>
        <div className="roles">
          <div className="role" onClick={() => entrar('cliente')}><div className="ic">🚗</div><div><h3>Soy Cliente</h3><p>Busca, reserva y obtén tu folio con QR.</p></div></div>
          <div className="role" onClick={() => entrar('propietario')}><div className="ic">🏠</div><div><h3>Quiero rentar mi espacio</h3><p>Publica tu cochera y controla tus folios.</p></div></div>
        </div>
      </div></div>

      <section className="blk"><div className="wrap">
        <div className="row"><div><h2 className="title">{pos ? 'Cerca de ti' : 'Lugares destacados'}</h2><p className="sub">Desliza o usa las flechas. Toca una tarjeta para ver toda la información.</p></div>
          <div className="nav-c"><button onClick={() => sc(-1)}>←</button><button onClick={() => sc(1)}>→</button></div></div>
        <div className="car" ref={car}><div className="track" ref={track}>
          {lugares.map((l) => (
            <div className="card" key={l.id} onClick={() => navigate('/lugar/' + l.id)}>
              <div className="ph" style={l.fotos[0] ? { backgroundImage: `url(${l.fotos[0]})` } : undefined}>
                {l.fotos[0] ? '' : l.ico || '🅿️'}
                <span className={'tag ' + (l.lleno ? 'full' : 'ok')}>{l.lleno ? 'Lleno' : 'Disponible'}</span>
              </div>
              <div className="cb">
                <div className="stars">{stars(avg(l.id))}</div>
                <h3>{l.nombre}</h3>
                <small style={{ color: '#58708a' }}>{l.localidad}, {l.municipio}{l.d && l.d < 1e8 ? ' · ' + l.d.toFixed(1) + ' km' : ''}</small>
                <div className="cf"><div className="price">${l.pph}<small>/hora</small></div><div className="arrow">→</div></div>
              </div>
            </div>
          ))}
        </div></div>
      </div></section>

      <section className="blk" style={{ background: '#fff' }}><div className="wrap">
        <h2 className="title">¿Cómo funciona?</h2><p className="sub">Cuatro pasos, sin complicaciones.</p>
        <div className="steps">
          <div className="step"><b>01</b><h3>Elige un lugar</h3><p>Revisa fotos, medidas y ubicación en el mapa.</p></div>
          <div className="step"><b>02</b><h3>Escribe por WhatsApp</h3><p>Acuerda con el dueño disponibilidad y forma de pago.</p></div>
          <div className="step"><b>03</b><h3>Registra tu acuerdo</h3><p>Efectivo o transferencia, tú le dices a la plataforma.</p></div>
          <div className="step"><b>04</b><h3>Recibe tu folio y QR</h3><p>Amarillo si falta pagar, verde si ya pagaste.</p></div>
        </div>
      </div></section>

      <section className="blk"><div className="wrap">
        <h2 className="title">Lo que dicen los usuarios</h2><p className="sub">&nbsp;</p>
        <div className="revs">
          {resenas.map((r, i) => (
            <div className="rev" key={i}><div className="stars">{stars(r.s)}</div><p>"{r.t}"</p><b>— {r.n} ({r.r})</b></div>
          ))}
        </div>
      </div></section>
    </div>
  )
}
