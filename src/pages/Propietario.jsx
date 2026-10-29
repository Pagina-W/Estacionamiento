import { useEffect, useState } from 'react'
import { DB } from '../lib/db.js'   // esta no se usa , solo se deja mientras  tengamos backend de cliente 
import { useApp } from '../context/AppContext.jsx'
import { SelectorUbicacion } from '../components/MapaGoogle.jsx'
import {obtenerEstacionamientosPorPropietario, crearEstacionamiento,cambiarEstadoEstacionamiento, eliminarEstacionamiento,
} from '../services/estacionamientoService.js'

const vacio = {
  nom: '', est: 'San Luis Potosi', mun: '', loc: '', dir: '', lat: '', lng: '', pph: '', cap: '',
  horaapertura: '08:00',
  horacierre: '20:00',
  L: '', A: '', H: '', tipos: ['Moto', 'Sedán'], extra: '', reg: '',
}

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

export default function Propietario() {
  const { ses, entrar, toast, user } = useApp()
  const [f, setF] = useState(vacio)
  const [archivos, setArchivos] = useState([])
  const [formKey, setFormKey] = useState(0)
  const [lugares, setLugares] = useState([])
  const [folios, setFolios] = useState([])
  const ok = ses && ses.role === 'propietario'

  // Buscar el ID de usuario en las diferentes estructuras de supabase 
  const idUsuarioActual =
    user?.idusuario ||
    user?.idUsuario ||
    user?.id ||
    user?.usuarios?.idusuario ||
    (Array.isArray(user?.usuarios) ? user?.usuarios[0]?.idusuario : null) ||
    ses?.idusuario ||
    ses?.idUsuario ||
    ses?.id ||
    ses?.id_usuario

  const cargar = async () => {
    if (!idUsuarioActual) return
    try {
      const L = await obtenerEstacionamientosPorPropietario(idUsuarioActual)
      setLugares(L)

      const todosFolios = DB.get('folios', [])
      setFolios(todosFolios.filter((x) => L.some((l) => l.idestacionamiento == x.lugar)))
    } catch (err) {
      toast(err.message)
    }
  }

  useEffect(() => {
    document.title = 'GoParking | Panel del propietario'
    if (!ok) return entrar('propietario')
    cargar()
  }, [ses, idUsuarioActual])

  if (!ok) return null

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const coords = (lat, lng) => setF((p) => ({ ...p, lat: String(lat), lng: String(lng) }))

  const pagar = (id) => {
    const F = DB.get('folios', [])
    const folio = F.find((x) => x.id == id)
    if (folio) folio.estado = 'pagado'
    DB.set('folios', F)
    cargar()
    toast('Folio marcado como pagado')
  }

  const lleno = async (id, estadoActual) => {
    try {
      await cambiarEstadoEstacionamiento(id, !estadoActual)
      await cargar()
      toast(estadoActual ? 'Estacionamiento marcado como lleno' : 'Estacionamiento liberado')
    } catch (err) {
      toast(err.message)
    }
  }

  const borrar = async (id) => {
    if (!confirm('¿Eliminar este estacionamiento?')) return
    try {
      await eliminarEstacionamiento(id)
      await cargar()
      toast('Estacionamiento eliminado')
    } catch (err) {
      toast(err.message)
    }
  }

  // Función para obtner geolocalización 
  const miUbic = () => {
    if (!navigator.geolocation) {
      return toast('Tu navegador no soporta geolocalización.')
    }

    toast(' Solicitando ubicación a tu dispositivo...')

    navigator.geolocation.getCurrentPosition(
      (p) => {
        const latStr = p.coords.latitude.toFixed(6)
        const lngStr = p.coords.longitude.toFixed(6)
        coords(latStr, lngStr)
        toast('¡Ubicación obtenida con éxito!')
      },
      (err) => {
        console.error('Error de geolocalización:', err)
        if (err.code === 1) {
          toast('Permiso denegado. Haz clic en el ícono del candado junto a la URL para permitir la ubicación.')
        } else if (err.code === 2) {
          toast('Ubicación no disponible. Asegúrate de tener activo el GPS de tu dispositivo.')
        } else if (err.code === 3) {
          toast('Tiempo de espera agotado al consultar el GPS. Intenta de nuevo.')
        } else {
          toast('No se pudo obtener la ubicación actual.')
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const publicar = async (e) => {
    e.preventDefault()

    if (!idUsuarioActual) {
      return toast('Error de usuario: vuelve a iniciar sesión.')
    }

    try {
      const fotos = await Promise.all(archivos.slice(0, 3).map(foto))

      await crearEstacionamiento({
        nombre: f.nom,
        idusuario: idUsuarioActual,
        estado: f.est,
        municipio: f.mun,
        localidad: f.loc,
        direccion: f.dir,
        latitud: +f.lat || null,
        longitud: +f.lng || null,
        precioporhora: +f.pph,
        capacidadtotal: +f.cap,
        horaapertura: f.horaapertura,
        horacierre: f.horacierre,
        tipos: f.tipos, 
        imagen: fotos[0] || null,
      })

      setF(vacio)
      setArchivos([])
      setFormKey((k) => k + 1)
      await cargar()
      toast('¡Estacionamiento publicado con éxito!')
    } catch (err) {
      toast(err.message)
    }
  }

  const lat = parseFloat(f.lat), lng = parseFloat(f.lng)
  const consulta = [f.dir, f.loc, f.mun, f.est].filter(Boolean).join(', ')

  return (
    <div className="view on">
      <div className="wrap">
        <h2 className="title" style={{ marginTop: 28 }}>
          Panel de {user?.nombre || ses?.nombre}
        </h2>
        <div className="dash">
          <div className="box">
            <h3>Publicar estacionamiento</h3>
            <form key={formKey} onSubmit={publicar}>
              <label>Nombre del estacionamiento</label>
              <input required placeholder="Ej. Garage Privado Centro" value={f.nom} onChange={set('nom')} />
              <div className="g3">
                <div><label>Estado</label><input required value={f.est} onChange={set('est')} /></div>
                <div><label>Municipio</label><input required value={f.mun} onChange={set('mun')} /></div>
                <div><label>Localidad</label><input required value={f.loc} onChange={set('loc')} /></div>
              </div>
              <label>Dirección / referencias</label>
              <input required value={f.dir} onChange={set('dir')} />
              <div className="g2">
                <div><label>Latitud</label><input type="number" step="any" placeholder="21.1783" value={f.lat} onChange={set('lat')} /></div>
                <div><label>Longitud</label><input type="number" step="any" placeholder="-99.1989" value={f.lng} onChange={set('lng')} /></div>
              </div>
              <button type="button" className="btn ghost sm" style={{ marginTop: 8 }} onClick={miUbic}>
                Usar ubicación actual
              </button>{' '}
              <SelectorUbicacion lat={lat} lng={lng} direccion={consulta} onChange={coords} onError={toast} />

              <div className="g2">
                <div><label>Precio/hora ($)</label><input type="number" required value={f.pph} onChange={set('pph')} /></div>
                <div><label>Capacidad total</label><input type="number" required value={f.cap} onChange={set('cap')} /></div>
              </div>

              <div className="g2">
                <div><label>Hora de Apertura</label><input type="time" required value={f.horaapertura} onChange={set('horaapertura')} /></div>
                <div><label>Hora de Cierre</label><input type="time" required value={f.horacierre} onChange={set('horacierre')} /></div>
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
              <label>Características (separadas por coma)</label>
              <input placeholder="Techado, Con sombra, Cámaras, Portón eléctrico" value={f.extra} onChange={set('extra')} />
              <label>Reglamento</label>
              <textarea rows={2} placeholder="Ej. No dejar objetos de valor" value={f.reg} onChange={set('reg')} />
              <label>Fotos del lugar (hasta 3)</label>
              <input type="file" accept="image/*" multiple onChange={(e) => setArchivos([...e.target.files])} />
              <button className="btn" style={{ width: '100%', marginTop: 16 }}>Publicar</button>
            </form>
          </div>

          <div>
            <div className="box">
              <h3>Mis estacionamientos</h3>
              <div style={{ marginTop: 10 }}>
                {lugares.length ? (
                  lugares.map((l) => (
                    <p key={l.idestacionamiento} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--line)' }}>
                      <span>
                        <b>{l.nombreestacionamiento}</b><br />
                        <small>${l.precioporhora}/h · {l.activo ? 'Disponible' : 'Lleno'}</small>
                      </span>
                      <span>
                        <button className="btn sm ghost" onClick={() => lleno(l.idestacionamiento, l.activo)}>
                          {l.activo ? 'Marcar lleno' : 'Liberar'}
                        </button>{' '}
                        <button className="btn sm dark" onClick={() => borrar(l.idestacionamiento)}>🗑</button>
                      </span>
                    </p>
                  ))
                ) : (
                  <p className="sub">Aún no publicas nada.</p>
                )}
              </div>
            </div>
            <div className="box" style={{ marginTop: 20 }}>
              <h3>Folios de mis clientes</h3>
              <div className="scroll">
                <table>
                  <thead>
                    <tr><th>Folio</th><th>Cliente</th><th>Lugar</th><th>Estado</th><th></th></tr>
                  </thead>
                  <tbody>
                    {folios.length ? (
                      folios.map((x) => (
                        <tr key={x.id}>
                          <td><code>{x.id}</code></td>
                          <td>{x.cliente}<br /><small>{x.veh} · {x.hrs}h{x.pref ? ' · ' + x.pref : ''}</small></td>
                          <td>{x.lugarN}</td>
                          <td><span className={'badge ' + (x.estado === 'pagado' ? 'b-ok' : 'b-p')}>{x.estado === 'pagado' ? 'Pagado' : 'Pago pendiente'}</span></td>
                          <td>{x.estado === 'pendiente' && <button className="btn sm" onClick={() => pagar(x.id)}>Marcar pagado</button>}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={5}>Sin folios todavía</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}