import { supabase } from '../lib/supabase.js'

const falla = (error) => { if (error) throw new Error(error.message) }
const lista = (t) => (Array.isArray(t) ? t : String(t || '').split(',').map((x) => x.trim()).filter(Boolean))
const hhmm = (t) => (t ? String(t).slice(0, 5) : '')

/* Convierte una fila de la vista "estacionamientos_disponibilidad" (lo que guardó el propietario
   + disponibilidad + estrellas + WhatsApp del dueño) al formato de las vistas del cliente. */
export const mapear = (e) => {
  const libres = Number(e.libres ?? e.capacidadtotal ?? 0)
  const disponible = !!e.activo && libres > 0
  return {
    id: e.idestacionamiento,
    nombre: e.nombreestacionamiento,
    owner: e.idusuario,
    dir: e.direcciontexto || '',
    lat: e.latitud != null ? Number(e.latitud) : null,
    lng: e.longitud != null ? Number(e.longitud) : null,
    pph: Number(e.precioporhora) || 0,
    cap: e.capacidadtotal ?? 0,
    apertura: hhmm(e.horaapertura),
    cierre: hhmm(e.horacierre),
    hor: e.horaapertura ? `${hhmm(e.horaapertura)} - ${hhmm(e.horacierre)}` : '',
    imagen: e.imagen || null,
    fotos: e.fotos?.length ? e.fotos : e.imagen ? [e.imagen] : [],
    tipos: lista(e.vehiculospermitidos),
    extras: lista(e.caracteristicas),      // solo si existe esa columna
    reg: e.reglamento ?? '',               // solo si existe esa columna
    L: e.largo_max ?? null, A: e.ancho_max ?? null, H: e.alto_max ?? null,
    activo: !!e.activo,
    lleno: !disponible,
    disponible,
    libres,
    promedio: Number(e.promedio) || 0,
    resenas: e.total_resenas ?? 0,
    proxima_salida: e.proxima_salida || null,
    localidad: e.nombrelocalidad || '',
    municipio: e.nombremunicipio || '',
    estado: e.nombreestado || '',
    tel: e.telefono_dueno || '',           // credenciales.telefono del dueño
    dueno: e.nombre_dueno || '',
    raw: e,
  }
}

/* Respaldo: si la vista aún no existe (no se ejecutó migracion.sql), lee directo de la tabla
   del propietario. Sin estrellas ni reservas, pero con toda su información. */
const SELECT_TABLA = '*, localidad(nombrelocalidad, municipio(nombremunicipio, estado(nombreestado))), usuarios(nombre, credenciales(telefono))'

const aplanar = (e) => {
  const loc = e.localidad || {}
  const mun = loc.municipio || {}
  const us = e.usuarios || {}
  const cred = Array.isArray(us.credenciales) ? us.credenciales[0] : us.credenciales
  return {
    ...e,
    nombrelocalidad: loc.nombrelocalidad,
    nombremunicipio: mun.nombremunicipio,
    nombreestado: mun.estado?.nombreestado,
    nombre_dueno: us.nombre,
    telefono_dueno: cred?.telefono,
    libres: e.capacidadtotal,
    promedio: 0,
    total_resenas: 0,
    proxima_salida: null,
  }
}

async function leerFilas(id = null) {
  let q = supabase.from('estacionamientos_disponibilidad').select('*')
  if (id != null) q = q.eq('idestacionamiento', id)
  let { data, error } = await q.order('idestacionamiento', { ascending: false })
  if (!error) return data || []

  console.warn('La vista no existe todavía; usando la tabla directamente:', error.message)
  let q2 = supabase.from('estacionamientos').select(SELECT_TABLA)
  if (id != null) q2 = q2.eq('idestacionamiento', id)
  const r = await q2.order('idestacionamiento', { ascending: false })
  if (r.error) { console.error('Error al cargar estacionamientos:', r.error); throw new Error(r.error.message) }
  return (r.data || []).map(aplanar)
}

/* Carrusel: todos los publicados; los llenos salen como "No disponible" */
export async function obtenerLugares() {
  return (await leerFilas()).map(mapear)
}

/* Página del lugar */
export async function obtenerLugar(id) {
  const filas = await leerFilas(id)
  return filas[0] ? mapear(filas[0]) : null
}

/* ---------- RESEÑAS (lo nuevo del cliente) ---------- */
export async function obtenerResenas(idestacionamiento) {
  const { data, error } = await supabase
    .from('resenas').select('idresena, calificacion, comentario, fecha, usuarios(nombre)')
    .eq('idestacionamiento', idestacionamiento).order('fecha', { ascending: false })
  falla(error)
  return data || []
}

/* Solo puede calificar quien ya usó su QR en ese lugar */
export async function puedeResenar(idusuario, idestacionamiento) {
  if (!idusuario) return false
  const { count, error } = await supabase
    .from('reservas').select('idreserva', { count: 'exact', head: true })
    .eq('idusuario', idusuario).eq('idestacionamiento', idestacionamiento).eq('qr_usado', true)
  falla(error)
  return (count || 0) > 0
}

export async function guardarResena({ idestacionamiento, idusuario, calificacion, comentario }) {
  const { error } = await supabase.from('resenas').upsert(
    { idestacionamiento, idusuario, calificacion, comentario, fecha: new Date().toISOString() },
    { onConflict: 'idestacionamiento,idusuario' })
  falla(error)
}