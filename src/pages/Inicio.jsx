import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DB, stars } from '../lib/db.js'
import { useApp } from '../context/AppContext.jsx'

export default function Inicio() {
  const navigate = useNavigate()
  const { entrar } = useApp()

  useEffect(() => { 
    document.title = 'GoParking | Renta de estacionamientos locales' 
  }, [])

  const resenas = DB.get('resenas', []).slice(-3)

  return (
    <div className="view on">
      <div className="hero">
        <div className="wrap">
          <div>
            <span className="pill">ESTACIONAMIENTO LOCAL Y SEGURO</span>
            <h1>Encuentra tu lugar y reserva en minutos</h1>
            <p>
              Conoce el lugar, sus medidas y fotos. Habla directo con el dueño por WhatsApp y recibe tu folio con QR. Sin pagos en la plataforma.
            </p>
            <div style={{ marginTop: 22 }}>
              <button className="btn ghost" onClick={() => entrar('cliente')}>
                Ir a buscar lugares
              </button>
            </div>
          </div>

          <div className="roles">
            <div className="role" onClick={() => entrar('cliente')}>
              <div className="ic">🚗</div>
              <div>
                <h3>Soy Cliente</h3>
                <p>Busca, reserva y obtén tu folio con QR.</p>
              </div>
            </div>
            <div className="role" onClick={() => entrar('propietario')}>
              <div className="ic">🏠</div>
              <div>
                <h3>Quiero rentar mi espacio</h3>
                <p>Publica tu cochera y controla tus folios.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="blk" style={{ background: '#fff' }}>
        <div className="wrap">
          <h2 className="title">¿Cómo funciona?</h2>
          <p className="sub">Cuatro pasos, sin complicaciones.</p>
          <div className="steps">
            <div className="step">
              <b>01</b>
              <h3>Elige un lugar</h3>
              <p>Revisa fotos, medidas y ubicación en el mapa.</p>
            </div>
            <div className="step">
              <b>02</b>
              <h3>Escribe por WhatsApp</h3>
              <p>Acuerda con el dueño disponibilidad y forma de pago.</p>
            </div>
            <div className="step">
              <b>03</b>
              <h3>Registra tu acuerdo</h3>
              <p>Efectivo o transferencia, tú le dices a la plataforma.</p>
            </div>
            <div className="step">
              <b>04</b>
              <h3>Recibe tu folio y QR</h3>
              <p>Amarillo si falta pagar, verde si ya pagaste.</p>
            </div>
          </div>
        </div>
      </section>

      {/* RESEÑAS */}
      <section className="blk">
        <div className="wrap">
          <h2 className="title">Lo que dicen los usuarios</h2>
          <p className="sub">&nbsp;</p>
          <div className="revs">
            {resenas.map((r, i) => (
              <div className="rev" key={i}>
                <div className="stars">{stars(r.s)}</div>
                <p>"{r.t}"</p>
                <b>— {r.n} ({r.r})</b>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}