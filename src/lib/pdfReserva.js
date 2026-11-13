import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'
import { obtenerReservaParaPDF } from '../services/reservaService.js'

/* Genera y descarga el PDF de una reserva.
   Todos los datos salen de Supabase (tabla reservas + usuarios + vehiculos + estacionamientos),
   así el PDF siempre muestra lo que realmente quedó guardado y el estado de pago actual.
   cliente (opcional) -> nombre de la sesión, solo se usa si la base no devuelve el nombre. */

const fmt = (f) =>
  f ? new Date(f).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' }) : '-'

const uno = (x) => (Array.isArray(x) ? x[0] : x) || null

function estadoPago(r) {
  const ok = r.estado_pago === 'verificado' || r.estado_pago === 'cobrado'
  if (r.estado_pago === 'rechazado') return 'Comprobante rechazado'
  if (r.metodo_pago === 'transferencia') return ok ? 'Transferencia verificada (pagado)' : 'Transferencia - comprobante en revision'
  return ok ? 'Efectivo cobrado (pagado)' : 'Pendiente - se paga en efectivo al llegar'
}

export async function descargarPDFReserva(idreserva, { cliente = '' } = {}) {
  const r = await obtenerReservaParaPDF(idreserva)
  const usuario = uno(r.usuarios)
  const placa = uno(r.vehiculos)?.placa || ''
  const lugar = uno(r.estacionamientos)
  const nombreCliente = [usuario?.nombre, usuario?.apellidos].filter(Boolean).join(' ') || cliente

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const L = 18
  const ancho = 210 - L * 2
  const url = `${window.location.origin}/validar/${r.codigo_qr}`

  // Encabezado
  doc.setFillColor(29, 78, 216)
  doc.rect(0, 0, 210, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold').setFontSize(20)
  doc.text('UbiPark', L, 13)
  doc.setFont('helvetica', 'normal').setFontSize(11)
  doc.text('Comprobante de reserva de estacionamiento', L, 21)

  // Folio y código de confirmación
  doc.setTextColor(30, 30, 30)
  doc.setFont('helvetica', 'bold').setFontSize(16)
  doc.text(`Folio #${r.idreserva}`, L, 42)

  doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(110, 110, 110)
  doc.text('CODIGO DE CONFIRMACION (unico)', L, 50)
  doc.setFont('courier', 'bold').setFontSize(11).setTextColor(30, 30, 30)
  doc.text(doc.splitTextToSize(String(r.codigo_qr || '-'), ancho - 50), L, 56)

  // QR (sigue sirviendo para validar con la cámara)
  const qr = await QRCode.toDataURL(url, { margin: 1, width: 300 })
  doc.addImage(qr, 'PNG', 210 - L - 38, 34, 38, 38)

  doc.setDrawColor(200, 200, 200).line(L, 78, 210 - L, 78)

  // Datos en filas etiqueta / valor
  let y = 88
  const fila = (etiqueta, valor) => {
    doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(110, 110, 110)
    doc.text(etiqueta.toUpperCase(), L, y)
    doc.setFont('helvetica', 'bold').setFontSize(11).setTextColor(30, 30, 30)
    const lineas = doc.splitTextToSize(String(valor || '-'), ancho - 55)
    doc.text(lineas, L + 55, y)
    y += Math.max(8, lineas.length * 6 + 2)
  }

  const duracion = r.tipo_reserva === 'dia' ? `${r.dias} dia(s)` : `${r.horas} hora(s)`

  fila('Cliente', nombreCliente)
  fila('Vehiculo', `${r.tipo_vehiculo || ''}${placa ? ' - Placa ' + placa : ''}`)
  fila('Estacionamiento', lugar?.nombreestacionamiento)
  if (lugar?.direcciontexto) fila('Direccion', lugar.direcciontexto)
  fila('Reserva realizada', fmt(r.fechacreacion))
  fila('Entrada', fmt(r.fechaentrada))
  fila('Salida', fmt(r.fechasalida))
  fila('Duracion', duracion)
  if (r.preferencia) fila('Preferencias', r.preferencia)
  fila('Monto total', `$${r.montototal} MXN`)
  fila('Metodo de pago', r.metodo_pago === 'transferencia' ? 'Transferencia' : 'Efectivo')
  fila('Estado del pago', estadoPago(r))

  // Enlace de validación
  y += 4
  doc.setFont('helvetica', 'normal').setFontSize(9).setTextColor(110, 110, 110)
  doc.text('ENLACE DE VALIDACION (para el propietario)', L, y)
  y += 6
  doc.setTextColor(29, 78, 216)
  doc.textWithLink(url, L, y, { url, maxWidth: ancho })

  // Nota al pie
  doc.setTextColor(110, 110, 110).setFont('helvetica', 'normal').setFontSize(8)
  const nota =
    'Presenta este documento al llegar. El propietario confirma la reserva y el estado del pago en el sistema con el codigo de confirmacion; ' +
    'este PDF por si solo no es comprobante de pago. Cada codigo es unico y solo puede usarse una vez.'
  doc.text(doc.splitTextToSize(nota, ancho), L, 270)
  doc.text(`Generado el ${fmt(new Date())}`, L, 284)

  doc.save(`reserva-${r.idreserva}.pdf`)
}
