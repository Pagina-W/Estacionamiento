// DESTINO: src/components/ChatIA.jsx
// Uso: <ChatIA /> una sola vez (por ejemplo en App.jsx o en Cliente.jsx).
import { useEffect, useRef, useState } from 'react'
import { preguntarChat } from '../services/iaService'

const EJEMPLOS = [
  '¿Qué estacionamientos hay disponibles?',
  'Busco uno económico para mi moto',
  '¿Cuál tiene mejores reseñas?',
]

const estilos = {
  boton: {
    position: 'fixed', right: 20, bottom: 20, width: 56, height: 56, borderRadius: '50%',
    border: 'none', background: '#1d4ed8', color: '#fff', fontSize: 26, cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(0,0,0,.25)', zIndex: 1000,
  },
  ventana: {
    position: 'fixed', right: 20, bottom: 88, width: 'min(380px, calc(100vw - 24px))',
    height: 'min(540px, calc(100vh - 110px))', background: '#fff', borderRadius: 14,
    boxShadow: '0 8px 30px rgba(0,0,0,.28)', display: 'flex', flexDirection: 'column',
    overflow: 'hidden', zIndex: 1000, fontFamily: 'inherit',
  },
  cabecera: {
    background: '#1d4ed8', color: '#fff', padding: '12px 14px', display: 'flex',
    justifyContent: 'space-between', alignItems: 'center', fontWeight: 600,
  },
  cuerpo: { flex: 1, overflowY: 'auto', padding: 12, background: '#f3f4f6' },
  burbujaUsuario: {
    background: '#1d4ed8', color: '#fff', padding: '8px 12px', borderRadius: '14px 14px 2px 14px',
    maxWidth: '85%', marginLeft: 'auto', marginBottom: 8, fontSize: 14, wordBreak: 'break-word',
  },
  burbujaIA: {
    background: '#fff', color: '#111827', padding: '8px 12px', borderRadius: '14px 14px 14px 2px',
    maxWidth: '90%', marginBottom: 8, fontSize: 14, border: '1px solid #e5e7eb', wordBreak: 'break-word',
  },
  chip: {
    border: '1px solid #bfdbfe', background: '#eff6ff', color: '#1e40af', borderRadius: 16,
    padding: '6px 10px', fontSize: 13, cursor: 'pointer', marginBottom: 6, textAlign: 'left',
  },
  formulario: { display: 'flex', gap: 8, padding: 10, borderTop: '1px solid #e5e7eb', background: '#fff' },
  entrada: { flex: 1, padding: '9px 12px', borderRadius: 20, border: '1px solid #d1d5db', fontSize: 14, outline: 'none' },
  enviar: {
    border: 'none', background: '#1d4ed8', color: '#fff', borderRadius: 20, padding: '0 16px',
    fontWeight: 600, cursor: 'pointer',
  },
}

/* Convierte saltos de línea y **negritas** del modelo en elementos React (sin dangerouslySetInnerHTML). */
function formatear(texto) {
  return String(texto).split('\n').map((linea, i) => (
    <p key={i} style={{ margin: '0 0 4px' }}>
      {linea.split(/(\*\*[^*]+\*\*)/g).map((trozo, j) =>
        trozo.startsWith('**') && trozo.endsWith('**') && trozo.length > 4
          ? <strong key={j}>{trozo.slice(2, -2)}</strong>
          : trozo,
      )}
    </p>
  ))
}

export default function ChatIA() {
  const [abierto, setAbierto] = useState(false)
  const [historial, setHistorial] = useState([])
  const [texto, setTexto] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const finRef = useRef(null)

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [historial, cargando, abierto])

  async function enviar(mensaje) {
    const limpio = (mensaje ?? texto).trim()
    if (!limpio || cargando) return

    const nuevo = [...historial, { role: 'user', parts: [{ text: limpio }] }]
    setHistorial(nuevo)
    setTexto('')
    setError('')
    setCargando(true)
    try {
      const respuesta = await preguntarChat(nuevo)
      setHistorial([...nuevo, { role: 'model', parts: [{ text: respuesta }] }])
    } catch (e) {
      console.error(e)
      setError('No pude responder en este momento. Intenta de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <>
      <button style={estilos.boton} onClick={() => setAbierto((a) => !a)} aria-label="Abrir chat de ayuda">
        {abierto ? '×' : '💬'}
      </button>

      {abierto && (
        <div style={estilos.ventana}>
          <div style={estilos.cabecera}>
            <span>Asistente UbiPark</span>
            <button
              onClick={() => { setHistorial([]); setError('') }}
              style={{ background: 'transparent', border: 'none', color: '#dbeafe', cursor: 'pointer', fontSize: 12 }}
            >
              Nueva conversación
            </button>
          </div>

          <div style={estilos.cuerpo}>
            {historial.length === 0 && (
              <>
                <div style={estilos.burbujaIA}>
                  ¡Hola! Pregúntame lo que quieras sobre estacionamientos: precios, horarios, zonas, reseñas o
                  disponibilidad.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  {EJEMPLOS.map((e) => (
                    <button key={e} style={estilos.chip} onClick={() => enviar(e)}>{e}</button>
                  ))}
                </div>
              </>
            )}

            {historial.map((m, i) => (
              <div key={i} style={m.role === 'user' ? estilos.burbujaUsuario : estilos.burbujaIA}>
                {m.role === 'user' ? m.parts[0].text : formatear(m.parts[0].text)}
              </div>
            ))}

            {cargando && <div style={{ ...estilos.burbujaIA, color: '#6b7280' }}>Escribiendo…</div>}
            {error && <div style={{ color: '#b91c1c', fontSize: 13, marginBottom: 8 }}>{error}</div>}
            <div ref={finRef} />
          </div>

          <form
            style={estilos.formulario}
            onSubmit={(e) => { e.preventDefault(); enviar() }}
          >
            <input
              style={estilos.entrada}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Escribe tu pregunta…"
              maxLength={500}
            />
            <button type="submit" style={estilos.enviar} disabled={cargando || !texto.trim()}>
              Enviar
            </button>
          </form>
        </div>
      )}
    </>
  )
}
