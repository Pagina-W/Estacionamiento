import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DB, stars } from '../lib/db.js'
import { useApp } from '../context/AppContext.jsx'

export default function Inicio() {
  const navigate = useNavigate()
  const { entrar, ses } = useApp()

  const [nuevasResenas, setNuevasResenas] = useState([])
  const [calificacion, setCalificacion] = useState(0)
  const [comentario, setComentario] = useState('')

  useEffect(() => {
    document.title = 'GoParking | Renta de estacionamientos locales'
  }, [])

  const resenas = DB.get('resenas', []).slice(-3)

  const publicarResena = () => {
    if (!ses) {
      entrar('cliente')
      return
    }

    if (calificacion === 0) {
      alert('Selecciona una calificación de estrellas.')
      return
    }

    if (comentario.trim() === '') {
      alert('Escribe tu comentario antes de publicar.')
      return
    }

    const nueva = {
      s: calificacion,
      t: comentario.trim(),
      n: ses.nombre,
      r: ses.role
    }

    setNuevasResenas((anteriores) => [...anteriores, nueva])
    setCalificacion(0)
    setComentario('')
  }

  return (
    <div className="view on">

      {/* PORTADA */}
      <div className="hero">
        <div className="wrap" style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', maxWidth: '850px', margin: '0 auto' }}>
            <span className="pill">UBIPARK TU LUGAR SEGURO</span>
            <h1>Encuentra tu lugar y reserva en minutos</h1>
            <h3>
              Conoce el lugar, sus medidas y fotos. Habla directo con el dueño por WhatsApp. Sin pagos en la plataforma.
            </h3>
            <div style={{ marginTop: 22 }}>
            </div>
          </div>
        </div>
      </div>

      {/* COMO FUNCIONA */}
      <section className="blk" style={{ background: '#e5e7eb' }}>
        <div className="wrap">
          <center>
            <h2 className="title">¿Cómo funciona?</h2>
          </center>

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
          </div>
        </div>
      </section>

      {/* RESEÑAS */}
      <section className="blk">
        <div className="wrap">

      <h2 className="title">
        Lo que dicen los usuarios de{' '}
      <span style={{ color: 'black' }}>Ubi</span>
      <span style={{ color: '#0090E7' }}>Park</span>.
      </h2>
      
          
          {/* RESEÑAS PUBLICADAS */}
          <div className="revs">
            {[...resenas, ...nuevasResenas].map((r, i) => (
              <div className="rev" key={i}>
                <div className="stars">{stars(r.s)}</div>
                <p>"{r.t}"</p>
                <b>— {r.n} ({r.r})</b>
              </div>
            ))}
          </div>

          {/* FORMULARIO PARA COMENTAR */}
          <div className="form-resena">

            {ses ? (
              <>
                <h3>¡Déjanos tu opinión!</h3>
                <p>Hola, {ses.nombre}. ¿Cómo fue tu experiencia?</p>

                <label>Califica nuestro servicio</label>

                <div className="calificar">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      className={n <= calificacion ? 'estrella activa' : 'estrella'}
                      onClick={() => setCalificacion(n)}
                    >
                      ★
                    </button>
                  ))}
                </div>

                <label htmlFor="comentario">Tu comentario</label>

                <textarea
                  id="comentario"
                  rows="4"
                  placeholder="Escribe aquí tu experiencia..."
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                />

                <button
                  className="btn"
                  type="button"
                  onClick={publicarResena}
                >
                  Publicar comentario
                </button>
              </>
            ) : (
              <>
                <h3>¿Ya utilizaste UbiPark?</h3>
                <p>Inicia sesión para calificar y compartir tu experiencia.</p>

                <button
                  className="btn"
                  type="button"
                  onClick={() => entrar('cliente')}
                >
                  Iniciar sesión
                </button>
              </>
            )}

          </div>
        </div>
      </section>

    </div>
  )
}