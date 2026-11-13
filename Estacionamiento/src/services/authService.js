
import { supabase } from '../lib/supabase.js'

// Registrar clientes y propietarios
export async function registrarUsuario({
  mail,
  pass,
  nombre,
  apellidos,
  tel,
  idRol
}) {
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
        nombre,
        apellidos,
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

// Iniciar sesión
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
    .eq('correo', mail.trim().toLowerCase())
    .eq('Contraseña', pass)
    .maybeSingle()

  if (error) {
    console.error('Error al iniciar sesión:', error)
    throw new Error('Error al conectar con la base de datos.')
  }

  if (!data) {
    throw new Error('Correo o contraseña incorrectos.')
  }

  // Obtener información del usuario
  const u = Array.isArray(data.usuarios)
    ? data.usuarios[0]
    : data.usuarios

  if (!u) {
    throw new Error('No se encontró el perfil del usuario.')
  }

  // Obtener nombre del rol
  const rolNombre = Array.isArray(u.roles)
    ? u.roles[0]?.nombrerol
    : u.roles?.nombrerol

  const rolOriginal = (rolNombre || 'cliente').toLowerCase()

  // Convertir admin al nombre utilizado en React
  const rolFinal = rolOriginal === 'admin'
    ? 'administrador'
    : rolOriginal

  // Devolver información completa
  return {
    id: u.idusuario,
    idusuario: u.idusuario,
    idcredencial: data.idcredencial,
    correo: data.correo,
    nombre: u.nombre,
    apellidos: u.apellidos,
    idrol: u.idrol,
    role: rolFinal,
    tel: ''
  }
}
