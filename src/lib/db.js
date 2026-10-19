/* DATOS Y UTILIDADES COMPARTIDAS: base de datos local (localStorage).
   Aquí se sustituirá DB.get/DB.set por llamadas a tu API .NET + SQL Server. */
export const DB = {
  get: (k, d) => {
    try { return JSON.parse(localStorage.getItem('gp_' + k)) ?? d } catch (e) { return d }
  },
  set: (k, v) => {
    try { localStorage.setItem('gp_' + k, JSON.stringify(v)); return true } catch (e) { return false }
  },
  remove: (k) => localStorage.removeItem('gp_' + k),
}

const mk = (id, n, mun, loc, lat, lng, p, cap, L, A, H, tipos, ex, ico) => ({
  id, nombre: n, estado: 'Hidalgo', municipio: mun, localidad: loc, dir: loc + ', ' + mun,
  lat, lng, pph: p, cap, hor: '8:00 AM - 10:00 PM', L, A, H, tipos, extras: ex,
  reg: 'Respetar el cajón asignado. No dejar objetos de valor.', fotos: [], ico,
  owner: 'demo', tel: '5217710000000', lleno: false,
})

/* Datos de ejemplo la primera vez que se abre la página */
if (!DB.get('lugares')) {
  DB.set('lugares', [
    mk('l1', 'Garage Privado Centro', 'Pisaflores', 'Centro', 21.1783, -99.1989, 20, 3, 4.8, 2.2, 2, ['Moto', 'Sedán'], ['Techado', 'Cámaras 24/7'], '🏠'),
    mk('l2', 'Estacionamiento Plaza Norte', 'Pisaflores', 'Col. Norte', 21.1830, -99.1950, 25, 6, 5.5, 2.5, 2.4, ['Sedán', 'SUV', 'Camioneta'], ['Portón eléctrico', 'Con sombra'], '🅿️'),
    mk('l3', 'Cochera La Loma', 'Pisaflores', 'La Loma', 21.1740, -99.2020, 15, 2, 4.5, 2.1, 1.9, ['Moto', 'Sedán'], ['Con sombra'], '🌳'),
  ])
  DB.set('resenas', [
    { l: 'l1', n: 'Carlos M.', r: 'Conductor', s: 5, t: 'Me escribió el dueño rápido y pagué en efectivo al llegar.' },
    { l: 'l2', n: 'Sofía R.', r: 'Propietaria', s: 5, t: 'Monetizo mi garage en las mañanas y tengo mis folios ordenados.' },
    { l: 'l3', n: 'Ana L.', r: 'Conductora', s: 4, t: 'Buen lugar con sombra, el QR me ayudó a entrar sin discusión.' },
  ])
}

export const stars = (n) => '★'.repeat(n) + '☆'.repeat(5 - n)

export const avg = (id) => {
  const r = DB.get('resenas', []).filter((x) => x.l == id)
  return r.length ? Math.round(r.reduce((a, b) => a + b.s, 0) / r.length) : 0
}

/* Distancia en km entre dos coordenadas (haversine) */
export const dist = (a, b, c, d) => {
  const R = 6371, t = (x) => (x * Math.PI) / 180
  const h = Math.sin(t(c - a) / 2) ** 2 + Math.cos(t(a)) * Math.cos(t(c)) * Math.sin(t(d - b) / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}
