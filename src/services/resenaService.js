import { supabase } from '../lib/supabase.js'

/* Estados de una reseña: publicada (visible y cuenta), pendiente (solo la ve su autor hasta que el admin la revise), oculta (retirada) */
export const ESTADOS_RESENA = ['publicada', 'pendiente', 'oculta']

/* Filtro básico de lenguaje ofensivo: si lo detecta, la reseña queda 'pendiente' para revisión del administrador.
   Agrega aquí más palabras (sin acentos y en minúscula). */
const PALABRAS_PROHIBIDAS = [
  'pendejo', 'pendeja', 'idiota', 'estupido', 'estupida', 'imbecil',
  'mierda', 'puto', 'puta', 'cabron', 'verga', 'chingar', 'chingada', 'chingado',
]

const tieneLenguajeOfensivo = (texto) => {
  const palabras = String(texto || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().split(/[^a-z]+/)
  return palabras.some((p) => PALABRAS_PROHIBIDAS.includes(p))
}

/* Devuelve [{ promedio, total }] contando solo reseñas publicadas */
export async function resumenResenas(idestacionamiento) {
  const { data, error } = await supabase
    .from('resenas')
    .select('calificacion')
    .eq('idestacionamiento', idestacionamiento)
    .eq('estado', 'publicada')

  if (error) throw new Error(error.message)

  const total = data.length
  const promedio = total ? data.reduce((s, r) => s + (Number(r.calificacion) || 0), 0) / total : 0
  return [{ promedio, total }]
}

/* Reseñas publicadas de un estacionamiento, con el nombre del autor */
export async function resenasPublicas(idestacionamiento) {
  // Intento 1: con el nombre del autor (relación con la tabla usuarios)
  let { data, error } = await supabase
    .from('resenas')
    .select('idresena, calificacion, comentario, fecha, usuarios ( nombre )')
    .eq('idestacionamiento', idestacionamiento)
    .eq('estado', 'publicada')
    .order('fecha', { ascending: false })

  if (!error) {
    return (data || []).map((r) => ({ ...r, autor: r.usuarios?.nombre || 'Cliente' }))
  }

  // Intento 2: sin el nombre (por si la columna o la relación tienen otro nombre)
  const r2 = await supabase
    .from('resenas')
    .select('idresena, calificacion, comentario, fecha')
    .eq('idestacionamiento', idestacionamiento)
    .eq('estado', 'publicada')
    .order('fecha', { ascending: false })

  if (r2.error) throw new Error(r2.error.message)
  return (r2.data || []).map((r) => ({ ...r, autor: 'Cliente' }))
}

/* Dice si el usuario ya puede calificar (usó su reserva) y devuelve su reseña si ya dejó una */
export async function estadoResena(idusuario, idestacionamiento) {
  const usada = await supabase
    .from('reservas')
    .select('idreserva')
    .eq('idusuario', idusuario)
    .eq('idestacionamiento', idestacionamiento)
    .eq('qr_usado', true)
    .limit(1)

  if (usada.error) throw new Error(usada.error.message)

  const mia = await supabase
    .from('resenas')
    .select('idresena, calificacion, comentario, estado')
    .eq('idusuario', idusuario)
    .eq('idestacionamiento', idestacionamiento)
    .maybeSingle()

  if (mia.error) throw new Error(mia.error.message)

  return { puede: (usada.data || []).length > 0, resena: mia.data || null }
}

/* Guarda (o actualiza) la reseña del usuario. Devuelve un código que resenas.jsx convierte en mensaje:
   'ok' | 'pendiente' | 'oculta' | 'sin_reserva_usada' | 'calificacion_invalida' | 'comentario_largo' */
export async function crearResena(idusuario, idestacionamiento, calificacion, comentario) {
  const cal = Number(calificacion)
  const texto = String(comentario || '').trim()

  if (!Number.isInteger(cal) || cal < 1 || cal > 5) return 'calificacion_invalida'
  if (texto.length > 500) return 'comentario_largo'

  const { puede, resena } = await estadoResena(idusuario, idestacionamiento)
  if (!puede) return 'sin_reserva_usada'
  if (resena?.estado === 'oculta') return 'oculta'

  const estado = tieneLenguajeOfensivo(texto) ? 'pendiente' : 'publicada'
  const datos = { calificacion: cal, comentario: texto, estado, fecha: new Date().toISOString() }

  const { error } = resena
    ? await supabase.from('resenas').update(datos).eq('idresena', resena.idresena)
    : await supabase.from('resenas').insert({ idestacionamiento, idusuario, ...datos })

  if (error) throw new Error(error.message)
  return estado === 'publicada' ? 'ok' : 'pendiente'
}

/* Para el administrador: cambia una reseña a 'publicada', 'pendiente' u 'oculta' */
export async function cambiarEstadoResena(idresena, estado) {
  if (!ESTADOS_RESENA.includes(estado)) throw new Error('Estado no válido.')
  const { error } = await supabase.from('resenas').update({ estado }).eq('idresena', idresena)
  if (error) throw new Error(error.message)
}