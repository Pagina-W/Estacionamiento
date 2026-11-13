import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import TarjetaQR from '../components/tarjetaQR.jsx'
import { obtenerIdUsuario } from '../lib/idusuario.js'
import { obtenerReservasCliente } from '../services/reservaService.js'

/* Ruta sugerida: /mis-reservas  (tu QR siempre accesible) */
export default function MisReservas() {
  const { ses, entrar, toast, user } = useApp()
  const idUsuario = obtenerIdUsuario(user, ses)
  const [rs, setRs] = useState([])
  const [cargando, setCargando] = useState(true)
  const ok = ses && ses.role === 'cliente'

  const cargar = async () => {
    try { setRs(await obtenerReservasCliente(idUsuario)) } catch (e) { toast(e.message) } finally { setCargando(false) }
  }

  useEffect(() => {
    document.title = 'UbiPark | Mis reservas'
    if (!ok) return entrar('cliente')
    if (idUsuario) {
      cargar()
      const t = setInterval(cargar, 10000)
      return () => clearInterval(t)
    }
  }, [ses, idUsuario])

  if (!ok) return null

  return (
    <div className="view on"><div className="wrap">
      <p style={{ marginTop: 20 }}><Link to="/cliente" style={{ color: 'var(--blue)', fontWeight: 600 }}>← Volver a lugares</Link></p>
      <h2 className="title" style={{ marginTop: 12 }}>Mis reservas</h2>
      {cargando ? <p className="sub">Cargando…</p> : rs.length === 0 ? <p className="sub">Aún no tienes reservas.</p> : (
        <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', margin: '16px 0 28px' }}>
          {rs.map((r) => <div className="box" key={r.idreserva}><TarjetaQR r={r} /></div>)}
        </div>
      )}
    </div></div>
  )
}
