import { supabase } from '../lib/supabase.js'

// Función auxiliar para registrar o reutilizar e
async function obtenerOCrearLocalidad(nombreEstado, nombreMunicipio, nombreLocalidad) {
  const estTexto = (nombreEstado || 'Hidalgo').trim()
  const munTexto = (nombreMunicipio || 'General').trim()
  const locTexto = (nombreLocalidad || 'Centro').trim()

  let { data: est } = await supabase
    .from('estado')
    .select('*')
    .ilike('nombreestado', estTexto)
    .maybeSingle()

  if (!est) {
    const { data: nuevoEst, error } = await supabase
      .from('estado')
      .insert([{ nombreestado: estTexto }])
      .select()
      .single()
    if (error) throw new Error('Error al guardar Estado: ' + error.message)
    est = nuevoEst
  }

  let { data: mun } = await supabase
    .from('municipio')
    .select('*')
    .ilike('nombremunicipio', munTexto)
    .eq('idestado', est.idestado)
    .maybeSingle()

  if (!mun) {
    const { data: nuevoMun, error } = await supabase
      .from('municipio')
      .insert([{ nombremunicipio: munTexto, idestado: est.idestado }])
      .select()
      .single()
    if (error) throw new Error('Error al guardar Municipio: ' + error.message)
    mun = nuevoMun
  }

  let { data: loc } = await supabase
    .from('localidad')
    .select('*')
    .ilike('nombrelocalidad', locTexto)
    .eq('idmunicipio', mun.idmunicipio)
    .maybeSingle()

  if (!loc) {
    const { data: nuevaLoc, error } = await supabase
      .from('localidad')
      .insert([{ nombrelocalidad: locTexto, idmunicipio: mun.idmunicipio }])
      .select()
      .single()
    if (error) throw new Error('Error al guardar Localidad: ' + error.message)
    loc = nuevaLoc
  }

  return loc.idlocalidad
}

export async function crearEstacionamiento(datos) {
  // Genera o busca el idlocalidad relacional
  const idlocalidad = await obtenerOCrearLocalidad(
    datos.estado,
    datos.municipio,
    datos.localidad
  )

  // Convierte el arreglo de moto ,sedan etc
  const vehiculosTexto = Array.isArray(datos.tipos) ? datos.tipos.join(', ') : datos.tipos

  const { data, error } = await supabase
    .from('estacionamientos')
    .insert([
      {
        nombreestacionamiento: datos.nombre,
        idusuario: datos.idusuario,
        idlocalidad: idlocalidad,
        direcciontexto: datos.direccion,
        latitud: datos.latitud || null,
        longitud: datos.longitud || null,
        precioporhora: datos.precioporhora,
        capacidadtotal: datos.capacidadtotal,
        horaapertura: datos.horaapertura || null,
        horacierre: datos.horacierre || null,
        vehiculospermitidos: vehiculosTexto, 
        activo: true,
        imagen: datos.imagen || null,
      },
    ])
    .select()

  if (error) {
    console.error('Error al crear el estacionamiento:', error.message)
    throw new Error('No se pudo publicar el estacionamiento.')
  }

  return data
}

export async function obtenerEstacionamientosPorPropietario(idusuario) {
  const { data, error } = await supabase
    .from('estacionamientos')
    .select('*')
    .eq('idusuario', idusuario)
    .order('idestacionamiento', { ascending: false })

  if (error) throw new Error('No se pudieron cargar tus estacionamientos.')
  return data
}

export async function cambiarEstadoEstacionamiento(idestacionamiento, estadoActivo) {
  const { data, error } = await supabase
    .from('estacionamientos')
    .update({ activo: estadoActivo })
    .eq('idestacionamiento', idestacionamiento)
    .select()

  if (error) throw new Error('No se pudo actualizar el estado.')
  return data
}

export async function eliminarEstacionamiento(idestacionamiento) {
  const { error } = await supabase
    .from('estacionamientos')
    .delete()
    .eq('idestacionamiento', idestacionamiento)

  if (error) throw new Error('No se pudo eliminar el estacionamiento.')
}