import { useEffect, useState } from 'react'
import { DB } from '../lib/db.js'
import { useApp } from '../context/AppContext.jsx'
import { useSearchParams, Link } from 'react-router-dom'

/* ACCESO: inicio de sesión y registro (cliente / propietario) */
export default function Acceso() {
  const [params] = useSearchParams()
  const { login, toast } = useApp()
  const role = params.get('rol') === 'propietario' ? 'propietario' : 'cliente'
  const [tab, setTab] = useState('log')
  const [f, setF] = useState({ nom: '', ape: '', tel: '', mail: '', pass: '' })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  useEffect(() => { document.title = 'GoParking | Acceso' }, [])

  const auth = (e) => {
    e.preventDefault()
    const k = role === 'cliente' ? 'clientes' : 'props'
    const u = DB.get(k, [])
    const m = f.mail.trim().toLowerCase()
    if (tab === 'reg') {
      if (u.find((x) => x.mail === m)) return toast('Ese correo ya existe')
      if (!f.nom || !f.tel) return toast('Completa nombre y teléfono')
      const n = { id: 'u' + Date.now(), mail: m, pass: f.pass, nombre: f.nom + ' ' + f.ape, tel: f.tel.replace(/\D/g, '') }
      u.push(n)
      DB.set(k, u)
      login(n, role)
    } else {
      const n = u.find((x) => x.mail === m && x.pass === f.pass)
      if (!n) return toast('Correo o contraseña incorrectos')
      login(n, role)
    }
  }

  return (
    
    <div className="view on"><div className="wrap"><div className="box narrow">
      <Link to="/" className="btn sm ghost" style={{ display: 'inline-block', marginBottom: 12 }}>
  ← Volver al inicio
</Link>
      <h2>{role === 'cliente' ? 'Acceso de clientes' : 'Acceso de propietarios'}</h2>
      <div className="tabs" style={{ marginTop: 12 }}>
        <button className={'btn sm' + (tab === 'log' ? '' : ' ghost')} onClick={() => setTab('log')}>Iniciar sesión</button>
        <button className={'btn sm' + (tab === 'reg' ? '' : ' ghost')} onClick={() => setTab('reg')}>Crear cuenta</button>
      </div>
      <form onSubmit={auth}>
        {tab === 'reg' && (
          <div>
            <div className="g2">
              <div><label>Nombre(s)</label><input value={f.nom} onChange={set('nom')} /></div>
              <div><label>Apellidos</label><input value={f.ape} onChange={set('ape')} /></div>
            </div>
            <label>Teléfono / WhatsApp (con lada, ej. 5217711234567)</label><input type="tel" value={f.tel} onChange={set('tel')} />
          </div>
        )}
        <label>Correo</label><input type="email" required value={f.mail} onChange={set('mail')} />
        <label>Contraseña</label><input type="password" minLength={4} required value={f.pass} onChange={set('pass')} />
        <button className="btn" style={{ width: '100%', marginTop: 18 }}>Continuar</button>
      </form>
      <p className="sub" style={{ fontSize: '.78rem', margin: '12px 0 0' }}>Los clientes y propietarios se guardan por separado (en esta versión, en tu navegador).</p>
    </div></div></div>
  )
}


