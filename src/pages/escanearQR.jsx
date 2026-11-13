// DESTINO: src/components/EscanerQR.jsx
// Requiere:  npm install html5-qrcode
// La cámara solo funciona en HTTPS (Railway ya lo da) o en localhost.
import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

/* Props:
   - onCodigo(texto): se llama UNA vez al leer un QR. El padre debe poner activo=false para apagar la cámara.
   - activo: true = cámara encendida. */
export default function EscanerQR({ onCodigo, activo = true }) {
  const idCamara = useRef(`qr-camara-${Math.random().toString(36).slice(2, 8)}`).current
  const idArchivo = useRef(`qr-archivo-${Math.random().toString(36).slice(2, 8)}`).current
  const alCodigo = useRef(onCodigo)
  const [error, setError] = useState('')

  useEffect(() => {
    alCodigo.current = onCodigo
  }, [onCodigo])

  useEffect(() => {
    if (!activo) return undefined
    setError('')

    let cancelado = false
    let lector = null
    let iniciando = null

    // El pequeño retraso evita arrancar dos veces la cámara con el doble montaje de React StrictMode.
    const temporizador = setTimeout(() => {
      lector = new Html5Qrcode(idCamara)
      iniciando = lector
        .start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (texto) => {
            if (cancelado) return
            cancelado = true
            alCodigo.current?.(texto)
          },
          () => {}, // errores de "no se ve QR en este cuadro": se ignoran
        )
        .catch(() => {
          if (!cancelado) {
            setError('No se pudo abrir la cámara. Revisa el permiso del navegador o sube una foto del QR.')
          }
        })
    }, 150)

    return () => {
      cancelado = true
      clearTimeout(temporizador)
      if (iniciando) {
        iniciando.then(() => lector.stop()).then(() => lector.clear()).catch(() => {})
      }
    }
  }, [activo, idCamara])

  async function leerArchivo(e) {
    const archivo = e.target.files?.[0]
    e.target.value = ''
    if (!archivo) return
    setError('')
    const lector = new Html5Qrcode(idArchivo)
    try {
      const texto = await lector.scanFile(archivo, false)
      alCodigo.current?.(texto)
    } catch {
      setError('No encontré un QR en esa imagen. Intenta con una foto más nítida.')
    } finally {
      try { lector.clear() } catch { /* nada */ }
    }
  }

  return (
    <div>
      {activo && <div id={idCamara} style={{ width: '100%', maxWidth: 360, margin: '0 auto' }} />}
      <div id={idArchivo} style={{ display: 'none' }} />

      {error && <p style={{ color: '#b91c1c', fontSize: 14, textAlign: 'center' }}>{error}</p>}

      <div style={{ textAlign: 'center', marginTop: 10 }}>
        <label
          style={{
            display: 'inline-block', padding: '8px 14px', border: '1px solid #d1d5db',
            borderRadius: 8, cursor: 'pointer', fontSize: 14, background: '#fff',
          }}
        >
          Subir foto del QR
          <input type="file" accept="image/*" hidden onChange={leerArchivo} />
        </label>
      </div>
    </div>
  )
}
