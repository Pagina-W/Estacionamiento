import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { DB, avg, stars } from '../lib/db.js'
import { useApp } from '../context/AppContext.jsx'
import { MapaLugar } from '../components/MapaGoogle.jsx'

/* PÁGINA DEL LUGAR: info, mapa, reseñas, WhatsApp, folio y QR */
export default function Lugar() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { ses, entrar, toast } = useApp()
  const l = useMemo(() => DB.get('lugares', []).find((x) => x.id == id), [id])
  const [resenas, setResenas] = useState(() => DB.get('resenas', []).filter((x) => x.l == id))
  const [veh, setVeh] = useState(l?.tipos[0] || '')
  const [hrs, setHrs] = useState(2)
  const [pref, setPref] = useState('')
  const [pago, setPago] = useState(false)
  const [folio, setFolio] = useState(null)
  const [rv, setRv] = useState({ s: '5', t: '' })

  useEffect(() => { document.title = 'GoParking | Estacionamiento' }, [])

  if (!l) {
    return (
      <div className="view on"><div className="wrap">
        <p style={{ marginTop: 20 }}><Link to="/" style={{ color: 'var(--blue)', fontWeight: 600 }}>← Volver</Link></p>
        <p className="sub" style={{ marginTop: 20 }}>No encontramos este estacionamiento.</p>
      </div></div>
    )
  }

  const cl = ses && ses.role === 'cliente'
  const total = l.pph * (+hrs || 1)

  const wsp = () => {
    const m = `Hola, soy ${ses.nombre}. Me interesa "${l.nombre}" para un ${veh} por ${hrs} hora(s).${pref ? ' Prefiero: ' + pref + '.' : ''} ¿Está disponible y cómo puedo pagar?`
    window.open(`https://wa.me/${l.tel}?text=${encodeURIComponent(m)}`, '_blank')
    setPago(true)
  }

  const crearFolio = (t) => {
    const F = DB.get('folios', [])
    const f = {
      id: t + '-' + Math.floor(1000 + Math.random() * 9000), lugar: l.id, lugarN: l.nombre, owner: l.owner,
      cliente: ses.nombre, tel: ses.tel, veh, hrs: +hrs, pref, total,
      estado: t === 'TRA' ? 'pagado' : 'pendiente', fecha: new Date().toLocaleString('es-MX'),
    }
    F.push(f)
    DB.set('folios', F)
    setFolio(f)
  }

  const enviarResena = (e) => {
    e.preventDefault()
    const R = DB.get('resenas', [])
    R.push({ l: l.id, n: ses.nombre, r: 'Conductor', s: +rv.s, t: rv.t })
    DB.set('resenas', R)
    setResenas(R.filter((x) => x.l == l.id))
    setRv({ s: '5', t: '' })
  }

  const login = () => {
    sessionStorage.setItem('gp_next', location.hash.slice(1) || '/')
    entrar('cliente')
  }

  const pagado = folio?.estado === 'pagado'

  return (
    <div className="view on"><div className="wrap">
      <p style={{ marginTop: 20 }}><Link to="/" style={{ color: 'var(--blue)', fontWeight: 600 }}>← Volver</Link></p>
      <div className="detail">
        <div>
          <div className="gal">
            {(l.fotos.length ? l.fotos : [null]).map((f, i) => (
              <div className="ph" key={i} style={f ? { backgroundImage: `url(${f})` } : undefined}>{f ? '' : l.ico || '🅿️'}</div>
            ))}
          </div>
          <h1 style={{ marginTop: 18 }}>{l.nombre}</h1>
          <div className="stars">{stars(avg(l.id))} <small style={{ color: '#58708a', letterSpacing: 0 }}>({resenas.length} reseñas)</small></div>
          <p>📍 {l.dir}, {l.estado}</p>
          <p>🕒 {l.hor} · 💰 ${l.pph} MXN/hora · 🚘 {l.cap} lugares</p>
          <h3 style={{ marginTop: 16 }}>Medidas máximas</h3>
          <div className="chips"><span>Largo {l.L} m</span><span>Ancho {l.A} m</span><span>Altura {l.H} m</span></div>
          <h3 style={{ marginTop: 16 }}>Vehículos permitidos</h3>
          <div className="chips">{l.tipos.map((t) => <span key={t}>{t}</span>)}</div>
          <h3 style={{ marginTop: 16 }}>Características</h3>
          <div className="chips">{l.extras.length ? l.extras.map((t) => <span key={t}>{t}</span>) : '—'}</div>
          <h3 style={{ marginTop: 16 }}>Reglamento</h3><p>{l.reg || '—'}</p>
          <h3 style={{ margin: '16px 0 8px' }}>Ubicación</h3>
          <MapaLugar lat={l.lat} lng={l.lng} />
        </div>

        <div><div className="box"><h3>Reservar</h3>
          {cl ? (
            <>
              <label>Tipo de vehículo</label>
              <select value={veh} onChange={(e) => setVeh(e.target.value)}>{l.tipos.map((t) => <option key={t}>{t}</option>)}</select>
              <label>Horas</label>
              <input type="number" min="1" value={hrs} onChange={(e) => setHrs(e.target.value)} />
              <label>Preferencias (ej. lugar con sombra)</label>
              <input placeholder="Opcional" value={pref} onChange={(e) => setPref(e.target.value)} />
              <p style={{ marginTop: 10 }}>Total estimado: <b>${total}</b></p>
              <button className="btn green" style={{ width: '100%', marginTop: 12 }} onClick={wsp}>📱 Contactar por WhatsApp</button>
              {pago && (
                <div style={{ marginTop: 18 }}><h3>¿Cómo acordaron el pago?</h3>
                  <div className="g2" style={{ marginTop: 8 }}>
                    <button className="btn dark" onClick={() => crearFolio('EFE')}>💵 Efectivo</button>
                    <button className="btn" onClick={() => crearFolio('TRA')}>💳 Transferencia</button>
                  </div>
                </div>
              )}
              {folio && (
                <div className={'folio ' + (pagado ? 'paid' : 'pend')}>
                  <b>{pagado ? '✅ Reservado y pagado' : '⏳ Apartado · pago pendiente en físico'}</b>
                  <code>{folio.id}</code>
                  <div id="qr">
                    <QRCodeSVG size={150} fgColor={pagado ? '#0b7a3b' : '#9a6200'} value={`GOPARKING|${folio.id}|${folio.lugarN}|${folio.cliente}|${folio.estado.toUpperCase()}`} />
                  </div>
                  <small>{folio.lugarN} · {folio.veh} · {folio.hrs} h · ${folio.total} MXN<br />{folio.cliente} · {folio.fecha}</small>
                  <p style={{ fontSize: '.8rem', marginTop: 6 }}>Muestra este código al dueño al llegar.</p>
                </div>
              )}
            </>
          ) : (
            <>
              <p className="sub">Inicia sesión como cliente para reservar.</p>
              <button className="btn" onClick={login}>Iniciar sesión</button>
            </>
          )}
        </div></div>
      </div>

      <div className="box" style={{ marginBottom: 20 }}><h3>Reseñas</h3>
        {resenas.length ? resenas.map((r, i) => (
          <p style={{ marginTop: 10 }} key={i}><span className="stars">{stars(r.s)}</span> <b>{r.n}</b> ({r.r})<br />{r.t}</p>
        )) : <p className="sub">Aún sin reseñas</p>}
        {cl && (
          <form onSubmit={enviarResena} className="g2" style={{ marginTop: 14 }}>
            <select value={rv.s} onChange={(e) => setRv({ ...rv, s: e.target.value })}>
              <option value="5">★★★★★</option><option value="4">★★★★☆</option><option value="3">★★★☆☆</option>
            </select>
            <input placeholder="Tu opinión" required value={rv.t} onChange={(e) => setRv({ ...rv, t: e.target.value })} />
            <button className="btn sm">Enviar</button>
          </form>
        )}
      </div>
    </div></div>
  )
}
