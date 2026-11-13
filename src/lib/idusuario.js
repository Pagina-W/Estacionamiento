/* Busca el id del usuario en las distintas estructuras que puede devolver Supabase */
export function obtenerIdUsuario(user, ses) {
  return (
    user?.idusuario || user?.idUsuario || user?.id ||
    user?.usuarios?.idusuario ||
    (Array.isArray(user?.usuarios) ? user.usuarios[0]?.idusuario : null) ||
    ses?.idusuario || ses?.idUsuario || ses?.id || ses?.id_usuario || null
  )
}

/* Distancia en km entre dos coordenadas (Haversine) */
export function distanciaKm(lat1, lng1, lat2, lng2) {
  const R = 6371, rad = (x) => (x * Math.PI) / 180
  const dLat = rad(lat2 - lat1), dLng = rad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

/* Número de WhatsApp en formato internacional para México */
export const waNumero = (t) => '52' + String(t || '').replace(/\D/g, '').slice(-10)