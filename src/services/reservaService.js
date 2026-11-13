import { supabase } from '../lib/supabase.js'
import { comprimirBlob } from '../lib/imagen.js'

const falla = (error) => { if (error) throw new Error(error.message) }

/* Sube el comprobante de transferencia a Storage y devuelve su URL pública */
export async function subirComprobante(archivo, idusuario) {
  const blob = await comprimirBlob(archivo)
  const ruta = `${idusuario}/${crypto.randomUUID()}.jpg`
  const { error } = await supabase.storage.from('comprobantes').upload(ruta, blob, { contentType: 'image/jpeg' })
  falla(error)
  return supabase.storage.from('comprobantes').getPublicUrl(ruta).data.publicUrl
}

/* Busca el tipo en el catálogo; si no existe, lo crea. Luego busca o crea el vehículo del usuario */
async function obtenerIdVehiculo(idusuario, nombreTipo, placaTexto) {
  const nombre = String(nombreTipo || '').trim()
  if (!nombre) throw new Error('Elige un tipo de vehículo.')
  const placa = String(placaTexto || '').trim().toUpperCase().replace(/\s+/g, '')
  if (!placa) throw new Error('Escribe la placa de tu vehículo.')

  let { data: tipo, error: e1 } = await supabase
    .from('tipovehiculo').select('idtipovehiculo')
    .ilike('nombretipo', nombre).limit(1).maybeSingle()
  falla(e1)

  if (!tipo) {
    const { data: nuevoTipo, error: e0 } = await supabase
      .from('tipovehiculo').insert({ nombretipo: nombre })
      .select('idtipovehiculo').single()
    falla(e0)
    tipo = nuevoTipo
  }

  const { data: existente, error: e2 } = await supabase
    .from('vehiculos').select('idvehiculo')
    .eq('idusuario', idusuario).eq('placa', placa)
    .limit(1).maybeSingle()
  falla(e2)
  if (existente) return existente.idvehiculo

  const { data: nuevo, error: e3 } = await supabase
    .from('vehiculos')
    .insert({
      idusuario,
      idtipovehiculo: tipo.idtipovehiculo,
      placa,
      descripcion: nombre,
    })
    .select('idvehiculo').single()
  falla(e3)
  return nuevo.idvehiculo
}

export async function crearReserva(r) {
  const idvehiculo = await obtenerIdVehiculo(r.idusuario, r.vehiculo, r.placa)

  const { data, error } = await supabase.from('reservas').insert({
    idestacionamiento: r.idestacionamiento,
    idusuario: r.idusuario,
    idvehiculo,
    fechaentrada: r.entrada,
    fechasalida: r.salida,
    montototal: r.total,
    estadoreserva: 'confirmada',
    tipo_reserva: r.tipo,
    tipo_vehiculo: r.vehiculo,
    horas: r.tipo === 'hora' ? r.cantidad : null,
    dias: r.tipo === 'dia' ? r.cantidad : null,
    preferencia: r.preferencia || null,
    metodo_pago: r.metodo,
    comprobante_url: r.comprobante_url || null,
    // transferencia: el dueño debe verificar el comprobante; efectivo: pendiente de cobro
    estado_pago: r.metodo === 'transferencia' ? 'en_revision' : 'pendiente',
  }).select('*, estacionamientos(nombreestacionamiento)').single()
  falla(error)
  return data
}

export async function obtenerReserva(idreserva) {
  const { data, error } = await supabase
    .from('reservas').select('*, estacionamientos(nombreestacionamiento)')
    .eq('idreserva', idreserva).single()
  falla(error)
  return data
}

/* Reserva con todos los datos que necesita el PDF (cliente, placa, estacionamiento) */
export async function obtenerReservaParaPDF(idreserva) {
  const { data, error } = await supabase
    .from('reservas')
    .select('*, estacionamientos(nombreestacionamiento, direcciontexto), usuarios(nombre, apellidos), vehiculos(placa)')
    .eq('idreserva', idreserva).single()
  falla(error)
  return data
}

export async function obtenerReservasCliente(idusuario) {
  const { data, error } = await supabase
    .from('reservas').select('*, estacionamientos(nombreestacionamiento, direcciontexto)')
    .eq('idusuario', idusuario).order('fechacreacion', { ascending: false })
  falla(error)
  return data || []
}

export async function obtenerReservasPropietario(idowner) {
  const { data, error } = await supabase
    .from('reservas')
    .select('*, estacionamientos!inner(nombreestacionamiento, idusuario), usuarios(nombre, apellidos)')
    .eq('estacionamientos.idusuario', idowner)
    .order('fechacreacion', { ascending: false })
  falla(error)
  return data || []
}

/* estado: 'verificado' | 'cobrado' | 'rechazado' */
export async function cambiarEstadoPago(idreserva, idowner, estado) {
  const { data, error } = await supabase.rpc('cambiar_estado_pago', { p_idreserva: idreserva, p_idowner: idowner, p_estado: estado })
  falla(error)
  if (data !== 'ok') throw new Error('No tienes permiso para cambiar este pago')
}

export async function consultarQR(codigo, idowner) {
  const { data, error } = await supabase.rpc('consultar_qr', { p_codigo: codigo, p_idowner: idowner })
  falla(error)
  return data
}

export async function usarQR(codigo, idowner) {
  const { data, error } = await supabase.rpc('usar_qr', { p_codigo: codigo, p_idowner: idowner })
  falla(error)
  return data // ok | ya_usado | pago_pendiente | no_autorizado | invalido
}

/* Placa registrada del vehículo ligado a la reserva (para compararla con la foto que toma el dueño) */
export async function obtenerPlacaReserva(idreserva) {
  const { data, error } = await supabase
    .from('reservas').select('vehiculos(placa)')
    .eq('idreserva', idreserva).maybeSingle()
  falla(error)
  const v = data?.vehiculos
  return (Array.isArray(v) ? v[0]?.placa : v?.placa) || null
}