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
    <div className="wrap" style={{ display: 'flex', justifyContent: 'center' }}> {/*Centrado del texto principal*/}
      <div style={{ textAlign: 'center', maxWidth: '850px', margin: '0 auto' }}>
        <span className="pill">UBIPARK TU LUGAR SEGURO</span>
        <h1>Encuentra tu lugar y reserva en minutos</h1>
        <h3>Conoce el lugar, sus medidas y fotos. Habla directo con el dueño por WhatsApp. Sin pagos en la plataforma.</h3>
        <div style={{ marginTop: 22 }}>
        </div>
      </div>
    </div>
  </div>

      <section className="blk" style={{ background: '#e5e7eb' }}>
        <div className="wrap">
          <h2 className="title">¿Cómo funciona?</h2>
          <p className="sub">Pasos sin complicaciones.</p>
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
              <p>Efectivo o transferencia, tú decides la plataforma.</p>
            </div>
           {/* <div className="step">
              <b>04</b>
              <h3>Recibe tu folio y QR</h3>
              <p>Amarillo si falta pagar, verde si ya pagaste.</p>
            </div>*/}
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