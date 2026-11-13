import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
<<<<<<< HEAD
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
=======
import { useSearchParams, Link } from 'react-router-dom'
>>>>>>> origin/main
import { registrarUsuario, iniciarSesion } from '../services/authService.js'

export default function Acceso() {
  const [params] = useSearchParams()
  const { login, toast } = useApp()
<<<<<<< HEAD
  const navigate = useNavigate()
=======
>>>>>>> origin/main

  const role = params.get('rol') || 'cliente'
  const esAdmin = role === 'administrador'

<<<<<<< HEAD
  const destino = {
    cliente: '/cliente',
    propietario: '/propietario',
    administrador: '/administrador'
  }

=======
>>>>>>> origin/main
  const [tab, setTab] = useState('log')
  const [cargando, setCargando] = useState(false)

  const [f, setF] = useState({
    nom: '',
    ape: '',
    tel: '',
    mail: '',
    pass: ''
  })

  const set = (k) => (e) =>
<<<<<<< HEAD
    setF({ ...f, [k]: e.target.value })
=======
    setF((anterior) => ({
      ...anterior,
      [k]: e.target.value
    }))
>>>>>>> origin/main

  useEffect(() => {
    document.title = 'UbiPark | Acceso'
  }, [])

  const auth = async (e) => {
    e.preventDefault()
    setCargando(true)

    const m = f.mail.trim().toLowerCase()

    const idRolTarget =
      role === 'propietario' ? 2 : 1

    try {
      if (tab === 'reg') {

        // No permitir registros de administradores
        if (esAdmin) {
          throw new Error(
            'El registro de administradores no está permitido.'
          )
        }

        if (!f.nom || !f.tel) {
          throw new Error('Completa nombre y teléfono')
        }

        const usuarioCreado = await registrarUsuario({
          mail: m,
          pass: f.pass,
          nombre: f.nom,
          apellidos: f.ape,
          tel: f.tel.replace(/\D/g, ''),
          idRol: idRolTarget
        })

        toast('¡Cuenta creada exitosamente!')
        login(usuarioCreado, role)
<<<<<<< HEAD
        navigate(destino[role] || '/', { replace: true })
=======
>>>>>>> origin/main

      } else {

        const datosSesion = await iniciarSesion({
          mail: m,
          pass: f.pass
        })

        const rolReal = datosSesion.role

        if (rolReal !== role) {
          throw new Error(
            'Tu cuenta no tiene permisos para este tipo de acceso.'
          )
        }

        toast('¡Bienvenido de nuevo!')
        login(datosSesion, rolReal)
<<<<<<< HEAD
        navigate(destino[rolReal] || '/', { replace: true })
=======
>>>>>>> origin/main
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

          <Link
            to="/"
            className="btn sm ghost"
            style={{ display: 'inline-block', marginBottom: 12 }}
          >
            ← Volver al inicio
          </Link>

          <h2>
            {esAdmin
              ? 'Acceso de administrador'
              : role === 'propietario'
                ? 'Acceso de propietarios'
                : 'Acceso de clientes'}
          </h2>

          {!esAdmin && (
            <div className="tabs" style={{ marginTop: 12 }}>
              <button
                type="button"
                className={'btn sm' + (tab === 'log' ? '' : ' ghost')}
                onClick={() => setTab('log')}
              >
                Iniciar sesión
              </button>

              <button
                type="button"
                className={'btn sm' + (tab === 'reg' ? '' : ' ghost')}
                onClick={() => setTab('reg')}
              >
                Crear cuenta
              </button>
            </div>
          )}

          <form onSubmit={auth}>

            {tab === 'reg' && !esAdmin && (
              <div>
                <div className="g2">
                  <div>
                    <label>Nombre(s)</label>
                    <input
                      required
                      value={f.nom}
                      onChange={set('nom')}
                    />
                  </div>

                  <div>
                    <label>Apellidos</label>
                    <input
                      value={f.ape}
                      onChange={set('ape')}
                    />
                  </div>
                </div>

<<<<<<< HEAD
                <label>Teléfono / WhatsApp</label>
=======
                <label>Teléfono</label>
>>>>>>> origin/main
                <input
                  type="tel"
                  required
                  value={f.tel}
                  onChange={set('tel')}
                />
              </div>
            )}

            <label>Correo electrónico</label>
            <input
              type="email"
              required
              value={f.mail}
              onChange={set('mail')}
            />

            <label>Contraseña</label>
            <input
              type="password"
              minLength={4}
              required
              value={f.pass}
              onChange={set('pass')}
            />

            <button
              className="btn"
              style={{ width: '100%', marginTop: 18 }}
              disabled={cargando}
            >
              {cargando ? 'Procesando...' : 'Continuar'}
            </button>

          </form>
        </div>
      </div>
    </div>
  )
<<<<<<< HEAD
}
=======
}
>>>>>>> origin/main
