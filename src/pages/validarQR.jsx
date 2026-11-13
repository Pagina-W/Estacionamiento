// DESTINO: src/components/ValidarQR.jsx
// Uso en tu página validar.jsx:   <ValidarQR idPropietario={idDelDueñoLogueado} />
// idPropietario es opcional; si lo pasas, solo valida reservas de los estacionamientos de ese dueño.
import { useState } from 'react'
import EscanerQR from './escanerQR'
import { validarQR, confirmarIngreso } from '../services/qrService'

const fmt = (f) =>
  f ? new Date(f).toLocaleString('es-MX', { timeZone: 'America/Mexico_City', dateStyle: 'medium', timeStyle: 'short' }) : '—'

const boton = (color) => ({
  border: 'none', background: color, color: '#fff', padding: '10px 16px', borderRadius: 8,
  fontWeight: 600, cursor: 'pointer', fontSize: 15,
})

export default function ValidarQR({ idPropietario = null }) {
  const [escaneando, setEscaneando] = useState(true)
  const [cargando, setCargando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [confirmado, setConfirmado] = useState(false)
  const [errorConfirmar, setErrorConfirmar] = useState('')
  const [manual, setManual] = useState('')

  async function procesar(texto) {
    setEscaneando(false)
    setCargando(true)
    setConfirmado(false)
    setErrorConfirmar('')
    try {
      setResultado(await validarQR(texto, idPropietario))
    } catch (e) {
      setResultado({ ok: false, motivo: e.message, advertencias: [], reserva: null })
    } finally {
      setCargando(false)
    }
  }

  async function confirmar() {
    const r = await confirmarIngreso(resultado.reserva.idreserva)
    if (r.ok) setConfirmado(true)
    else setErrorConfirmar(r.motivo)
  }

  function reiniciar() {
    setResultado(null)
    setConfirmado(false)
    setErrorConfirmar('')
    setManual('')
    setEscaneando(true)
  }

  const r = resultado?.reserva

  return (
    <div style={{ maxWidth: 420, margin: '0 auto', padding: 16 }}>
      {!resultado && !cargando && (
        <>
          <EscanerQR activo={escaneando} onCodigo={procesar} />
          <form
            onSubmit={(e) => { e.preventDefault(); if (manual.trim()) procesar(manual) }}
            style={{ display: 'flex', gap: 8, marginTop: 16 }}
          >
            <input
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              placeholder="O escribe el código de la reserva"
              style={{ flex: 1, padding: '9px 12px', borderRadius: 8, border: '1px solid #d1d5db' }}
            />
            <button type="submit" style={boton('#1d4ed8')}>Buscar</button>
          </form>
        </>
      )}

      {cargando && <p style={{ textAlign: 'center' }}>Validando…</p>}

      {resultado && (
        <div
          style={{
            border: `2px solid ${resultado.ok ? '#16a34a' : '#dc2626'}`, borderRadius: 12,
            padding: 16, background: resultado.ok ? '#f0fdf4' : '#fef2f2',
          }}
        >
          <h3 style={{ margin: '0 0 8px', color: resultado.ok ? '#15803d' : '#b91c1c' }}>
            {confirmado ? '✔ Ingreso registrado' : resultado.ok ? '✔ Reserva válida' : '✖ No válida'}
          </h3>
          {!resultado.ok && <p style={{ margin: '0 0 8px' }}>{resultado.motivo}</p>}

          {r && (
            <div style={{ fontSize: 14, lineHeight: 1.6 }}>
              <div><strong>Estacionamiento:</strong> {r.estacionamientos?.nombreestacionamiento}</div>
              <div><strong>Cliente:</strong> {r.usuarios?.nombre} {r.usuarios?.apellidos}</div>
              <div>
                <strong>Vehículo:</strong> {r.vehiculos?.placa}
                {r.vehiculos?.descripcion ? ` (${r.vehiculos.descripcion})` : ''}
              </div>
              <div><strong>Entrada:</strong> {fmt(r.fechaentrada)}</div>
              <div><strong>Salida:</strong> {fmt(r.fechasalida)}</div>
              <div><strong>Total:</strong> ${Number(r.montototal).toFixed(2)} ({r.metodo_pago ?? '—'})</div>
              <div><strong>Estado:</strong> {r.estadoreserva} · pago {r.estado_pago ?? '—'}</div>
            </div>
          )}

          {resultado.advertencias?.map((a) => (
            <p key={a} style={{ color: '#b45309', fontSize: 14, margin: '8px 0 0' }}>⚠ {a}</p>
          ))}
          {errorConfirmar && <p style={{ color: '#b91c1c', fontSize: 14 }}>{errorConfirmar}</p>}

          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            {resultado.ok && !confirmado && (
              <button style={boton('#16a34a')} onClick={confirmar}>Confirmar ingreso</button>
            )}
            <button style={boton('#4b5563')} onClick={reiniciar}>Escanear otro</button>
          </div>
        </div>
      )}
    </div>
  )
}
