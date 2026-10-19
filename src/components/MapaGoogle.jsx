import { useEffect, useRef, useState } from 'react'

/* Llave de Google Maps: se pone en config.js (mapsKey) */
const KEY = (window.GOPARKING_CONFIG && window.GOPARKING_CONFIG.mapsKey) || ''
export const hayLlave = !!KEY && KEY !== 'TU_LLAVE_AQUI'

let cargando = null
const cargarMaps = () => {
  if (window.google && window.google.maps) return Promise.resolve()
  if (!cargando) {
    cargando = new Promise((ok, mal) => {
      window.__gpMapsListo = ok
      const s = document.createElement('script')
      s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(KEY)}&language=es&region=MX&callback=__gpMapsListo`
      s.async = true
      s.onerror = () => { cargando = null; mal(new Error('No se pudo cargar Google Maps')) }
      document.head.appendChild(s)
    })
  }
  return cargando
}
window.gm_authFailure = () => window.dispatchEvent(new Event('gp-maps-auth'))

const cajaMapa = { width: '100%', height: 240, borderRadius: 'var(--r)', overflow: 'hidden', background: '#e8f2fd' }

/* Mapa base: muestra un pin y, si se pasa onPick, deja tocar el mapa para moverlo */
function MapaBase({ lat, lng, onPick, zoom, mapRef, style }) {
  const div = useRef(null)
  const map = useRef(null)
  const pin = useRef(null)
  const [err, setErr] = useState('')
  const hay = Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0
  const pick = useRef(onPick)
  pick.current = onPick

  useEffect(() => {
    let vivo = true
    const auth = () => setErr('Google Maps rechazó la llave. Revisa que sea correcta y que tenga activada la "Maps JavaScript API".')
    window.addEventListener('gp-maps-auth', auth)
    cargarMaps().then(() => {
      if (!vivo || !div.current) return
      const g = window.google.maps
      map.current = new g.Map(div.current, {
        center: hay ? { lat, lng } : { lat: 21.1783, lng: -99.1989 },
        zoom: zoom || (hay ? 16 : 13),
        gestureHandling: 'cooperative', mapTypeControl: false, streetViewControl: false,
      })
      if (mapRef) mapRef.current = map.current
      if (hay) pin.current = new g.Marker({ position: { lat, lng }, map: map.current })
      map.current.addListener('click', (e) => pick.current && pick.current(+e.latLng.lat().toFixed(6), +e.latLng.lng().toFixed(6)))
    }).catch((e) => setErr(e.message))
    return () => { vivo = false; window.removeEventListener('gp-maps-auth', auth) }
  }, [])

  useEffect(() => {
    if (!map.current || !hay) return
    const p = { lat, lng }
    if (pin.current) pin.current.setPosition(p)
    else pin.current = new window.google.maps.Marker({ position: p, map: map.current })
    map.current.panTo(p)
  }, [lat, lng])

  return (
    <div style={{ ...cajaMapa, ...style }}>
      {err ? <p className="sub" style={{ padding: 14, fontSize: '.85rem' }}>{err}</p> : <div ref={div} style={{ width: '100%', height: '100%' }} />}
    </div>
  )
}

/* Mapa de solo lectura para la página del lugar (+ botón "Cómo llegar").
   Si todavía no hay llave, muestra el mapa de OpenStreetMap como antes. */
export function MapaLugar({ lat, lng }) {
  if (!lat) return <p className="sub">Sin coordenadas</p>
  const b = 0.004
  return (
    <>
      {hayLlave ? (
        <MapaBase lat={lat} lng={lng} zoom={16} />
      ) : (
        <iframe loading="lazy" title="Mapa"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - b},${lat - b},${lng + b},${lat + b}&layer=mapnik&marker=${lat},${lng}`} />
      )}
      <a className="btn ghost sm" style={{ marginTop: 8, display: 'inline-block' }} target="_blank" rel="noreferrer"
        href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}>Cómo llegar</a>
    </>
  )
}

/* Mapa para el propietario: toca el mapa para poner el pin o busca la dirección escrita. */
export function SelectorUbicacion({ lat, lng, direccion, onChange, onError }) {
  const mapRef = useRef(null)
  const [buscando, setBuscando] = useState(false)
  if (!hayLlave) {
    return (
      <p className="sub" style={{ fontSize: '.78rem', margin: '8px 0 0' }}>
        Para elegir el punto en el mapa agrega tu llave de Google Maps en el archivo config.js.
      </p>
    )
  }
  const buscar = async () => {
    if (!direccion.trim()) return onError('Escribe primero la dirección, municipio y localidad')
    setBuscando(true)
    try {
      await cargarMaps()
      const { results } = await new window.google.maps.Geocoder().geocode({ address: direccion, region: 'MX' })
      const p = results[0] && results[0].geometry.location
      if (!p) return onError('No encontramos esa dirección')
      onChange(+p.lat().toFixed(6), +p.lng().toFixed(6))
      mapRef.current && mapRef.current.setZoom(17)
    } catch (e) {
      onError('No encontramos esa dirección (activa la Geocoding API en tu llave)')
    } finally {
      setBuscando(false)
    }
  }
  return (
    <>
      <MapaBase lat={lat} lng={lng} onPick={onChange} mapRef={mapRef} style={{ marginTop: 10 }} />
      <p className="sub" style={{ fontSize: '.78rem', margin: '6px 0 0' }}>Toca el mapa para colocar el pin exacto de tu estacionamiento.</p>
      <button type="button" className="btn ghost sm" style={{ marginTop: 8 }} onClick={buscar} disabled={buscando}>
        {buscando ? 'Buscando…' : '🔎 Buscar dirección en el mapa'}
      </button>
    </>
  )
}
