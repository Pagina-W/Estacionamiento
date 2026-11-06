import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { supabase } from '../lib/supabase.js'
import './Administrador.css'

const secciones = [
  { id: 'dashboard', icono: '▦', titulo: 'Dashboard' },
  { id: 'usuarios', icono: '♙', titulo: 'Usuarios' },
  { id: 'propietarios', icono: '♧', titulo: 'Propietarios' },
  { id: 'estacionamientos', icono: '▣', titulo: 'Estacionamientos' },
  { id: 'reservas', icono: '▤', titulo: 'Reservaciones' },
  { id: 'vehiculos', icono: '🚘', titulo: 'Vehículos' },
  { id: 'ubicaciones', icono: '⌖', titulo: 'Ubicaciones' },
  { id: 'resenas', icono: '★', titulo: 'Reseñas' },
  { id: 'roles', icono: '♙', titulo: 'Roles' },
  { id: 'logs', icono: '◷', titulo: 'Actividad del sistema' },
  { id: 'reportes', icono: '▥', titulo: 'Reportes' },
  { id: 'configuracion', icono: '⚙', titulo: 'Configuración' }
]

const normalizarRelacion = (relacion) => {
  if (Array.isArray(relacion)) return relacion[0] || {}
  return relacion || {}
}

const obtenerRol = (usuario) => {
  return normalizarRelacion(usuario.roles).nombrerol || 'Sin rol'
}

const obtenerCorreo = (usuario) => {
  const credencial = normalizarRelacion(usuario.credenciales)
  return credencial.correo || credencial.usuario || 'Sin correo'
}

const obtenerNombre = (usuario) => {
  if (!usuario) return 'Sin usuario'
  return `${usuario.nombre || ''} ${usuario.apellidos || ''}`.trim() || 'Sin nombre'
}

const formatoFecha = (fecha) => {
  if (!fecha) return 'Sin fecha'
  const valor = new Date(fecha)
  return Number.isNaN(valor.getTime())
    ? fecha
    : valor.toLocaleString('es-MX')
}

const modulos = {
  usuarios: {
    titulo: 'Usuarios',
    descripcion: 'Cuentas registradas y sus roles.',
    tabla: 'usuarios',
    select: `
      idusuario, nombre, apellidos, idcredencial, idrol, fecharegistro,
      credenciales(correo, usuario, telefono),
      roles(nombrerol)
    `,
    columnas: [
      ['idusuario', 'ID'],
      ['nombreCompleto', 'Nombre'],
      ['correo', 'Correo'],
      ['rol', 'Rol'],
      ['fecharegistro', 'Fecha de registro']
    ],
    preparar: (u) => ({
      ...u,
      nombreCompleto: obtenerNombre(u),
      correo: obtenerCorreo(u),
      rol: obtenerRol(u),
      fecharegistro: formatoFecha(u.fecharegistro)
    })
  },

  propietarios: {
    titulo: 'Propietarios',
    descripcion: 'Usuarios que ofrecen estacionamientos.',
    tabla: 'usuarios',
    select: `
      idusuario, nombre, apellidos, idcredencial, idrol, fecharegistro,
      credenciales(correo, telefono),
      roles!usuarios_idrol_fkey(nombrerol)
    `,
    filtro: (u) => obtenerRol(u).toLowerCase() === 'propietario',
    columnas: [
      ['idusuario', 'ID'],
      ['nombreCompleto', 'Propietario'],
      ['correo', 'Correo'],
      ['telefono', 'Teléfono'],
      ['fecharegistro', 'Registro']
    ],
    preparar: (u) => ({
      ...u,
      nombreCompleto: obtenerNombre(u),
      correo: obtenerCorreo(u),
      telefono: normalizarRelacion(u.credenciales).telefono || 'Sin teléfono',
      fecharegistro: formatoFecha(u.fecharegistro)
    })
  },

  estacionamientos: {
    titulo: 'Estacionamientos',
    descripcion: 'Consulta los espacios publicados en UbiPark.',
    tabla: 'estacionamientos',
    select: `
      idestacionamiento, nombreestacionamiento, idusuario, idlocalidad,
      direcciontexto, latitud, longitud, horaapertura, horacierre,
      precioporhora, capacidadtotal, activo, imagen, vehiculospermitidos,
      usuarios!estacionamientos_idusuario_fkey(nombre, apellidos),
      localidad!estacionamientos_idlocalidad_fkey(
        nombrelocalidad,
        municipio!localidad_idmunicipio_fkey(
          nombremunicipio,
          estado!municipio_idestado_fkey(nombreestado)
        )
      )
    `,
    columnas: [
      ['idestacionamiento', 'ID'],
      ['nombreestacionamiento', 'Estacionamiento'],
      ['propietario', 'Propietario'],
      ['direcciontexto', 'Dirección'],
      ['precioporhora', 'Precio por hora'],
      ['capacidadtotal', 'Capacidad'],
      ['estadoTexto', 'Estado']
    ],
    preparar: (e) => ({
      ...e,
      propietario: obtenerNombre(normalizarRelacion(e.usuarios)),
      estadoTexto: e.activo ? 'Activo' : 'Inactivo',
      precioporhora: `$${Number(e.precioporhora || 0).toFixed(2)}`
    })
  },

  reservas: {
    titulo: 'Reservaciones',
    descripcion: 'Supervisa las reservaciones de estacionamientos.',
    tabla: 'reservas',
    select: `
      idreserva, idestacionamiento, idusuario, idvehiculo,
      fechaentrada, fechasalida, montototal, estadoreserva, fechacreacion,
      usuarios!reservas_idusuario_fkey(nombre, apellidos),
      estacionamientos!reservas_idestacionamiento_fkey(nombreestacionamiento),
      vehiculos!reservas_idvehiculo_fkey(placa, descripcion)
    `,
    columnas: [
      ['idreserva', 'ID'],
      ['cliente', 'Cliente'],
      ['estacionamiento', 'Estacionamiento'],
      ['placa', 'Vehículo'],
      ['fechaentrada', 'Entrada'],
      ['fechasalida', 'Salida'],
      ['montototal', 'Total'],
      ['estadoreserva', 'Estado']
    ],
    preparar: (r) => ({
      ...r,
      cliente: obtenerNombre(normalizarRelacion(r.usuarios)),
      estacionamiento: normalizarRelacion(r.estacionamientos).nombreestacionamiento || 'Sin estacionamiento',
      placa: normalizarRelacion(r.vehiculos).placa || 'Sin vehículo',
      fechaentrada: formatoFecha(r.fechaentrada),
      fechasalida: formatoFecha(r.fechasalida),
      montototal: `$${Number(r.montototal || 0).toFixed(2)}`
    })
  },

  vehiculos: {
    titulo: 'Vehículos',
    descripcion: 'Vehículos registrados por los usuarios.',
    tabla: 'vehiculos',
    select: `
      idvehiculo, idusuario, idtipovehiculo, placa, descripcion,
      usuarios!vehiculos_idusuario_fkey(nombre, apellidos),
      tipovehiculo!vehiculos_idtipovehiculo_fkey(nombretipo)
    `,
    columnas: [
      ['idvehiculo', 'ID'],
      ['placa', 'Placa'],
      ['descripcion', 'Descripción'],
      ['propietario', 'Usuario'],
      ['tipo', 'Tipo de vehículo']
    ],
    preparar: (v) => ({
      ...v,
      propietario: obtenerNombre(normalizarRelacion(v.usuarios)),
      tipo: normalizarRelacion(v.tipovehiculo).nombretipo || 'Sin tipo'
    })
  },

  ubicaciones: {
    titulo: 'Ubicaciones',
    descripcion: 'Catálogo de estados, municipios y localidades.',
    tabla: 'localidad',
    select: `
      idlocalidad, nombrelocalidad, idmunicipio,
      municipio!localidad_idmunicipio_fkey(
        nombremunicipio,
        estado!municipio_idestado_fkey(nombreestado)
      )
    `,
    columnas: [
      ['idlocalidad', 'ID'],
      ['nombrelocalidad', 'Localidad'],
      ['municipioTexto', 'Municipio'],
      ['estadoTexto', 'Estado']
    ],
    preparar: (l) => {
      const municipio = normalizarRelacion(l.municipio)
      return {
        ...l,
        municipioTexto: municipio.nombremunicipio || 'Sin municipio',
        estadoTexto: normalizarRelacion(municipio.estado).nombreestado || 'Sin estado'
      }
    }
  },

  resenas: {
    titulo: 'Reseñas',
    descripcion: 'Opiniones y calificaciones de los usuarios.',
    tabla: 'resenas',
    select: `
      idresena, idestacionamiento, idusuario, calificacion, comentario, fecha,
      usuarios!resenas_idusuario_fkey(nombre, apellidos),
      estacionamientos!resenas_idestacionamiento_fkey(nombreestacionamiento)
    `,
    columnas: [
      ['idresena', 'ID'],
      ['cliente', 'Usuario'],
      ['estacionamiento', 'Estacionamiento'],
      ['calificacion', 'Calificación'],
      ['comentario', 'Comentario'],
      ['fecha', 'Fecha']
    ],
    preparar: (r) => ({
      ...r,
      cliente: obtenerNombre(normalizarRelacion(r.usuarios)),
      estacionamiento: normalizarRelacion(r.estacionamientos).nombreestacionamiento || 'Sin estacionamiento',
      calificacion: `${r.calificacion} / 5`,
      fecha: formatoFecha(r.fecha)
    })
  },

  roles: {
    titulo: 'Roles',
    descripcion: 'Roles disponibles en la plataforma.',
    tabla: 'roles',
    select: 'idrol, nombrerol',
    columnas: [
      ['idrol', 'ID'],
      ['nombrerol', 'Nombre del rol']
    ]
  },

  logs: {
    titulo: 'Actividad del sistema',
    descripcion: 'Registro de acciones realizadas en UbiPark.',
    tabla: 'logs',
    select: `
      idlog, idusuario, accion, detalle, fechahora,
      usuarios!logs_idusuario_fkey(nombre, apellidos)
    `,
    columnas: [
      ['idlog', 'ID'],
      ['usuarioTexto', 'Usuario'],
      ['accion', 'Acción'],
      ['detalle', 'Detalle'],
      ['fechahora', 'Fecha y hora']
    ],
    preparar: (l) => ({
      ...l,
      usuarioTexto: l.usuarios ? obtenerNombre(normalizarRelacion(l.usuarios)) : 'Sistema',
      fechahora: formatoFecha(l.fechahora)
    })
  },

  reportes: {
    titulo: 'Reportes',
    descripcion: 'Resumen de las operaciones de UbiPark.',
    especial: true
  },

  configuracion: {
    titulo: 'Configuración',
    descripcion: 'Información general de los catálogos del sistema.',
    especial: true
  }
}

const tablasDashboard = [
  ['usuarios', 'Usuarios'],
  ['estacionamientos', 'Estacionamientos'],
  ['reservas', 'Reservaciones'],
  ['vehiculos', 'Vehículos'],
  ['resenas', 'Reseñas'],
  ['localidad', 'Localidades'],
  ['municipio', 'Municipios'],
  ['estado', 'Estados']
]

export default function Administrador() {
  const navigate = useNavigate()
  const { ses, salir } = useApp()

  const [seccionActiva, setSeccionActiva] = useState('dashboard')
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [registros, setRegistros] = useState([])
  const [estadisticas, setEstadisticas] = useState({})
  const [busqueda, setBusqueda] = useState('')
  const [registroSeleccionado, setRegistroSeleccionado] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [cargandoDashboard, setCargandoDashboard] = useState(true)
  const [error, setError] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')

  const nombre = ses?.nombre || 'Administrador'

  const slides = [
    {
      etiqueta: 'UBIPARK · ESTACIONAMIENTOS',
      titulo: 'Encuentra tu lugar ideal para estacionarte',
      descripcion: 'Consulta espacios disponibles, conoce sus características y administra tus reservaciones desde una sola plataforma.',
      imagen: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=1600&q=85',
      boton: 'Ver estacionamientos',
      seccion: 'estacionamientos'
    },
    {
      etiqueta: 'GESTIÓN INTELIGENTE',
      titulo: 'Todo el control de UbiPark en un solo lugar',
      descripcion: 'Supervisa usuarios, propietarios, vehículos y reservaciones de manera sencilla y organizada.',
      imagen: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1600&q=85',
      boton: 'Administrar usuarios',
      seccion: 'usuarios'
    },
    {
      etiqueta: 'RESERVA · ORGANIZA · AVANZA',
      titulo: 'Una mejor experiencia de estacionamiento',
      descripcion: 'Mantén la información de la plataforma actualizada y consulta los datos registrados en tiempo real.',
      imagen: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1600&q=85',
      boton: 'Ver reservaciones',
      seccion: 'reservas'
    }
  ]

  const [slideActivo, setSlideActivo] = useState(0)

  const siguienteSlide = () => {
    setSlideActivo((actual) => (actual + 1) % slides.length)
  }

  const anteriorSlide = () => {
    setSlideActivo((actual) => (actual - 1 + slides.length) % slides.length)
  }

  useEffect(() => {
    const intervalo = setInterval(() => {
      setSlideActivo((actual) => (actual + 1) % 3)
    }, 5000)

    return () => clearInterval(intervalo)
  }, [])

  useEffect(() => {
    document.title = 'UbiPark | Administrador'

    if (!ses || ses.role !== 'administrador') {
      navigate('/acceso?rol=administrador', { replace: true })
    }
  }, [ses, navigate])

  const cargarDashboard = useCallback(async () => {
    if (!ses || ses.role !== 'administrador') return

    setCargandoDashboard(true)

    try {
      const resultados = await Promise.all(
        tablasDashboard.map(async ([tabla]) => {
          const { count, error } = await supabase
            .from(tabla)
            .select('*', { count: 'exact', head: true })

          if (error) throw new Error(`${tabla}: ${error.message}`)
          return [tabla, count || 0]
        })
      )

      setEstadisticas(Object.fromEntries(resultados))
    } catch (err) {
      console.error('Error en estadísticas:', err)
      setError(err.message || 'No se pudieron cargar las estadísticas.')
    } finally {
      setCargandoDashboard(false)
    }
  }, [ses])

  const cargarModulo = useCallback(async (id) => {
    const modulo = modulos[id]
    if (!modulo || modulo.especial) return

    setCargando(true)
    setError('')
    setRegistros([])

    try {
      let consulta = supabase
        .from(modulo.tabla)
        .select(modulo.select)

      if (id === 'usuarios' || id === 'propietarios') {
        consulta = consulta.order('idusuario', { ascending: true })
      } else if (id === 'estacionamientos') {
        consulta = consulta.order('idestacionamiento', { ascending: true })
      } else if (id === 'reservas') {
        consulta = consulta.order('fechacreacion', { ascending: false })
      } else if (id === 'vehiculos') {
        consulta = consulta.order('idvehiculo', { ascending: true })
      } else if (id === 'ubicaciones') {
        consulta = consulta.order('idlocalidad', { ascending: true })
      } else if (id === 'resenas') {
        consulta = consulta.order('fecha', { ascending: false })
      } else if (id === 'roles') {
        consulta = consulta.order('idrol', { ascending: true })
      } else if (id === 'logs') {
        consulta = consulta.order('fechahora', { ascending: false })
      }

      const { data, error } = await consulta
      if (error) throw error

      let lista = data || []

      if (modulo.filtro) {
        lista = lista.filter(modulo.filtro)
      }

      if (modulo.preparar) {
        lista = lista.map(modulo.preparar)
      }

      setRegistros(lista)
    } catch (err) {
      console.error(`Error al cargar ${id}:`, err)
      setError(err.message || 'No se pudieron cargar los registros.')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    if (!ses || ses.role !== 'administrador') return
    cargarDashboard()
  }, [ses, cargarDashboard])

  useEffect(() => {
    if (!ses || ses.role !== 'administrador') return
    if (modulos[seccionActiva] && !modulos[seccionActiva].especial) {
      cargarModulo(seccionActiva)
    }
  }, [seccionActiva, ses, cargarModulo])

  useEffect(() => {
    if (!ses || ses.role !== 'administrador') return

    const canal = supabase
      .channel('ubipark-admin-cambios')
      .on('postgres_changes', {
        event: '*',
        schema: 'public'
      }, () => {
        cargarDashboard()
        if (modulos[seccionActiva] && !modulos[seccionActiva].especial) {
          cargarModulo(seccionActiva)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(canal)
    }
  }, [ses, seccionActiva, cargarDashboard, cargarModulo])

  if (!ses || ses.role !== 'administrador') return null

  const abrirSeccion = (id) => {
    setSeccionActiva(id)
    setMenuAbierto(false)
    setBusqueda('')
    setRegistroSeleccionado(null)
    setError('')
  }

  const moduloActual = modulos[seccionActiva]

  const registrosFiltrados = registros.filter((registro) => {
    const texto = busqueda.trim().toLowerCase()

    const coincideTexto = !texto || Object.entries(registro).some(([clave, valor]) => {
      if (['usuarios', 'roles', 'credenciales', 'estacionamientos', 'vehiculos', 'localidad', 'municipio', 'estado', 'tipovehiculo'].includes(clave)) {
        return false
      }
      return String(valor ?? '').toLowerCase().includes(texto)
    })

    let coincideEstado = true
    if (seccionActiva === 'estacionamientos' && filtroEstado !== 'todos') {
      coincideEstado = filtroEstado === 'activos'
        ? registro.activo === true
        : registro.activo === false
    }

    return coincideTexto && coincideEstado
  })

  const refrescar = () => {
    if (seccionActiva === 'dashboard') {
      cargarDashboard()
    } else {
      cargarModulo(seccionActiva)
    }
  }

  const estiloTabla = {
    width: '100%',
    minWidth: '760px',
    borderCollapse: 'collapse',
    fontSize: '13px'
  }

  const estiloCelda = {
    padding: '13px 15px',
    textAlign: 'left',
    borderBottom: '1px solid #e8edf5',
    color: '#344054',
    verticalAlign: 'middle'
  }

  const tarjetas = [
    ['usuarios', 'Usuarios registrados', '♙', 'blue'],
    ['estacionamientos', 'Estacionamientos', '▣', 'purple'],
    ['reservas', 'Reservaciones', '▤', 'green'],
    ['vehiculos', 'Vehículos', '🚘', 'orange'],
    ['resenas', 'Reseñas', '★', 'purple'],
    ['localidad', 'Localidades', '⌖', 'blue'],
    ['municipio', 'Municipios', '⌖', 'green'],
    ['estado', 'Estados', '▧', 'orange']
  ]

  return (
    <div className="admin-layout">
      <aside className={`admin-sidebar ${menuAbierto ? 'admin-sidebar-open' : ''}`}>
        <div className="admin-brand">
          <div className="admin-brand-icon">U</div>
          <div>
            <h2>UbiPark</h2>
            <span>Panel administrativo</span>
          </div>
        </div>

        <div className="admin-menu-label">MENÚ PRINCIPAL</div>

        <nav className="admin-nav">
          {secciones.map((item) => (
            <button
              key={item.id}
              className={`admin-nav-item ${seccionActiva === item.id ? 'active' : ''}`}
              onClick={() => abrirSeccion(item.id)}
            >
              <span className="admin-nav-icon">{item.icono}</span>
              {item.titulo}
              {seccionActiva === item.id && <span className="admin-nav-indicator" />}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-bottom">
          <div className="admin-profile">
            <div className="admin-avatar">{nombre.charAt(0).toUpperCase()}</div>
            <div className="admin-profile-info">
              <strong>{nombre}</strong>
              <span>Administrador</span>
            </div>
          </div>

          <button className="admin-logout" onClick={salir}>
            <span>↪</span> Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <button
            className="admin-mobile-menu"
            onClick={() => setMenuAbierto(!menuAbierto)}
            aria-label="Abrir menú"
          >
            ☰
          </button>

          <div>
            <span className="admin-breadcrumb">UbiPark / Administración</span>
            <h2>
              {seccionActiva === 'dashboard'
                ? 'Dashboard'
                : moduloActual?.titulo || 'Administración'}
            </h2>
          </div>

          <div className="admin-topbar-right">
            <div className="admin-status">
              <span className="admin-status-dot" />
              Sistema activo
            </div>
            <div className="admin-top-avatar">{nombre.charAt(0).toUpperCase()}</div>
          </div>
        </header>

        <div className="admin-content">
          {seccionActiva === 'dashboard' ? (
            <>
              <section className="admin-carousel" aria-label="Carrusel informativo de UbiPark">
                {slides.map((slide, indice) => (
                  <div
                    key={indice}
                    className={`admin-slide ${slideActivo === indice ? 'admin-slide-active' : ''}`}
                    aria-hidden={slideActivo !== indice}
                  >
                    <img
                      className="admin-slide-image"
                      src={slide.imagen}
                      alt={slide.titulo}
                    />
                    <div className="admin-slide-overlay" />
                    <div className="admin-slide-content">
                      <span className="admin-slide-tag">{slide.etiqueta}</span>
                      <h1>{slide.titulo}</h1>
                      <p>{slide.descripcion}</p>
                      <button
                        className="admin-slide-button"
                        onClick={() => abrirSeccion(slide.seccion)}
                      >
                        {slide.boton} <span>→</span>
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  className="admin-carousel-arrow admin-carousel-prev"
                  onClick={anteriorSlide}
                  aria-label="Diapositiva anterior"
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="admin-carousel-arrow admin-carousel-next"
                  onClick={siguienteSlide}
                  aria-label="Diapositiva siguiente"
                >
                  ›
                </button>
                <div className="admin-carousel-dots">
                  {slides.map((slide, indice) => (
                    <button
                      key={indice}
                      type="button"
                      className={`admin-carousel-dot ${slideActivo === indice ? 'active' : ''}`}
                      onClick={() => setSlideActivo(indice)}
                      aria-label={`Ir a la diapositiva ${indice + 1}`}
                      aria-current={slideActivo === indice ? 'true' : undefined}
                    />
                  ))}
                </div>
              </section>

              <section className="admin-welcome">
                <div>
                  <span className="admin-welcome-tag">CENTRO DE CONTROL</span>
                  <h1>¡Bienvenido, {nombre}!</h1>
                  <p>Desde aquí puedes administrar y supervisar las operaciones de UbiPark.</p>
                </div>
                <div className="admin-welcome-icon">⌖</div>
              </section>

              <div className="admin-section-heading">
                <div>
                  <h3>Resumen general</h3>
                  <p>Información consultada directamente desde Supabase</p>
                </div>
                <button className="admin-back-button" onClick={cargarDashboard} disabled={cargandoDashboard}>
                  {cargandoDashboard ? 'Actualizando...' : '↻ Actualizar'}
                </button>
              </div>

              <section className="admin-stats">
                {tarjetas.map(([tabla, titulo, icono, color]) => (
                  <div className="admin-stat-card" key={tabla}>
                    <div className={`admin-stat-icon ${color}`}>{icono}</div>
                    <div>
                      <span>{titulo}</span>
                      <strong>{cargandoDashboard ? '...' : (estadisticas[tabla] ?? 0)}</strong>
                      <small>Registros en la base de datos</small>
                    </div>
                  </div>
                ))}
              </section>

              {error && <p className="admin-error">{error}</p>}

              <section className="admin-system-panel">
                <div className="admin-system-header">
                  <div>
                    <span className="admin-system-tag">CENTRO DE ADMINISTRACIÓN</span>
                    <h3>Administración del sistema</h3>
                    <p>Gestiona y supervisa todos los módulos de UbiPark desde un solo lugar.</p>
                  </div>

                  <div className="admin-system-total">
                    <span>Estado de la plataforma</span>
                    <strong>
                      <i className="admin-system-online"></i>
                      Operativo
                    </strong>
                  </div>
                </div>

                <div className="admin-system-toolbar">
                  <div>
                    <h4>Módulos disponibles</h4>
                    <span>Selecciona una opción para administrar sus registros.</span>
                  </div>
                  <span className="admin-system-counter">
                    {secciones.length - 1} módulos
                  </span>
                </div>

                <section className="admin-system-grid">
                  {secciones.slice(1).map((item) => {
                    const cantidades = {
                      usuarios: estadisticas.usuarios,
                      estacionamientos: estadisticas.estacionamientos,
                      reservas: estadisticas.reservas,
                      vehiculos: estadisticas.vehiculos,
                      ubicaciones: estadisticas.localidad,
                      resenas: estadisticas.resenas
                    }

                    const descripciones = {
                      usuarios: 'Consulta y administra las cuentas registradas.',
                      propietarios: 'Supervisa a los propietarios de estacionamientos.',
                      estacionamientos: 'Gestiona los espacios de estacionamiento.',
                      reservas: 'Consulta y supervisa las reservaciones.',
                      vehiculos: 'Administra los vehículos registrados.',
                      ubicaciones: 'Consulta localidades y municipios.',
                      resenas: 'Revisa opiniones y calificaciones.',
                      roles: 'Consulta los permisos y roles disponibles.',
                      logs: 'Supervisa los movimientos de la plataforma.',
                      reportes: 'Consulta los reportes generales.',
                      configuracion: 'Administra los catálogos del sistema.'
                    }

                    const cantidad = cantidades[item.id]

                    return (
                      <button
                        key={item.id}
                        className={`admin-system-card admin-system-${item.id}`}
                        onClick={() => abrirSeccion(item.id)}
                      >
                        <div className="admin-system-card-top">
                          <div className="admin-system-icon">
                            {item.icono}
                          </div>
                          <span className="admin-system-arrow">↗</span>
                        </div>

                        <div className="admin-system-card-info">
                          <h4>{item.titulo}</h4>
                          <p>{descripciones[item.id]}</p>
                        </div>

                        <div className="admin-system-card-bottom">
                          <span>
                            {cantidad !== undefined
                              ? `${cargandoDashboard ? '...' : cantidad} registros`
                              : 'Consultar módulo'}
                          </span>
                          <span className="admin-system-access">
                            Acceder →
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </section>

                <div className="admin-system-footer">
                  <span>UbiPark · Panel de control administrativo</span>
                  <span>Gestión centralizada de la plataforma</span>
                </div>
              </section>
            </>
          ) : seccionActiva === 'reportes' ? (
            <section>
              <div className="admin-section-heading">
                <div>
                  <h3>Reportes generales</h3>
                  <p>Resumen de los datos almacenados en UbiPark.</p>
                </div>
                <button className="admin-back-button" onClick={cargarDashboard}>↻ Actualizar</button>
              </div>
              <section className="admin-stats">
                {tarjetas.map(([tabla, titulo, icono, color]) => (
                  <div className="admin-stat-card" key={tabla}>
                    <div className={`admin-stat-icon ${color}`}>{icono}</div>
                    <div>
                      <span>{titulo}</span>
                      <strong>{cargandoDashboard ? '...' : (estadisticas[tabla] ?? 0)}</strong>
                      <small>Total registrado</small>
                    </div>
                  </div>
                ))}
              </section>
            </section>
          ) : seccionActiva === 'configuracion' ? (
            <section className="admin-placeholder">
              <div className="admin-placeholder-icon">⚙</div>
              <h1>Configuración de UbiPark</h1>
              <p>Consulta los catálogos generales de la plataforma.</p>
              <div className="admin-modules">
                <button className="admin-module-card" onClick={() => abrirSeccion('roles')}>
                  <span className="admin-module-icon">♙</span>
                  <span className="admin-module-title">Administrar roles</span>
                  <span className="admin-module-arrow">→</span>
                </button>
                <button className="admin-module-card" onClick={() => abrirSeccion('ubicaciones')}>
                  <span className="admin-module-icon">⌖</span>
                  <span className="admin-module-title">Consultar ubicaciones</span>
                  <span className="admin-module-arrow">→</span>
                </button>
              </div>
            </section>
          ) : (
            <section>
              <div className="admin-section-heading">
                <div>
                  <h3>{moduloActual?.titulo}</h3>
                  <p>{moduloActual?.descripcion}</p>
                </div>
                <button className="admin-back-button" onClick={refrescar} disabled={cargando}>
                  {cargando ? 'Cargando...' : '↻ Actualizar'}
                </button>
              </div>

              <div style={{
                display: 'flex',
                gap: 12,
                flexWrap: 'wrap',
                margin: '20px 0'
              }}>
                <input
                  type="search"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar en los registros..."
                  style={{
                    flex: '1 1 250px',
                    padding: '12px 14px',
                    border: '1px solid #dbe3ef',
                    borderRadius: 10,
                    outlineColor: '#1688e8'
                  }}
                />

                {seccionActiva === 'estacionamientos' && (
                  <select
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    style={{
                      padding: '12px 14px',
                      border: '1px solid #dbe3ef',
                      borderRadius: 10,
                      background: 'white'
                    }}
                  >
                    <option value="todos">Todos los estacionamientos</option>
                    <option value="activos">Activos</option>
                    <option value="inactivos">Inactivos</option>
                  </select>
                )}
              </div>

              <div style={{
                background: 'white',
                border: '1px solid #e5eaf2',
                borderRadius: 14,
                overflowX: 'auto',
                boxShadow: '0 4px 18px rgba(20, 50, 90, 0.04)'
              }}>
                <table style={estiloTabla}>
                  <thead>
                    <tr style={{ background: '#f5f8fc' }}>
                      {[
                        ...(moduloActual?.columnas || []).map((col) => col[1]),
                        'Acciones'
                      ].map((titulo) => (
                        <th key={titulo} style={{
                          ...estiloCelda,
                          color: '#667085',
                          fontWeight: 700
                        }}>
                          {titulo}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {cargando ? (
                      <tr>
                        <td colSpan={(moduloActual?.columnas?.length || 1) + 1} style={{ ...estiloCelda, textAlign: 'center' }}>
                          Consultando información de Supabase...
                        </td>
                      </tr>
                    ) : error ? (
                      <tr>
                        <td colSpan={(moduloActual?.columnas?.length || 1) + 1} style={{ ...estiloCelda, textAlign: 'center', color: '#c0392b' }}>
                          {error}
                        </td>
                      </tr>
                    ) : registrosFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={(moduloActual?.columnas?.length || 1) + 1} style={{ ...estiloCelda, textAlign: 'center' }}>
                          No se encontraron registros.
                        </td>
                      </tr>
                    ) : (
                      registrosFiltrados.map((registro, indice) => (
                        <tr key={registro.idusuario || registro.idestacionamiento || registro.idreserva || registro.idvehiculo || registro.idlocalidad || registro.idresena || registro.idrol || registro.idlog || indice}>
                          {(moduloActual?.columnas || []).map(([campo]) => (
                            <td key={campo} style={estiloCelda}>
                              {campo === 'activo' || campo === 'estadoTexto' ? (
                                <span style={{
                                  color: registro.activo === false || registro.estadoTexto === 'Inactivo' ? '#c0392b' : '#16834a',
                                  fontWeight: 700
                                }}>
                                  {registro[campo] === false ? 'Inactivo' : registro[campo]}
                                </span>
                              ) : (
                                String(registro[campo] ?? '—')
                              )}
                            </td>
                          ))}
                          <td style={estiloCelda}>
                            <button
                              onClick={() => setRegistroSeleccionado(registro)}
                              style={{
                                border: 'none',
                                borderRadius: 8,
                                padding: '8px 12px',
                                background: '#eaf3ff',
                                color: '#1769aa',
                                cursor: 'pointer',
                                fontWeight: 600
                              }}
                            >
                              Ver detalles
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <p style={{ color: '#7b8798', fontSize: 13, marginTop: 12 }}>
                Mostrando {registrosFiltrados.length} de {registros.length} registros.
              </p>
            </section>
          )}

          {registroSeleccionado && (
            <div
              onClick={() => setRegistroSeleccionado(null)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(12, 27, 48, 0.55)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 20,
                zIndex: 1000
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '100%',
                  maxWidth: 520,
                  maxHeight: '85vh',
                  overflowY: 'auto',
                  background: 'white',
                  borderRadius: 16,
                  padding: 25,
                  boxShadow: '0 20px 60px rgba(0,0,0,.2)'
                }}
              >
                <h2 style={{ marginTop: 0, color: '#16365c' }}>Detalles del registro</h2>

                {Object.entries(registroSeleccionado)
                  .filter(([clave]) => ![
                    'usuarios', 'roles', 'credenciales', 'estacionamientos',
                    'vehiculos', 'localidad', 'municipio', 'estado', 'tipovehiculo',
                    'imagen'
                  ].includes(clave))
                  .map(([clave, valor]) => (
                    <p key={clave} style={{ overflowWrap: 'anywhere' }}>
                      <strong>{clave}:</strong> {String(valor ?? 'Sin información')}
                    </p>
                  ))}

                <button
                  className="admin-back-button"
                  onClick={() => setRegistroSeleccionado(null)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}

          <footer className="admin-footer">
            © 2026 UbiPark · Sistema de administración
          </footer>
        </div>
      </main>
    </div>
  )
}