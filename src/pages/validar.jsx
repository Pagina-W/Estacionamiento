import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { obtenerIdUsuario } from '../lib/idusuario.js'
import { cambiarEstadoPago, consultarQR, obtenerPlacaReserva, usarQR } from '../services/reservaService.js'
import { analizarComprobante, analizarPlaca } from '../services/iaService.js'

/* Ruta: /validar/:codigo — el dueño llega aquí al escanear el QR del cliente */
export default function Validar() {
  const { codigo } = useParams()
  const { ses, entrar, toast, user } = useApp()
  const idOwner = obtenerIdUsuario(user, ses)
  const ok = ses && ses.role === 'propietario'
  const [d, setD] = useState(null)
  const [msg, setMsg] = useState('')
  const [trabajando, setTrabajando] = useState(false)

  /* IA: placa registrada por el cliente y resultados de las revisiones */
  const [placa, setPlaca] = useState(null)
  const [iaComp, setIaComp] = useState(null)
  const [iaPlaca, setIaPlaca] = useState(null)
  const [analizando, setAnalizando] = useState('')

  const cargar = async () => {
    try {
      const datos = await consultarQR(codigo, idOwner)
      setD(datos)
      if (datos?.estado === 'ok' && datos.idreserva) {
        try { setPlaca(await obtenerPlacaReserva(datos.idreserva)) } catch { /* la placa es solo informativa */ }
      }
    } catch (e) { toast(e.message) }
  }

  useEffect(() => {
    document.title = 'UbiPark | Validar QR'
    if (!ok) {
      sessionStorage.setItem('gp_next', location.pathname)
      return entrar('propietario')
    }
    if (idOwner) cargar()
  }, [ses, idOwner, codigo])

  if (!ok) return null

  const accion = async (fn) => {
    setTrabajando(true)
    try { await fn(); await cargar() } catch (e) { toast(e.message) } finally { setTrabajando(false) }
  }

  const dar = () => accion(async () => {
    const r = await usarQR(codigo, idOwner)
    const textos = {
      ok: '✅ Acceso concedido. El QR ya no puede volver a usarse.',
      ya_usado: '⚠️ Este QR ya fue utilizado.',
      pago_pendiente: 'Primero debes verificar o cobrar el pago.',
      no_autorizado: 'Este QR no pertenece a tu estacionamiento.',
      invalido: 'QR inválido o reserva cancelada.',
    }
    setMsg(textos[r] || r)
  })

  /* IA: lee el comprobante de transferencia y compara el monto con la reserva */
  const revisarComprobante = async () => {
    setAnalizando('comprobante'); setIaComp(null)
    try { setIaComp(await analizarComprobante(d.comprobante_url, d.total)) }
    catch (e) { toast(e.message) }
    finally { setAnalizando('') }
  }

  /* IA: lee la placa de la foto del vehículo y la compara con la registrada */
  const revisarPlaca = async (e) => {
    const archivo = e.target.files?.[0]
    e.target.value = ''
    if (!archivo) return
    setAnalizando('placa'); setIaPlaca(null)
    try { setIaPlaca(await analizarPlaca(archivo, placa)) }
    catch (err) { toast(err.message) }
    finally { setAnalizando('') }
  }

  const caja = (color, titulo, sub) => (
    <div style={{ background: color, color: '#fff', borderRadius: 14, padding: 18, marginTop: 16 }}>
      <h2 style={{ margin: 0 }}>{titulo}</h2>{sub && <p style={{ margin: '6px 0 0' }}>{sub}</p>}
    </div>
  )

  const aviso = { background: '#f4f7fb', border: '1px solid var(--line)', borderRadius: 10, padding: 12, marginTop: 10, fontSize: '.9rem' }

  let cuerpo = <p className="sub">Consultando…</p>
  if (d?.estado === 'no_existe') cuerpo = caja('#b42318', 'QR no existe')
  else if (d?.estado === 'no_autorizado') cuerpo = caja('#b42318', 'No autorizado', 'Este QR es de otro estacionamiento.')
  else if (d?.estado === 'ok') {
    const pagado = d.estado_pago === 'verificado' || d.estado_pago === 'cobrado'
    const transf = d.metodo_pago === 'transferencia'
    const activo = !d.qr_usado && !d.cancelada
    cuerpo = (
      <>
        {d.qr_usado ? caja('#6b7280', 'YA USADO', `Se escaneó el ${new Date(d.qr_usado_en + 'Z').toLocaleString('es-MX')}`)
          : d.cancelada ? caja('#b42318', 'RESERVA CANCELADA')
          : d.estado_pago === 'rechazado' ? caja('#b42318', 'COMPROBANTE RECHAZADO')
          : pagado ? caja('#0b7a3b', 'PAGADO', transf ? 'Transferencia verificada' : 'Efectivo cobrado')
          : transf ? caja('#9a6200', 'COMPROBANTE POR VERIFICAR', 'Revisa la imagen antes de dar acceso.')
          : caja('#c2670a', `COBRAR $${d.total}`, 'Pago en efectivo pendiente.')}

        <div className="box" style={{ marginTop: 16 }}>
          <p><b>{d.lugar}</b></p>
          <p>Cliente: {d.cliente}</p>
          <p>Vehículo: {d.vehiculo} · {d.tipo_reserva === 'dia' ? `${d.dias} día(s)` : `${d.horas} h`} · ${d.total} MXN</p>
          {placa && <p>Placa registrada: <b>{placa}</b></p>}
          <p><small>{new Date(d.entrada + 'Z').toLocaleString('es-MX')} → {new Date(d.salida + 'Z').toLocaleString('es-MX')}</small></p>
          {d.comprobante_url && (
            <p style={{ marginTop: 10 }}>
              <a href={d.comprobante_url} target="_blank" rel="noreferrer">
                <img src={d.comprobante_url} alt="Comprobante" style={{ maxWidth: '100%', maxHeight: 320, borderRadius: 10 }} />
              </a>
            </p>
          )}

          {/* IA 1: revisar comprobante */}
          {d.comprobante_url && activo && (
            <>
              <button type="button" className="btn ghost sm" style={{ marginTop: 8 }} disabled={!!analizando} onClick={revisarComprobante}>
                {analizando === 'comprobante' ? 'Revisando…' : '🤖 Revisar comprobante con IA'}
              </button>
              {iaComp && (
                <div style={aviso}>
                  {!iaComp.es_comprobante ? (
                    <p>⚠️ La imagen no parece un comprobante de transferencia.</p>
                  ) : (
                    <>
                      <p>Monto leído: <b>{iaComp.monto != null ? `$${iaComp.monto}` : 'no se alcanzó a leer'}</b></p>
                      {iaComp.coincide_monto === true && <p>✅ Coincide con el total de la reserva (${d.total}).</p>}
                      {iaComp.coincide_monto === false && <p>❌ No coincide: la reserva es de ${d.total}.</p>}
                      {iaComp.fecha && <p>Fecha: {iaComp.fecha}</p>}
                      {iaComp.referencia && <p>Referencia: {iaComp.referencia}</p>}
                      {iaComp.banco && <p>Banco: {iaComp.banco}</p>}
                    </>
                  )}
                  {iaComp.observaciones && <p><small>{iaComp.observaciones}</small></p>}
                  <p><small>La IA es una ayuda. Confirma el depósito en tu cuenta antes de verificar.</small></p>
                </div>
              )}
            </>
          )}

          {/* IA 2: leer la placa del vehículo que llega */}
          {activo && (
            <div style={{ marginTop: 12 }}>
              <label className="btn ghost sm" style={{ display: 'inline-block', cursor: 'pointer', opacity: analizando ? 0.6 : 1 }}>
                {analizando === 'placa' ? 'Leyendo placa…' : '📷 Foto de la placa (IA)'}
                <input type="file" accept="image/*" capture="environment" hidden disabled={!!analizando} onChange={revisarPlaca} />
              </label>
              {iaPlaca && (
                <div style={aviso}>
                  {!iaPlaca.hay_placa ? (
                    <p>⚠️ No se ve una placa en la foto. Toma otra más cerca y con buena luz.</p>
                  ) : (
                    <>
                      <p>Placa leída: <b>{iaPlaca.placa || '—'}</b> <small>(confianza {iaPlaca.confianza})</small></p>
                      {iaPlaca.coincide === true && <p>✅ Coincide con la placa registrada ({placa}).</p>}
                      {iaPlaca.coincide === false && <p>❌ No coincide con la registrada ({placa}). Revisa a simple vista.</p>}
                      {iaPlaca.coincide === undefined && !placa && <p><small>Esta reserva no tiene placa registrada para comparar.</small></p>}
                    </>
                  )}
                  {iaPlaca.observaciones && <p><small>{iaPlaca.observaciones}</small></p>}
                </div>
              )}
            </div>
          )}
        </div>

        {!d.qr_usado && !d.cancelada && (
          <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
            {transf && d.estado_pago === 'en_revision' && (
              <div className="g2">
                <button className="btn green" disabled={trabajando} onClick={() => accion(() => cambiarEstadoPago(d.idreserva, idOwner, 'verificado'))}>✔ Verificar</button>
                <button className="btn dark" disabled={trabajando} onClick={() => accion(() => cambiarEstadoPago(d.idreserva, idOwner, 'rechazado'))}>✖ Rechazar</button>
              </div>
            )}
            {!transf && d.estado_pago === 'pendiente' && (
              <button className="btn" disabled={trabajando} onClick={() => accion(() => cambiarEstadoPago(d.idreserva, idOwner, 'cobrado'))}>💵 Marcar cobrado</button>
            )}
            {pagado && <button className="btn green" disabled={trabajando} onClick={dar}>Dar acceso y consumir QR</button>}
          </div>
        )}
        {msg && <p style={{ marginTop: 14, fontWeight: 600 }}>{msg}</p>}
      </>
    )
  }

  return (
    <div className="view on"><div className="wrap" style={{ maxWidth: 560 }}>
      <p style={{ marginTop: 20 }}><Link to="/propietario" style={{ color: 'var(--blue)', fontWeight: 600 }}>← Volver al panel</Link></p>
      <h2 className="title" style={{ marginTop: 12 }}>Validar reserva</h2>
      {cuerpo}
    </div></div>
  )
}