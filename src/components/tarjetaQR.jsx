import { useState } from 'react'
import { descargarPDFReserva } from '../lib/pdfReserva.js'

/* Tarjeta de reserva (sin dibujo de QR).
   El color y el texto cambian según el estado real del pago, que vive en Supabase:
   naranja = pago pendiente, azul = comprobante en revisión, verde = pagado, gris = ya usado.
   El folio (#idreserva) es único porque es la llave primaria de la tabla reservas.
   El botón descarga el PDF con los datos guardados en Supabase. */
export default function TarjetaQR({ r, lugar }) {
  const [generando, setGenerando] = useState(false)
  const [errorPDF, setErrorPDF] = useState('')

  const nombre = lugar || r.estacionamientos?.nombreestacionamiento || ''
  const transf = r.metodo_pago === 'transferencia'
  const ok = r.estado_pago === 'verificado' || r.estado_pago === 'cobrado'

  let clase = 'pend', titulo = '', color = '#9a6200', nota = ''

  if (r.qr_usado) {
    clase = 'pend'; color = '#6b7280'
    titulo = '✔ Reserva ya utilizada'
    nota = 'Esta reserva ya se validó y no puede volver a usarse.'
  } else if (r.estado_pago === 'rechazado') {
    clase = 'pend'; color = '#b91c1c'
    titulo = '❌ Comprobante rechazado'
    nota = 'El dueño no pudo verificar tu transferencia. Contáctalo por WhatsApp.'
  } else if (transf && !ok) {
    clase = 'paid'; color = '#1d4ed8'
    titulo = '📄 Transferencia · comprobante enviado'
    nota = 'El dueño revisará tu comprobante. Descarga tu PDF y muéstralo al llegar.'
  } else if (transf && ok) {
    clase = 'paid'; color = '#0b7a3b'
    titulo = '✅ Transferencia verificada · PAGADO'
    nota = 'Descarga tu PDF y muéstralo al dueño al llegar.'
  } else if (ok) {
    clase = 'paid'; color = '#0b7a3b'
    titulo = '✅ Efectivo cobrado · PAGADO'
    nota = 'Descarga tu PDF y muéstralo al dueño al llegar.'
  } else {
    titulo = '⏳ Apartado · pago pendiente en físico'
    nota = `Pagarás $${r.montototal} MXN en efectivo con el dueño. Descarga tu PDF y muéstralo al llegar.`
  }

  const bajarPDF = async () => {
    setGenerando(true)
    setErrorPDF('')
    try {
      await descargarPDFReserva(r.idreserva)
    } catch (e) {
      setErrorPDF('No se pudo generar el PDF: ' + (e?.message || 'intenta de nuevo'))
    } finally {
      setGenerando(false)
    }
  }

  return (
    <div className={'folio ' + clase}>
      <b>{titulo}</b>
      <div style={{ fontSize: '.75rem', color: '#6b7280', marginTop: 6 }}>FOLIO ÚNICO</div>
      <code style={{ fontSize: '1.6rem', fontWeight: 800, color }}>#{r.idreserva}</code>
      <small style={{ display: 'block', marginTop: 6 }}>
        {nombre} · {r.tipo_vehiculo} · {r.tipo_reserva === 'dia' ? `${r.dias} día(s)` : `${r.horas} h`} · ${r.montototal} MXN<br />
        {new Date(r.fechaentrada).toLocaleString('es-MX')} → {new Date(r.fechasalida).toLocaleString('es-MX')}
      </small>
      <p style={{ fontSize: '.8rem', marginTop: 6 }}>{nota}</p>
      <button type="button" onClick={bajarPDF} disabled={generando} style={{ marginTop: 6 }}>
        {generando ? 'Generando PDF…' : '📄 Descargar PDF'}
      </button>
      {errorPDF && <p style={{ fontSize: '.8rem', color: '#b91c1c' }}>{errorPDF}</p>}
    </div>
  )
}
