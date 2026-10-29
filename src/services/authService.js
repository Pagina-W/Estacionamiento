import { supabase } from '../lib/supabase.js'

export async function registrarUsuario({ mail, pass, nombre, apellidos, tel, idRol }) {
  const { data: cred, error: errCred } = await supabase
    .from('credenciales')
    .insert([
      {
        usuario: mail.toLowerCase(),
        Contraseña: pass,
        correo: mail,
        telefono: tel,
      },
    ])
    .select()
    .single()

  if (errCred) {
    console.error('Error en credenciales:', errCred)
    throw new Error(errCred.message)
  }

  const { data: usuario, error: errUser } = await supabase
    .from('usuarios')
    .insert([
      {
        nombre: nombre,
        apellidos: apellidos,
        idcredencial: cred.idcredencial,
        idrol: idRol,
      },
    ])
    .select()
    .single()

  if (errUser) {
    console.error('Error en usuarios:', errUser)
    throw new Error(errUser.message)
  }

  return usuario
}

export async function iniciarSesion({ mail, pass }) {
  const { data, error } = await supabase
    .from('credenciales')
    .select(`
      idcredencial,
      correo,
      usuarios (
        idusuario,
        nombre,
        apellidos,
        idrol,
        roles ( nombrerol )
      )
    `)
    .eq('correo', mail)
    .eq('Contraseña', pass)
    .maybeSingle()

  if (error) {
    console.error('Error al iniciar sesión:', error.message)
    throw new Error('Error al conectar con la base de datos.')
  }

  if (!data) {
    throw new Error('Correo o contraseña incorrectos.')
  }

  // Extraer el usuario relacionado (Supabase puede devolverlo como objeto o como arreglo)
  const u = Array.isArray(data.usuarios) ? data.usuarios[0] : data.usuarios
  const rolNombre = u?.roles?.nombrerol || u?.roles?.[0]?.nombrerol || 'cliente'

  // Retornamos un objeto aplanado con todos los datos clave en la raíz
  return {
    id: u?.idusuario,
    idusuario: u?.idusuario,
    idcredencial: data.idcredencial,
    correo: data.correo,
    nombre: u?.nombre,
    apellidos: u?.apellidos,
    role: rolNombre.toLowerCase(),
  }
}