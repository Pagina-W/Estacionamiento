import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { stars } from '../lib/db.js'
import { useApp } from '../context/AppContext.jsx'
import { MapaLugar } from '../components/MapaGoogle.jsx'
import TarjetaQR from '../components/tarjetaQR.jsx'
import { distanciaKm, obtenerIdUsuario, waNumero } from '../lib/idusuario.js'
import { obtenerLugar, obtenerLugares } from '../services/lugarService.js'
import Resenas from './resenas.jsx'
import { resumenResenas } from '../services/resenaService.js'
import { crearReserva, obtenerReserva, subirComprobante } from '../services/reservaService.js'

const ahoraLocal = () => {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

const aMin = (t) => { const [h, m] = String(t || '0:0').split(':'); return (+h || 0) * 60 + (+m || 0) }

/* Tarifas generadas a partir del precio por hora y el horario que registró el propietario */
function generarTarifas(l) {
  let abierto = (aMin(l.cierre) - aMin(l.apertura)) / 60
  if (!(abierto > 0)) abierto = abierto === 0 ? 24 : abierto + 24
  abierto = Math.round(abierto * 2) / 2
  const horas = [1, 2, 3, 4, 6, 8].filter((h) => h < abierto)
  const t = horas.map((h) => ({ id: 'h' + h, tipo: 'hora', cantidad: h, horas: h, etiqueta: h === 1 ? '1 hora' : `${h} horas`, detalle: '', precio: l.pph * h }))
  t.push({ id: 'dia', tipo: 'dia', cantidad: 1, horas: abierto, etiqueta: 'Día completo', detalle: `${l.apertura} – ${l.cierre}`, precio: l.pph * abierto })
  return t
}

const dinero = (n) => '$' + Number(n).toLocaleString('es-MX', { maximumFractionDigits: 2 })
const aFecha = (s) => new Date(String(s).endsWith('Z') ? s : s + 'Z')

/* PÁGINA DEL LUGAR: todo viene de Supabase (lo que publicó el propietario) */
export default function Lugar() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { ses, entrar, toast, user } = useApp()
  const idUsuario = obtenerIdUsuario(user, ses)
  const cl = ses && ses.role === 'cliente'

  const [l, setL] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [resumen, setResumen] = useState(null) // { promedio, total }: solo cuenta reseñas publicadas
  const [cercanos, setCercanos] = useState([])
  const [foto, setFoto] = useState(0)

  const [veh, setVeh] = useState('')
  const [tarifaId, setTarifaId] = useState('h2')
  const [entrada, setEntrada] = useState(ahoraLocal())
  const [pref, setPref] = useState('')
  const [placa, setPlaca] = useState('')
  const [pago, setPago] = useState(false)
  const [metodo, setMetodo] = useState('')
  const [comp, setComp] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [reserva, setReserva] = useState(null)

  const volver = () => {
    if (window.history.state && window.history.state.idx > 0) navigate(-1)
    else navigate(ses?.role === 'propietario' ? '/propietario' : ses ? '/cliente' : '/')
  }

  useEffect(() => { document.title = 'UbiPark | Estacionamiento' }, [])

  const cargar = useCallback(async () => {
    try {
      const lugar = await obtenerLugar(id)
      setL(lugar)
      if (lugar) {
        try { setResumen((await resumenResenas(id))?.[0] ?? null) } catch { setResumen(null) }
        setVeh((v) => v || lugar.tipos[0] || '')
        if (!lugar.disponible && lugar.lat != null) {
          const todos = await obtenerLugares()
          setCercanos(
            todos.filter((x) => x.id != lugar.id && x.disponible && x.lat != null)
              .map((x) => ({ ...x, km: distanciaKm(lugar.lat, lugar.lng, x.lat, x.lng) }))
              .sort((a, b) => a.km - b.km).slice(0, 3))
        } else setCercanos([])
      }
    } catch (e) {
      toast(e.message)
    } finally {
      setCargando(false)
    }
  }, [id])

  useEffect(() => { cargar() }, [cargar])

  /* La reserva se refresca sola mientras el dueño la verifica o la cobra */
  useEffect(() => {
    if (!reserva || reserva.qr_usado) return
    const t = setInterval(async () => {
      try { setReserva(await obtenerReserva(reserva.idreserva)) } catch { /* se reintenta */ }
    }, 8000)
    return () => clearInterval(t)
  }, [reserva?.idreserva, reserva?.qr_usado])

  const tarifas = useMemo(() => (l ? generarTarifas(l) : []), [l])
  const tarifa = tarifas.find((t) => t.id === tarifaId) || tarifas[0]

  if (cargando) return <div className="view on"><div className="wrap"><p className="sub" style={{ marginTop: 20 }}>Cargando…</p></div></div>

  const botonVolver = (
    <p style={{ marginTop: 20 }}>
      <button type="button" onClick={volver}
        style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', color: 'var(--blue)', fontWeight: 600, fontSize: 'inherit' }}>
        ← Volver
      </button>
    </p>
  )

  if (!l) {
    return (
      <div className="view on"><div className="wrap">
        {botonVolver}
        <p className="sub" style={{ marginTop: 20 }}>No encontramos este estacionamiento.</p>
      </div></div>
    )
  }

  const proxima = l.proxima_salida ? aFecha(l.proxima_salida) : null
  const horaProx = proxima && proxima.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  const pocosLugares = l.disponible && l.libres <= 1 && proxima

  const wsp = () => {
    if (!l.tel) return toast('Este dueño aún no tiene un número de contacto registrado.')
    const m = `Hola, soy ${ses.nombre}. Me interesa "${l.nombre}" en UbiPark para un ${veh || 'vehículo'}: ${tarifa.etiqueta} (${dinero(tarifa.precio)}).${pref ? ' Prefiero: ' + pref + '.' : ''} ¿Está disponible y cómo puedo pagar?`
    window.open(`https://wa.me/${waNumero(l.tel)}?text=${encodeURIComponent(m)}`, '_blank')
    setPago(true)
  }

  const confirmar = async () => {
    if (!idUsuario) return toast('Vuelve a iniciar sesión.')
    if (!metodo) return toast('Elige cómo acordaron el pago.')
    if (!placa.trim()) return toast('Escribe la placa de tu vehículo.')
    if (metodo === 'transferencia' && !comp) return toast('Sube la imagen del comprobante de transferencia.')
    setEnviando(true)
    try {
      const fresco = await obtenerLugar(id)          // revisa cupo justo antes de reservar
      if (!fresco?.disponible) { setL(fresco); throw new Error('Este lugar se acaba de llenar.') }
      const ini = new Date(entrada)
      const fin = new Date(ini.getTime() + tarifa.horas * 3600 * 1000)
      const url = metodo === 'transferencia' ? await subirComprobante(comp, idUsuario) : null
      const r = await crearReserva({
        idestacionamiento: l.id, idusuario: idUsuario,
        entrada: ini.toISOString(), salida: fin.toISOString(),
        total: tarifa.precio, tipo: tarifa.tipo, cantidad: tarifa.cantidad, vehiculo: veh, placa, preferencia: pref,
        metodo, comprobante_url: url,
      })
      setReserva(r)
      toast(metodo === 'transferencia' ? 'Comprobante enviado. Aquí tienes tu QR.' : 'Lugar apartado. Paga en físico al llegar.')
      cargar()
    } catch (e) {
      toast(e.message)
    } finally {
      setEnviando(false)
    }
  }

  const login = () => {
    sessionStorage.setItem('gp_next', location.pathname)
    entrar('cliente')
  }

  const ubicacion = [l.dir, l.localidad, l.municipio, l.estado].filter(Boolean).join(', ')

  return (
    <div className="view on"><div className="wrap">
      {botonVolver}
      <div className="detail">
        <div>
          {/* Galería */}
          <div className="gal">
            {(l.fotos.length ? l.fotos : [null]).map((f, i) => (
              <div className="ph" key={i} style={f ? { backgroundImage: `url(${f})` } : undefined}
                onClick={() => setFoto(i)}>{f ? '' : '🅿️'}</div>
            ))}
          </div>

          <h1 style={{ marginTop: 18 }}>{l.nombre}</h1>
          <div className="stars">
            {stars(Math.round(Number(resumen?.promedio) || 0))}{' '}
            <small style={{ color: '#58708a', letterSpacing: 0 }}>
              {resumen?.total
                ? `${Number(resumen.promedio).toFixed(1)} · ${resumen.total} ${resumen.total === 1 ? 'reseña' : 'reseñas'}`
                : 'Sin reseñas todavía'}
            </small>
          </div>

          {/* Disponibilidad en vivo */}
          <p style={{ marginTop: 8 }}>
            <span className={'badge ' + (l.disponible ? 'b-ok' : 'b-p')}>
              {l.disponible ? `Disponible · ${l.libres} de ${l.cap} lugares libres` : 'No disponible'}
            </span>
          </p>
          {!l.disponible && proxima && <p className="sub">Se libera un lugar aprox. a las {horaProx}.</p>}
          {pocosLugares && <p className="sub">⏳ Queda poco cupo: se libera un lugar aprox. a las {horaProx}.</p>}

          <h3 style={{ marginTop: 18 }}>Información</h3>
          <p>📍 {ubicacion}</p>
          {l.hor && <p>🕒 Horario: {l.hor}</p>}
          <p>🚘 Capacidad: {l.cap} lugares</p>

          {/* Tarifas calculadas del precio por hora del propietario */}
          <h3 style={{ marginTop: 18 }}>Tarifas</h3>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', marginTop: 8 }}>
            {tarifas.map((t) => (
              <button key={t.id} type="button" onClick={() => setTarifaId(t.id)}
                style={{
                  textAlign: 'left', cursor: 'pointer', padding: '12px 14px', borderRadius: 14, font: 'inherit',
                  border: '2px solid ' + (t.id === tarifaId ? 'var(--blue)' : 'var(--line)'),
                  background: t.id === tarifaId ? '#eaf3ff' : '#fff', color: 'inherit',
                }}>
                <b>{t.etiqueta}</b><br />
                <span style={{ fontSize: '1.15rem', fontWeight: 700 }}>{dinero(t.precio)}</span>
                {t.detalle && <><br /><small>{t.detalle}</small></>}
              </button>
            ))}
          </div>
          <p className="sub" style={{ fontSize: '.8rem', marginTop: 6 }}>Precio base: {dinero(l.pph)} por hora.</p>

          {l.tipos.length > 0 && (<><h3 style={{ marginTop: 18 }}>Vehículos permitidos</h3>
            <div className="chips">{l.tipos.map((t) => <span key={t}>{t}</span>)}</div></>)}

          {(l.L || l.A || l.H) && (<><h3 style={{ marginTop: 18 }}>Medidas máximas</h3>
            <div className="chips">
              {l.L && <span>Largo {l.L} m</span>}{l.A && <span>Ancho {l.A} m</span>}{l.H && <span>Altura {l.H} m</span>}
            </div></>)}

          {l.extras.length > 0 && (<><h3 style={{ marginTop: 18 }}>Características</h3>
            <div className="chips">{l.extras.map((t) => <span key={t}>{t}</span>)}</div></>)}

          {l.reg && (<><h3 style={{ marginTop: 18 }}>Reglamento</h3><p>{l.reg}</p></>)}

          <h3 style={{ margin: '18px 0 8px' }}>Ubicación</h3>
          <MapaLugar lat={l.lat} lng={l.lng} />

          {!l.disponible && cercanos.length > 0 && (
            <>
              <h3 style={{ margin: '20px 0 8px' }}>Otros estacionamientos cerca con lugar</h3>
              {cercanos.map((c) => (
                <p key={c.id} style={{ padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
                  <Link to={`/lugar/${c.id}`} style={{ color: 'var(--blue)', fontWeight: 600 }}>{c.nombre}</Link>
                  {' '}<small>· {c.km.toFixed(1)} km · {dinero(c.pph)}/h · {c.libres} libres</small>
                </p>
              ))}
            </>
          )}
        </div>

        {/* Reservar */}
        <div><div className="box"><h3>Reservar</h3>
          {cl ? (
            reserva ? (
              <TarjetaQR r={reserva} lugar={l.nombre} />
            ) : !l.disponible ? (
              <p className="sub">Este lugar está lleno por ahora.{proxima ? ` Se libera aprox. a las ${horaProx}.` : ''} Revisa los estacionamientos cercanos.</p>
            ) : (
              <>
                {l.tipos.length > 0 && (<>
                  <label>Tipo de vehículo</label>
                  <select value={veh} onChange={(e) => setVeh(e.target.value)}>{l.tipos.map((t) => <option key={t}>{t}</option>)}</select>
                </>)}
                <label>Placa del vehículo</label>
                <input placeholder="Ej. ABC-123-D" maxLength={20} value={placa} onChange={(e) => setPlaca(e.target.value)} />
                <label>Tarifa</label>
                <select value={tarifaId} onChange={(e) => setTarifaId(e.target.value)}>
                  {tarifas.map((t) => <option key={t.id} value={t.id}>{t.etiqueta} · {dinero(t.precio)}</option>)}
                </select>
                <label>Entrada</label>
                <input type="datetime-local" min={ahoraLocal()} value={entrada} onChange={(e) => setEntrada(e.target.value)} />
                <label>Preferencias (ej. lugar con sombra)</label>
                <input placeholder="Opcional" value={pref} onChange={(e) => setPref(e.target.value)} />
                <p style={{ marginTop: 10 }}>Total: <b>{dinero(tarifa.precio)}</b></p>

                <button className="btn green" style={{ width: '100%', marginTop: 12 }} onClick={wsp}>📱 Contactar por WhatsApp</button>

                {pago && (
                  <div style={{ marginTop: 18 }}>
                    <h3>¿Cómo acordaron el pago?</h3>
                    <div className="g2" style={{ marginTop: 8 }}>
                      <button type="button" className={'btn ' + (metodo === 'efectivo' ? '' : 'dark')} onClick={() => setMetodo('efectivo')}>💵 Físico</button>
                      <button type="button" className={'btn ' + (metodo === 'transferencia' ? '' : 'ghost')} onClick={() => setMetodo('transferencia')}>💳 Transferencia</button>
                    </div>
                    {metodo === 'transferencia' && (
                      <>
                        <label>Imagen del comprobante</label>
                        <input type="file" accept="image/*" onChange={(e) => setComp(e.target.files[0] || null)} />
                      </>
                    )}
                    {metodo === 'efectivo' && (
                      <p className="sub" style={{ fontSize: '.78rem', marginTop: 8 }}>Apartarás el lugar y pagarás en físico. Tu QR indicará que el pago sigue pendiente.</p>
                    )}
                    {metodo && (
                      <button className="btn" style={{ width: '100%', marginTop: 12 }} onClick={confirmar} disabled={enviando}>
                        {enviando ? 'Enviando…' : 'Generar mi comprobante y QR'}
                      </button>
                    )}
                  </div>
                )}
              </>
            )
          ) : (
            <>
              <p className="sub">Inicia sesión como cliente para reservar.</p>
              <button className="btn" onClick={login}>Iniciar sesión</button>
            </>
          )}
        </div></div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <Resenas idEstacionamiento={l.id} onCambio={cargar} actualizar={reserva?.qr_usado} />
      </div>
    </div></div>
  )
}
