import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { brandHeader, addWatermark, brandFooter } from './pdfHelpers'
import { downloadCSV } from './csvExport'
import { newWb, initBrandedSheet, saveXLSX, xlsxCellStyle, xlsxFillByValue } from './excelHelpers'
import { DARK, CREAM, GOLD, TEXT_DARK } from './constants'

export function downloadRegulatoryCalendarPDF(submissions) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  let y = brandHeader(doc, 'Regulatory Calendar & Submissions', 'CBE Reporting Period: Q2 2026')

  autoTable(doc, {
    startY: y,
    head: [['ID', 'Submission Title', 'Framework', 'Frequency', 'Due Date', 'Priority', 'Status', 'Owner', 'Evidence Files']],
    body: submissions.map(s => [s.id, s.title, s.framework, s.frequency, s.due, s.priority.toUpperCase(), s.status.replace('-', ' '), s.owner, s.evidence]),
    theme: 'striped',
    headStyles: { fillColor: DARK, textColor: GOLD, fontSize: 7, fontStyle: 'bold' },
    bodyStyles: { fontSize: 7, textColor: TEXT_DARK },
    alternateRowStyles: { fillColor: CREAM },
    margin: { left: 14, right: 14 },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 6) {
        const v = data.cell.raw
        if (v === 'submitted')   data.cell.styles.textColor = [20, 100, 50]
        else if (v === 'in progress') data.cell.styles.textColor = [150, 100, 0]
        else if (v === 'overdue')     { data.cell.styles.textColor = [180, 20, 40]; data.cell.styles.fontStyle = 'bold' }
      }
    },
  })

  addWatermark(doc)
  brandFooter(doc)
  doc.save('Wadjet-GRC-Regulatory-Calendar-Q2-2026.pdf')
}

export function downloadRegulatoryCalendarCSV(submissions) {
  downloadCSV('Wadjet-GRC-Regulatory-Calendar',
    ['ID', 'Title', 'Framework', 'Frequency', 'Due Date', 'Priority', 'Status', 'Owner', 'Evidence Count'],
    submissions.map(s => [s.id, s.title, s.framework, s.frequency, s.due, s.priority, s.status, s.owner, s.evidence])
  )
}

export async function downloadRegulatoryCalendarXLSX(submissions) {
  const wb = newWb()
  const { ws } = initBrandedSheet(wb, {
    sheetName: 'Regulatory Calendar',
    title: 'Regulatory Calendar & Submissions',
    subtitle: 'CBE Reporting Period: Q2 2026 · All scheduled regulatory submissions',
    columns: [
      { header: 'Submission ID',   width: 16 },
      { header: 'Title',           width: 44 },
      { header: 'Framework',       width: 26 },
      { header: 'Frequency',       width: 16 },
      { header: 'Due Date',        width: 16 },
      { header: 'Priority',        width: 14 },
      { header: 'Status',          width: 18 },
      { header: 'Owner',           width: 24 },
      { header: 'Evidence Files',  width: 14 },
    ],
  })
  submissions.forEach(s => {
    const row = ws.addRow([s.id, s.title, s.framework, s.frequency, s.due, s.priority.toUpperCase(), s.status.replace('-', ' '), s.owner, s.evidence])
    row.height = 18
    row.eachCell(cell => Object.assign(cell, xlsxCellStyle(xlsxFillByValue(s.status))))
    ws.getCell(row.number, 7).font = { name: 'Calibri', size: 9, bold: true, color: { argb: xlsxFillByValue(s.status) === 'FFFFEAEA' ? 'FFB01428' : xlsxFillByValue(s.status) === 'FFECFFF4' ? 'FF147832' : 'FFA05000' } }
  })

  await saveXLSX(wb, 'Wadjet-GRC-Regulatory-Calendar-Q2-2026.xlsx')
}
