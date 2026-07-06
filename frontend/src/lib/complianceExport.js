import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { brandHeader, addWatermark, brandFooter, sectionLabel } from './pdfHelpers'
import { downloadCSV } from './csvExport'
import { newWb, initBrandedSheet, saveXLSX, xlsxCellStyle, xlsxFillByValue } from './excelHelpers'
import { DARK, DARK2, CREAM, GOLD, TEXT_DARK, RED_BG } from './constants'

export function downloadCompliancePDF(frameworks, mappingMatrix) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  let y = brandHeader(doc, 'Compliance Engine Report', 'Cross-Framework Control Mapping')

  y = sectionLabel(doc, 'Framework Summary', y)
  autoTable(doc, {
    startY: y,
    head: [['Framework', 'Authority', 'Compliance %', 'Controls', 'Status']],
    body: frameworks.map(f => [f.name, f.authority, `${f.percent}%`, f.controls, f.active ? 'Active' : 'Inactive']),
    theme: 'grid',
    headStyles: { fillColor: DARK, textColor: GOLD, fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, textColor: TEXT_DARK },
    alternateRowStyles: { fillColor: CREAM },
    columnStyles: { 2: { halign: 'center' }, 3: { halign: 'center' }, 4: { halign: 'center' } },
    margin: { left: 14, right: 14 },
  })

  y = doc.lastAutoTable.finalY + 8
  y = sectionLabel(doc, 'Control Mapping Matrix', y)
  const af = frameworks.filter(f => f.active)
  autoTable(doc, {
    startY: y,
    head: [['Control Requirement', ...af.map(f => f.name.split(' ')[0])]],
    body: mappingMatrix.map(row => [row.control, ...af.map(f => row[f.id]?.mapped ? `✓ ${row[f.id]?.ref || ''}` : 'N/A')]),
    theme: 'striped',
    headStyles: { fillColor: DARK2, textColor: GOLD, fontSize: 7, fontStyle: 'bold' },
    bodyStyles: { fontSize: 7, textColor: TEXT_DARK },
    alternateRowStyles: { fillColor: CREAM },
    margin: { left: 14, right: 14 },
  })

  addWatermark(doc)
  brandFooter(doc)
  doc.save('Wadjet-GRC-Compliance-Framework-Report.pdf')
}

export function downloadComplianceCSV(frameworks, mappingMatrix) {
  const af = frameworks.filter(f => f.active)
  downloadCSV('Wadjet-GRC-Compliance-Matrix',
    ['Control Requirement', ...af.map(f => f.name)],
    mappingMatrix.map(row => [row.control, ...af.map(f => row[f.id]?.mapped ? row[f.id]?.ref : 'N/A')])
  )
}

export async function downloadComplianceXLSX(frameworks, mappingMatrix) {
  const wb = newWb()

  const { ws: ws1 } = initBrandedSheet(wb, {
    sheetName: 'Framework Summary',
    title: 'Compliance Engine — Framework Summary',
    subtitle: 'Cross-Framework Control Mapping',
    columns: [
      { header: 'Framework',    width: 35 },
      { header: 'Authority',    width: 22 },
      { header: 'Compliance %', width: 14 },
      { header: 'Controls',     width: 12 },
      { header: 'Status',       width: 14 },
    ],
  })
  frameworks.forEach(f => {
    const row = ws1.addRow([f.name, f.authority, `${f.percent}%`, f.controls, f.active ? 'Active' : 'Inactive'])
    row.height = 18
    const fill = f.percent >= 90 ? 'FFECFFF4' : f.percent >= 70 ? 'FFFFFDE8' : 'FFFFEAEA'
    row.eachCell(cell => Object.assign(cell, xlsxCellStyle(fill)))
  })

  const af = frameworks.filter(f => f.active)
  const mapCols = [
    { header: 'Control Requirement', width: 42 },
    ...af.map(f => ({ header: f.name.split(' ')[0], width: 18 })),
  ]
  const { ws: ws2 } = initBrandedSheet(wb, {
    sheetName: 'Control Mapping',
    title: 'Compliance Engine — Control Mapping Matrix',
    subtitle: 'Active framework cross-references',
    columns: mapCols,
  })
  mappingMatrix.forEach(row => {
    const vals = [row.control, ...af.map(f => row[f.id]?.mapped ? `✓ ${row[f.id]?.ref || ''}` : 'N/A')]
    const r = ws2.addRow(vals)
    r.height = 18
    r.eachCell((cell, ci) => {
      const fill = ci > 1 ? (vals[ci - 1] === 'N/A' ? 'FFFFEAEA' : 'FFECFFF4') : 'FFFAF7EE'
      Object.assign(cell, xlsxCellStyle(fill))
    })
  })

  await saveXLSX(wb, 'Wadjet-GRC-Compliance-Framework-Report.xlsx')
}
