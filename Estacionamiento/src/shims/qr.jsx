/* QR con la librería qrcodejs (la misma de tu página original) */
import { useEffect, useRef } from 'react'
export function QRCodeSVG({ value, size = 150, fgColor = '#000' }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    el.innerHTML = ''
    try { new window.QRCode(el, { text: value, width: size, height: size, colorDark: fgColor }) } catch (e) {}
  }, [value, size, fgColor])
  return <div ref={ref} />
}
