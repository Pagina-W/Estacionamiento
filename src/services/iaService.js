// DESTINO: src/services/iaService.js  (reemplaza el archivo completo)
import { supabase } from '../lib/supabase.js'
import { comprimirBlob } from '../lib/imagen.js'

const aBase64 = (blob) => new Promise((res, rej) => {
  const r = new FileReader()
  r.onload = () => res(String(r.result).split(',')[1])
  r.onerror = () => rej(new Error('No se pudo leer la imagen'))
  r.readAsDataURL(blob)
})

async function invocar(funcion, cuerpo) {
  const { data, error } = await supabase.functions.invoke(funcion, { body: cuerpo })
  if (error) throw new Error(error.message)
  if (data?.error) throw new Error(data.error)
  return data
}

/* Lee el comprobante ya subido (URL pública) y lo compara con el monto de la reserva.
   Devuelve: { es_comprobante, monto, fecha, referencia, banco, coincide_monto, observaciones } */
export function analizarComprobante(url, montoEsperado) {
  return invocar('analizar-imagen', { tipo: 'comprobante', url, esperado: { monto: montoEsperado } })
}

/* El dueño toma una foto del vehículo; la IA lee la placa y la compara con la registrada.
   Devuelve: { hay_placa, placa, confianza, coincide, observaciones } */
export async function analizarPlaca(archivo, placaEsperada) {
  const blob = await comprimirBlob(archivo)
  return invocar('analizar-imagen', {
    tipo: 'placa',
    base64: await aBase64(blob),
    media_type: 'image/jpeg',
    esperado: { placa: placaEsperada },
  })
}

/* Chat con Gemini conectado a tu base de datos (vía Edge Function, la llave nunca llega al navegador).
   historial: [{ role: 'user' | 'model', parts: [{ text }] }, ...]
   Devuelve el texto de la respuesta. */
export async function preguntarChat(historial) {
  const data = await invocar('chat-estacionamientos', { historial })
  return data.respuesta
}
