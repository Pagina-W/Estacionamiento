// DESTINO: src/components/Resenas.jsx
// Uso (en la página del lugar, Lugar.jsx):   <Resenas idEstacionamiento={id} />
// Reemplaza el bloque actual de "Reseñas / Aún sin reseñas".
import { useCallback, useEffect, useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { obtenerIdUsuario } from '../lib/idusuario.js'
import { crearResena, estadoResena, resenasPublicas, resumenResenas } from '../services/resenaService.js'

const MENSAJES = {
  ok: '¡Gracias! Tu reseña ya está publicada.',
  pendiente: 'Gracias. Tu reseña se publicará cuando un administrador la revise.',
  oculta: 'Un administrador retiró tu reseña y no se puede volver a publicar.',
  sin_reserva_usada: 'Solo puedes calificar un lugar después de usar tu reserva.',
  calificacion_invalida: 'Elige de 1 a 5 estrellas.',
  comentario_largo: 'El comentario puede tener hasta 500 caracteres.',
}

const fecha = (f) => {
  if (!f) return ''
  const d = new Date(/Z|[+-]\d\d:?\d\d$/.test(f) ? f : f + 'Z')
  return d.toLocaleDateString('es-MX', { dateStyle: 'medium' })
}

function Estrellas({ valor = 0, tam = '1rem' }) {
  const lleno = Math.round(valor)
  return (
    <span style={{ color: '#f59e0b', fontSize: tam, letterSpacing: 1 }} aria-label={`${valor} de 5 estrellas`}>
      {'★'.repeat(lleno)}{'☆'.repeat(5 - lleno)}
    </span>
  )
}

const tarjeta = {
  background: '#fff', border: '1px solid var(--line, #e5e7eb)', borderRadius: 18, padding: 22, marginTop: 24,
}

/* Props:
   - idEstacionamiento: id del lugar
   - onCambio (opcional): se llama después de guardar una reseña (para refrescar el promedio de arriba)
   - actualizar (opcional): cualquier valor que, al cambiar, vuelve a consultar (ej. reserva?.qr_usado) */
export default function Resenas({ idEstacionamiento, onCambio, actualizar }) {
  const { ses, user } = useApp()
  const idUsuario = obtenerIdUsuario(user, ses)
  const esCliente = ses?.role === 'cliente'

  const [lista, setLista] = useState([])
  const [resumen, setResumen] = useState(null) // { promedio, total }
  const [estado, setEstado] = useState(null) // { puede, resena }
  const [cargando, setCargando] = useState(true)

  const [cal, setCal] = useState(0)
  const [hover, setHover] = useState(0)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [msg, setMsg] = useState('')

  const cargar = useCallback(async () => {
    try {
      const [pub, res, est] = await Promise.all([
        resenasPublicas(idEstacionamiento),
        resumenResenas(idEstacionamiento),
        esCliente && idUsuario ? estadoResena(idUsuario, idEstacionamiento) : Promise.resolve(null),
      ])
      setLista(pub || [])
      setResumen(res?.[0] ?? null)
      setEstado(est)
      if (est?.resena) {
        setCal(est.resena.calificacion)
        setTexto(est.resena.comentario || '')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setCargando(false)
    }
  }, [idEstacionamiento, idUsuario, esCliente])

  useEffect(() => { cargar() }, [cargar, actualizar])

  const enviar = async (e) => {
    e.preventDefault()
    if (!cal || enviando) return
    setEnviando(true); setMsg('')
    try {
      const r = await crearResena(idUsuario, idEstacionamiento, cal, texto)
      setMsg(MENSAJES[r] || r)
      await cargar()
      onCambio?.()
    } catch (err) {
      setMsg('No se pudo guardar tu reseña: ' + err.message)
    } finally {
      setEnviando(false)
    }
  }

  const mia = estado?.resena
  const puedeCalificar = estado?.puede && mia?.estado !== 'oculta'

  return (
    <section style={tarjeta}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, fontSize: '1.3rem' }}>Reseñas</h3>
        {resumen?.total > 0 && (
          <span>
            <Estrellas valor={Number(resumen.promedio)} />{' '}
            <b>{Number(resumen.promedio).toFixed(1)}</b>{' '}
            <span style={{ color: '#58708a' }}>({resumen.total} {resumen.total === 1 ? 'reseña' : 'reseñas'})</span>
          </span>
        )}
      </div>

      {cargando && <p style={{ color: '#58708a' }}>Cargando…</p>}
      {!cargando && lista.length === 0 && <p style={{ color: '#58708a' }}>Aún sin reseñas.</p>}

      {lista.map((r) => (
        <div key={r.idresena} style={{ borderTop: '1px solid var(--line, #e5e7eb)', padding: '12px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <span><Estrellas valor={r.calificacion} /> <b>{r.autor}</b></span>
            <small style={{ color: '#58708a' }}>{fecha(r.fecha)}</small>
          </div>
          {r.comentario && <p style={{ margin: '6px 0 0', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{r.comentario}</p>}
        </div>
      ))}

      <div style={{ borderTop: '1px solid var(--line, #e5e7eb)', marginTop: 8, paddingTop: 16 }}>
        {!ses && <p style={{ color: '#58708a', margin: 0 }}>Inicia sesión como cliente para calificar este lugar.</p>}

        {esCliente && estado && !estado.puede && (
          <p style={{ color: '#58708a', margin: 0 }}>Podrás calificar este lugar después de usar tu reserva.</p>
        )}

        {mia?.estado === 'pendiente' && (
          <p style={{ color: '#9a6200', margin: '0 0 10px' }}>⏳ Tu reseña está en revisión. Por ahora solo tú la ves.</p>
        )}
        {mia?.estado === 'oculta' && (
          <p style={{ color: '#b42318', margin: 0 }}>Un administrador retiró tu reseña por no cumplir las reglas de la comunidad.</p>
        )}

        {puedeCalificar && (
          <form onSubmit={enviar}>
            <b>{mia ? 'Tu reseña' : 'Califica este lugar'}</b>
            <div style={{ margin: '6px 0' }} onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCal(n)}
                  onMouseEnter={() => setHover(n)}
                  aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer', fontSize: '2rem', padding: '0 2px',
                    color: n <= (hover || cal) ? '#f59e0b' : '#cbd5e1', lineHeight: 1,
                  }}
                >★</button>
              ))}
            </div>
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Cuéntanos tu experiencia (opcional). Sé respetuoso: no se permiten groserías ni agresiones."
              style={{
                width: '100%', boxSizing: 'border-box', padding: 10, borderRadius: 10,
                border: '1px solid var(--line, #d1d5db)', font: 'inherit', resize: 'vertical',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, gap: 8, flexWrap: 'wrap' }}>
              <small style={{ color: '#58708a' }}>{texto.length}/500</small>
              <button className="btn" type="submit" disabled={!cal || enviando}>
                {enviando ? 'Guardando…' : mia ? 'Actualizar reseña' : 'Publicar reseña'}
              </button>
            </div>
          </form>
        )}

        {msg && <p style={{ margin: '10px 0 0', fontWeight: 600 }}>{msg}</p>}
      </div>
    </section>
  )
}
