/* Comprime una imagen en el navegador y la devuelve como dataURL o Blob JPEG */
const leer = (f) => new Promise((res, rej) => {
  const fr = new FileReader()
  fr.onload = () => res(fr.result)
  fr.onerror = rej
  fr.readAsDataURL(f)
})
const cargarImg = (src) => new Promise((res, rej) => {
  const i = new Image()
  i.onload = () => res(i)
  i.onerror = rej
  i.src = src
})

async function dibujar(file, max) {
  const img = await cargarImg(await leer(file))
  const k = Math.min(1, max / img.width)
  const c = document.createElement('canvas')
  c.width = Math.round(img.width * k)
  c.height = Math.round(img.height * k)
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
  return c
}

export async function comprimirDataURL(file, max = 800, calidad = 0.7) {
  return (await dibujar(file, max)).toDataURL('image/jpeg', calidad)
}

export async function comprimirBlob(file, max = 1200, calidad = 0.8) {
  const c = await dibujar(file, max)
  return new Promise((res) => c.toBlob(res, 'image/jpeg', calidad))
}