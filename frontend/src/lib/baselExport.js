import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { brandHeader, addWatermark, brandFooter, sectionLabel } from './pdfHelpers'
import { downloadCSV } from './csvExport'
import { newWb, initBrandedSheet, saveXLSX, xlsxCellStyle } from './excelHelpers'
import { DARK, DARK2, CREAM, GOLD, TEXT_DARK } from './constants'

export function downloadBaselPDF(capitalRatios, capitalTrend) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  let y = brandHeader(doc, 'Basel III/IV Capital Adequacy', 'Pillar 1 · Pillar 2 · Pillar 3 · LCR/NSFR · RWA Monitoring')

  y = sectionLabel(doc, 'Capital Ratios — Current Position', y)
  autoTable(doc, {
    startY: y,
    head: [['Ratio', 'Current (%)', 'Minimum (%)', 'Conservation Buffer (%)', 'Status']],
    body: capitalRatios.map(r => [r.label, r.value, r.min, r.buffer, r.status.toUpperCase()]),
    theme: 'grid',
    headStyles: { fillColor: DARK, textColor: GOLD, fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8.5, textColor: TEXT_DARK },
    alternateRowStyles: { fillColor: CREAM },
    columnStyles: { 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'center' } },
    margin: { left: 14, right: 14 },
  })

  y = doc.lastAutoTable.finalY + 8
  y = sectionLabel(doc, 'Capital Ratio Trend — Last 6 Quarters', y)
  autoTable(doc, {
    startY: y,
    head: [['Quarter', 'CET1 (%)', 'Tier 1 (%)', 'Total Capital (%)']],
    body: capitalTrend.map(t => [t.q, t.cet1, t.tier1, t.total]),
    theme: 'striped',
    headStyles: { fillColor: DARK2, textColor: GOLD, fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8.5, textColor: TEXT_DARK },
    alternateRowStyles: { fillColor: CREAM },
    columnStyles: { 1: { halign: 'center' }, 2: { halign: 'center' }, 3: { halign: 'center' } },
    margin: { left: 14, right: 14 },
  })

  addWatermark(doc)
  brandFooter(doc)
  doc.save('Wadjet-GRC-Basel-Capital-Adequacy-Report.pdf')
}

export function downloadBaselCSV(capitalRatios) {
  downloadCSV('Wadjet-GRC-Capital-Ratios',
    ['Ratio', 'Label', 'Current (%)', 'Minimum (%)', 'Buffer (%)', 'Status'],
    capitalRatios.map(r => [r.name, r.label, r.value, r.min, r.buffer, r.status])
  )
}

export async function downloadBaselXLSX(capitalRatios, capitalTrend) {
  const wb = newWb()

  const { ws: ws1 } = initBrandedSheet(wb, {
    sheetName: 'Capital Ratios',
    title: 'Basel III/IV — Capital Adequacy Ratios',
    subtitle: 'Pillar 1 · Pillar 2 · Pillar 3 · LCR/NSFR · RWA Monitoring',
    columns: [
      { header: 'Ratio',                  width: 32 },
      { header: 'Current (%)',            width: 16 },
      { header: 'CBE Minimum (%)',        width: 18 },
      { header: 'Conservation Buffer (%)',width: 22 },
      { header: 'Status',                 width: 18 },
    ],
    orientation: 'portrait',
  })
  capitalRatios.forEach(r => {
    const row = ws1.addRow([r.label, r.value, r.min, r.buffer, r.status.toUpperCase()])
    row.height = 18
    const fill = r.value >= r.min + (r.buffer || 0) ? 'FFECFFF4' : r.value >= r.min ? 'FFFFFDE8' : 'FFFFEAEA'
    row.eachCell(cell => Object.assign(cell, xlsxCellStyle(fill)))
    ws1.getCell(row.number, 2).alignment = { vertical: 'middle', horizontal: 'center' }
    ws1.getCell(row.number, 3).alignment = { vertical: 'middle', horizontal: 'center' }
    ws1.getCell(row.number, 4).alignment = { vertical: 'middle', horizontal: 'center' }
  })

  const { ws: ws2 } = initBrandedSheet(wb, {
    sheetName: 'Capital Trend',
    title: 'Basel III/IV — Capital Ratio Trend',
    subtitle: 'Last 6 Quarters Historical Data',
    columns: [
      { header: 'Quarter',         width: 16 },
      { header: 'CET1 (%)',        width: 14 },
      { header: 'Tier 1 (%)',      width: 14 },
      { header: 'Total Capital (%)',width: 18 },
    ],
    orientation: 'portrait',
  })
  capitalTrend.forEach((t, i) => {
    const row = ws2.addRow([t.q, t.cet1, t.tier1, t.total])
    row.height = 18
    const fill = i % 2 === 0 ? 'FFFAF7EE' : 'FFFFFFFF'
    row.eachCell(cell => Object.assign(cell, xlsxCellStyle(fill)))
  })

  await saveXLSX(wb, 'Wadjet-GRC-Basel-Capital-Adequacy-Report.xlsx')
}
