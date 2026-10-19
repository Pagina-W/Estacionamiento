import { useEffect, useState } from 'react'
import { DB } from '../lib/db.js'
import { useApp } from '../context/AppContext.jsx'
import { SelectorUbicacion } from '../components/MapaGoogle.jsx'

const vacio = {
  nom: '', est: 'Hidalgo', mun: '', loc: '', dir: '', lat: '', lng: '', pph: '', cap: '', hor: '',
  L: '', A: '', H: '', tipos: ['Moto', 'Sedán'], extra: '', reg: '',
}

/* Reduce la foto a 800px y la guarda como JPEG para que quepa en localStorage */
const foto = (f) => new Promise((resolve) => {
  const i = new Image(), fr = new FileReader()
  fr.onload = () => {
    i.onload = () => {
      const c = document.createElement('canvas'), k = Math.min(1, 800 / i.width)
      c.width = i.width * k
      c.height = i.height * k
      c.getContext('2d').drawImage(i, 0, 0, c.width, c.height)
      resolve(c.toDataURL('image/jpeg', 0.7))
    }
    i.src = fr.result
  }
  fr.readAsDataURL(f)
})

/* PANEL DEL PROPIETARIO: publicar lugares y gestionar folios */
export default function Propietario() {
  const { ses, entrar, toast } = useApp()
  const [f, setF] = useState(vacio)
  const [archivos, setArchivos] = useState([])
  const [formKey, setFormKey] = useState(0)
  const [lugares, setLugares] = useState([])
  const [folios, setFolios] = useState([])
  const ok = ses && ses.role === 'propietario'

  const cargar = () => {
    const L = DB.get('lugares', []).filter((l) => l.owner == ses.id)
    setLugares(L)
    setFolios(DB.get('folios', []).filter((x) => L.some((l) => l.id == x.lugar)))
  }

  useEffect(() => {
    document.title = 'GoParking | Panel del propietario'
    if (!ok) return entrar('propietario')
    cargar()
  }, [ses])

  if (!ok) return null

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const coords = (lat, lng) => setF((p) => ({ ...p, lat: String(lat), lng: String(lng) }))

  const pagar = (id) => {
    const F = DB.get('folios', [])
    F.find((x) => x.id == id).estado = 'pagado'
    DB.set('folios', F)
    cargar()
    toast('Folio marcado como pagado')
  }
  const lleno = (id) => {
    const L = DB.get('lugares', [])
    const l = L.find((x) => x.id == id)
    l.lleno = !l.lleno
    DB.set('lugares', L)
    cargar()
  }
  const borrar = (id) => {
    if (!confirm('¿Eliminar este estacionamiento?')) return
    DB.set('lugares', DB.get('lugares', []).filter((l) => l.id != id))
    cargar()
  }
  const miUbic = () => navigator.geolocation?.getCurrentPosition(
    (p) => coords(p.coords.latitude.toFixed(6), p.coords.longitude.toFixed(6)),
    () => toast('No se pudo obtener la ubicación')
  )

  const publicar = async (e) => {
    e.preventDefault()
    const fotos = await Promise.all(archivos.slice(0, 3).map(foto))
    const L = DB.get('lugares', [])
    L.push({
      id: 'l' + Date.now(), nombre: f.nom, estado: f.est, municipio: f.mun, localidad: f.loc, dir: f.dir,
      lat: +f.lat || null, lng: +f.lng || null, pph: +f.pph, cap: +f.cap, hor: f.hor,
      L: +f.L, A: +f.A, H: +f.H, tipos: f.tipos,
      extras: f.extra.split(',').map((x) => x.trim()).filter(Boolean),
      reg: f.reg, fotos, ico: '🅿️', owner: ses.id, tel: ses.tel, lleno: false,
    })
    if (!DB.set('lugares', L)) return toast('Sin espacio: usa fotos más pequeñas')
    setF(vacio)
    setArchivos([])
    setFormKey((k) => k + 1)
    cargar()
    toast('¡Estacionamiento publicado!')
  }

  const lat = parseFloat(f.lat), lng = parseFloat(f.lng)
  const consulta = [f.dir, f.loc, f.mun, f.est].filter(Boolean).join(', ')

  return (
    <div className="view on"><div className="wrap">
      <h2 className="title" style={{ marginTop: 28 }}>Panel de {ses.nombre}</h2>
      <div className="dash">
        <div className="box"><h3>Publicar estacionamiento</h3>
          <form key={formKey} onSubmit={publicar}>
            <label>Nombre del estacionamiento</label><input required placeholder="Ej. Garage Privado Centro" value={f.nom} onChange={set('nom')} />
            <div className="g3">
              <div><label>Estado</label><input required value={f.est} onChange={set('est')} /></div>
              <div><label>Municipio</label><input required value={f.mun} onChange={set('mun')} /></div>
              <div><label>Localidad</label><input required value={f.loc} onChange={set('loc')} /></div>
            </div>
            <label>Dirección / referencias</label><input required value={f.dir} onChange={set('dir')} />
            <div className="g2">
              <div><label>Latitud</label><input type="number" step="any" placeholder="21.1783" value={f.lat} onChange={set('lat')} /></div>
              <div><label>Longitud</label><input type="number" step="any" placeholder="-99.1989" value={f.lng} onChange={set('lng')} /></div>
            </div>
            <button type="button" className="btn ghost sm" style={{ marginTop: 8 }} onClick={miUbic}>📍 Usar mi ubicación actual</button>{' '}
            <SelectorUbicacion lat={lat} lng={lng} direccion={consulta} onChange={coords} onError={toast} />
            <div className="g3">
              <div><label>Precio/hora ($)</label><input type="number" required value={f.pph} onChange={set('pph')} /></div>
              <div><label>Capacidad</label><input type="number" required value={f.cap} onChange={set('cap')} /></div>
              <div><label>Horario</label><input required placeholder="8am-10pm" value={f.hor} onChange={set('hor')} /></div>
            </div>
            <div className="g3">
              <div><label>Largo máx (m)</label><input type="number" step=".1" required value={f.L} onChange={set('L')} /></div>
              <div><label>Ancho máx (m)</label><input type="number" step=".1" required value={f.A} onChange={set('A')} /></div>
              <div><label>Altura máx (m)</label><input type="number" step=".1" required value={f.H} onChange={set('H')} /></div>
            </div>
            <label>Vehículos permitidos</label>
            <select multiple size={3} value={f.tipos} onChange={(e) => setF({ ...f, tipos: [...e.target.selectedOptions].map((o) => o.value) })}>
              <option>Moto</option><option>Sedán</option><option>SUV</option><option>Camioneta</option>
            </select>
            <label>Características (separadas por coma)</label><input placeholder="Techado, Con sombra, Cámaras, Portón eléctrico" value={f.extra} onChange={set('extra')} />
            <label>Reglamento</label><textarea rows={2} placeholder="Ej. No dejar objetos de valor" value={f.reg} onChange={set('reg')} />
            <label>Fotos del lugar (hasta 3)</label><input type="file" accept="image/*" multiple onChange={(e) => setArchivos([...e.target.files])} />
            <button className="btn" style={{ width: '100%', marginTop: 16 }}>Publicar</button>
          </form></div>

        <div>
          <div className="box"><h3>Mis estacionamientos</h3><div style={{ marginTop: 10 }}>
            {lugares.length ? lugares.map((l) => (
              <p key={l.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
                <span><b>{l.nombre}</b><br /><small>${l.pph}/h · {l.lleno ? 'Lleno' : 'Disponible'}</small></span>
                <span><button className="btn sm ghost" onClick={() => lleno(l.id)}>{l.lleno ? 'Liberar' : 'Marcar lleno'}</button> <button className="btn sm dark" onClick={() => borrar(l.id)}>🗑</button></span>
              </p>
            )) : <p className="sub">Aún no publicas nada.</p>}
          </div></div>
          <div className="box" style={{ marginTop: 20 }}><h3>Folios de mis clientes</h3>
            <div className="scroll"><table><thead><tr><th>Folio</th><th>Cliente</th><th>Lugar</th><th>Estado</th><th></th></tr></thead>
              <tbody>
                {folios.length ? folios.map((x) => (
                  <tr key={x.id}>
                    <td><code>{x.id}</code></td>
                    <td>{x.cliente}<br /><small>{x.veh} · {x.hrs}h{x.pref ? ' · ' + x.pref : ''}</small></td>
                    <td>{x.lugarN}</td>
                    <td><span className={'badge ' + (x.estado === 'pagado' ? 'b-ok' : 'b-p')}>{x.estado === 'pagado' ? 'Pagado' : 'Pago pendiente'}</span></td>
                    <td>{x.estado === 'pendiente' && <button className="btn sm" onClick={() => pagar(x.id)}>Marcar pagado</button>}</td>
                  </tr>
                )) : <tr><td colSpan={5}>Sin folios todavía</td></tr>}
              </tbody></table></div></div>
        </div>
      </div>
    </div></div>
  )
}
