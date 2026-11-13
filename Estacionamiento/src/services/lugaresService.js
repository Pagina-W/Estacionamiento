import { supabase } from '../lib/supabase.js'

// Convierte una fila de "estacionamientos" al formato que usan las vistas.
// Las columnas que aún no conocemos usan valores por defecto.
const mapear = (e) => ({
  id: e.idestacionamiento,
  nombre: e.nombreestacionamiento,
  owner: e.idusuario,
  dir: e.direcciontexto,
  lat: e.latitud ?? null,
  lng: e.longitud ?? null,
  pph: e.preciohora ?? e.precio ?? 0,
  cap: e.capacidad ?? 0,
  hor: e.horario ?? '',
  fotos: e.fotos ? [].concat(e.fotos) : [],
  tipos: [],
  extras: [],
  reg: e.reglamento ?? '',
  lleno: false,
  localidad: '',
  municipio: '',
  estado: '',
  tel: '',
  raw: e,
})

export async function obtenerLugares() {
  const { data, error } = await supabase
    .from('estacionamientos')
    .select('*')

  if (error) {
    console.error('Error al cargar estacionamientos:', error)
    throw new Error(error.message)
  }

  // Muestra en consola todas las columnas reales de la tabla
  console.log('Estacionamientos (filas crudas):', data)

  return (data || []).map(mapear)
}