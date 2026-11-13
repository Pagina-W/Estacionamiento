
export const DB = {
  get: (clave, valorPorDefecto = []) => {
    // Retorna el valor por defecto para evitar que las vistas truenen
    return valorPorDefecto
  },
  set: () => true,
  remove: () => true,
}

export const stars = (n = 0) => '★'.repeat(n) + '☆'.repeat(5 - n)

// Cálculo de promedio provisional
export const avg = () => 0

export const dist = (a, b, c, d) => {
  const R = 6371, t = (x) => (x * Math.PI) / 180
  const h = Math.sin(t(c - a) / 2) ** 2 + Math.cos(t(a)) * Math.cos(t(c)) * Math.sin(t(d - b) / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}
