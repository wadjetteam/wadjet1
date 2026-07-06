import { GOLD, DARK, WHITE } from './constants'

export function brandHeader(doc, title, subtitle) {
  const w = doc.internal.pageSize.getWidth()
  doc.setFillColor(...DARK)
  doc.rect(0, 0, w, 38, 'F')
  doc.setFillColor(...GOLD)
  doc.rect(0, 38, w, 1.5, 'F')
  doc.setDrawColor(...GOLD)
  doc.setLineWidth(0.5)
  doc.circle(w - 18, 19, 8)
  doc.setFillColor(...GOLD)
  doc.circle(w - 18, 19, 2.5, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...GOLD)
  doc.text('WADJET', 14, 16)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(180, 155, 90)
  doc.text('GRC ENTERPRISE SUITE', 14, 23)
  doc.setFontSize(7)
  doc.setTextColor(120, 100, 55)
  doc.text('EYES ON RISK. CONTROL IN ACTION.', 14, 30)
  if (title) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(...WHITE)
    doc.text(title, w - 30, 15, { align: 'right' })
  }
  if (subtitle) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(180, 155, 90)
    doc.text(subtitle, w - 30, 22, { align: 'right' })
  }
  const now = new Date()
  doc.setFontSize(7)
  doc.setTextColor(100, 85, 45)
  doc.text(
    `Generated: ${now.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })} · ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
    w - 30, 30, { align: 'right' }
  )
  return 46
}

export function addWatermark(doc) {
  const pages = doc.internal.getNumberOfPages()
  const w = doc.internal.pageSize.getWidth()
  const h = doc.internal.pageSize.getHeight()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.saveGraphicsState()
    doc.setGState(new doc.GState({ opacity: 0.055 }))
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(44)
    doc.setTextColor(...GOLD)
    doc.text('WADJET GRC', w / 2, h / 2, { align: 'center', angle: 45 })
    doc.restoreGraphicsState()
  }
}

export function brandFooter(doc) {
  const w = doc.internal.pageSize.getWidth()
  const h = doc.internal.pageSize.getHeight()
  const pages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.setFillColor(...DARK)
    doc.rect(0, h - 12, w, 12, 'F')
    doc.setFillColor(...GOLD)
    doc.rect(0, h - 12, w, 0.8, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(130, 110, 55)
    doc.text('CONFIDENTIAL — WADJET GRC Enterprise Suite · For internal regulatory use only · Unauthorised disclosure is prohibited', 14, h - 4)
    doc.text(`Page ${i} of ${pages}`, w - 14, h - 4, { align: 'right' })
  }
}

export function sectionLabel(doc, text, y) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...GOLD)
  doc.text(text, 14, y)
  return y + 5
}
