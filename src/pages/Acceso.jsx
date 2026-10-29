import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { useSearchParams, Link } from 'react-router-dom'
import { registrarUsuario, iniciarSesion } from '../services/authService.js'

/* Inicio de sesión y registro de cliente y propietario de mientras */
export default function Acceso() {
  const [params] = useSearchParams()
  const { login, toast } = useApp()
  const role = params.get('rol') === 'propietario' ? 'propietario' : 'cliente'
  const [tab, setTab] = useState('log')
  const [cargando, setCargando] = useState(false)
  const [f, setF] = useState({ nom: '', ape: '', tel: '', mail: '', pass: '' })
  
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  useEffect(() => { 
    document.title = 'GoParking | Acceso' 
  }, [])

  const auth = async (e) => {
    e.preventDefault()
    setCargando(true)

    const m = f.mail.trim().toLowerCase()
    const idRolTarget = role === 'propietario' ? 2 : 1

    try {
      if (tab === 'reg') {
        if (!f.nom || !f.tel) {
          setCargando(false)
          return toast('Completa nombre y teléfono')
        }

        // Registro en las tablas credenciales y usuarios
        const usuarioCreado = await registrarUsuario({
          mail: m,
          pass: f.pass,
          nombre: f.nom,
          apellidos: f.ape,
          tel: f.tel.replace(/\D/g, ''),
          idRol: idRolTarget,
        })

        toast('¡Cuenta creada exitosamente!')
        login(usuarioCreado, role)
      } else {
        // Inicio de sesión cbasandose en credenciales
        const datosSesion = await iniciarSesion({
          mail: m,
          pass: f.pass,
        })

        toast('¡Bienvenido de nuevo!')
        const perfilUsuario = datosSesion.usuarios?.[0] || datosSesion.usuarios || datosSesion
        login(perfilUsuario, role)
      }
    } catch (error) {
      toast(error.message || 'Ocurrió un error al autenticar')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="view on">
      <div className="wrap">
        <div className="box narrow">
          <Link to="/" className="btn sm ghost" style={{ display: 'inline-block', marginBottom: 12 }}>
            ← Volver al inicio
          </Link>
          <h2>{role === 'cliente' ? 'Acceso de clientes' : 'Acceso de propietarios'}</h2>
          
          <div className="tabs" style={{ marginTop: 12 }}>
            <button 
              className={'btn sm' + (tab === 'log' ? '' : ' ghost')} 
              onClick={() => setTab('log')}
            >
              Iniciar sesión
            </button>
            <button 
              className={'btn sm' + (tab === 'reg' ? '' : ' ghost')} 
              onClick={() => setTab('reg')}
            >
              Crear cuenta
            </button>
          </div>

          <form onSubmit={auth}>
            {tab === 'reg' && (
              <div>
                <div className="g2">
                  <div><label>Nombre(s)</label><input required value={f.nom} onChange={set('nom')} /></div>
                  <div><label>Apellidos</label><input value={f.ape} onChange={set('ape')} /></div>
                </div>
                <label>Teléfono / WhatsApp (con lada, ej. 5217711234567)</label>
                <input type="tel" required value={f.tel} onChange={set('tel')} />
              </div>
            )}
            
            <label>Correo</label>
            <input type="email" required value={f.mail} onChange={set('mail')} />
            
            <label>Contraseña</label>
            <input type="password" minLength={4} required value={f.pass} onChange={set('pass')} />
            
            <button className="btn" style={{ width: '100%', marginTop: 18 }} disabled={cargando}>
              {cargando ? 'Procesando...' : 'Continuar'}
            </button>
          </form>

        </div>
      </div>
    </div>
  )
}