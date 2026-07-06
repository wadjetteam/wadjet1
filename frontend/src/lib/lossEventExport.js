import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { brandHeader, addWatermark, brandFooter } from './pdfHelpers'
import { downloadCSV } from './csvExport'
import { newWb, initBrandedSheet, saveXLSX, xlsxCellStyle, xlsxFillByValue } from './excelHelpers'
import { DARK, CREAM, GOLD, TEXT_DARK } from './constants'

export function downloadLossEventCSV(events) {
  downloadCSV('Wadjet-GRC-Loss-Events',
    ['ID', 'Date', 'Category', 'Title', 'Gross Loss (EGP)', 'Recovered (EGP)', 'Net Loss (EGP)', 'Status', 'Severity', 'Business Line', 'Near Miss'],
    events.map(e => [e.id, e.date, e.category, e.title, e.amount, e.recovered, e.amount - e.recovered, e.status, e.severity, e.businessLine, e.nearMiss ? 'Yes' : 'No'])
  )
}

export function downloadLossEventPDF(events) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  let y = brandHeader(doc, 'Operational Loss Event Database', 'Basel III Pillar 2 · 7 Basel II Event Categories')

  autoTable(doc, {
    startY: y,
    head: [['Event ID', 'Date', 'Category', 'Title', 'Gross Loss (EGP)', 'Recovered', 'Status', 'Severity', 'Business Line']],
    body: events.filter(e => !e.nearMiss).map(e => [
      e.id, e.date, e.category, e.title.substring(0, 45),
      `EGP ${e.amount.toLocaleString()}`, `EGP ${e.recovered.toLocaleString()}`,
      e.status, e.severity.toUpperCase(), e.businessLine,
    ]),
    theme: 'striped',
    headStyles: { fillColor: DARK, textColor: GOLD, fontSize: 7, fontStyle: 'bold' },
    bodyStyles: { fontSize: 6.5, textColor: TEXT_DARK },
    alternateRowStyles: { fillColor: CREAM },
    margin: { left: 14, right: 14 },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 7) {
        const v = data.cell.raw
        if (v === 'CRITICAL') { data.cell.styles.textColor = [180, 20, 40]; data.cell.styles.fontStyle = 'bold' }
        else if (v === 'HIGH') data.cell.styles.textColor = [180, 100, 0]
      }
    },
  })

  addWatermark(doc)
  brandFooter(doc)
  doc.save('Wadjet-GRC-Loss-Event-Database.pdf')
}

export async function downloadLossEventXLSX(events) {
  const wb = newWb()

  const actualLosses = events.filter(e => !e.nearMiss)
  const { ws: ws1 } = initBrandedSheet(wb, {
    sheetName: 'Loss Events',
    title: 'Operational Loss Event Database',
    subtitle: 'Basel III Pillar 2 · 7 Basel II Event Categories · Gross Loss Registry',
    columns: [
      { header: 'Event ID',           width: 14 },
      { header: 'Event Date',         width: 14 },
      { header: 'Category',           width: 26 },
      { header: 'Title',              width: 44 },
      { header: 'Gross Loss (EGP)',   width: 18 },
      { header: 'Recovered (EGP)',    width: 16 },
      { header: 'Net Loss (EGP)',     width: 16 },
      { header: 'Status',             width: 16 },
      { header: 'Severity',           width: 14 },
      { header: 'Business Line',      width: 22 },
    ],
  })
  actualLosses.forEach(e => {
    const row = ws1.addRow([e.id, e.date, e.category, e.title, e.amount, e.recovered, e.amount - e.recovered, e.status, e.severity.toUpperCase(), e.businessLine])
    row.height = 18
    row.eachCell(cell => Object.assign(cell, xlsxCellStyle(xlsxFillByValue(e.severity))))
    ws1.getCell(row.number, 5).numFmt = '#,##0'
    ws1.getCell(row.number, 6).numFmt = '#,##0'
    ws1.getCell(row.number, 7).numFmt = '#,##0'
  })

  const nearMisses = events.filter(e => e.nearMiss)
  if (nearMisses.length > 0) {
    const { ws: ws2 } = initBrandedSheet(wb, {
      sheetName: 'Near Misses',
      title: 'Operational Loss — Near Miss Register',
      subtitle: 'Proactive risk identification · Near-miss events',
      columns: [
        { header: 'Event ID',      width: 14 },
        { header: 'Event Date',    width: 14 },
        { header: 'Category',      width: 26 },
        { header: 'Title',         width: 50 },
        { header: 'Severity',      width: 14 },
        { header: 'Business Line', width: 22 },
        { header: 'Status',        width: 16 },
      ],
    })
    nearMisses.forEach(e => {
      const row = ws2.addRow([e.id, e.date, e.category, e.title, e.severity.toUpperCase(), e.businessLine, e.status])
      row.height = 18
      row.eachCell(cell => Object.assign(cell, xlsxCellStyle(xlsxFillByValue(e.severity))))
    })
  }

  await saveXLSX(wb, 'Wadjet-GRC-Loss-Event-Database.xlsx')
}
