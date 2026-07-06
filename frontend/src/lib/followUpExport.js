import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { brandHeader, addWatermark, brandFooter } from './pdfHelpers'
import { downloadCSV } from './csvExport'
import { newWb, initBrandedSheet, saveXLSX, xlsxCellStyle, xlsxFillByValue } from './excelHelpers'
import { DARK, CREAM, GOLD, TEXT_DARK, RED_BG } from './constants'

export function downloadFollowUpCSV(tasks) {
  downloadCSV('Wadjet-GRC-Followup-Tasks',
    ['ID', 'Title', 'Severity', 'Category', 'Status', 'Owner', 'Due Date', 'SLA Breached', 'Level'],
    tasks.map(t => [t.id, t.title, t.severity, t.category || '', t.status, t.owner, t.dueDate || '', t.breached ? 'Yes' : 'No', t.level || ''])
  )
}

export function downloadFollowUpPDF(tasks) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  let y = brandHeader(doc, 'Follow-Up Workspace', 'Remediation Action Plan — Task Register')

  autoTable(doc, {
    startY: y,
    head: [['Task ID', 'Title', 'Severity', 'Status', 'Owner', 'Due Date', 'SLA Breached']],
    body: tasks.map(t => [t.id, t.title, t.severity || '', t.status, t.owner || '', t.dueDate || '', t.breached ? 'BREACHED' : 'On Track']),
    theme: 'striped',
    headStyles: { fillColor: DARK, textColor: GOLD, fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 7.5, textColor: TEXT_DARK },
    alternateRowStyles: { fillColor: CREAM },
    margin: { left: 14, right: 14 },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 6 && data.cell.raw === 'BREACHED') {
        data.cell.styles.textColor = [180, 20, 40]
        data.cell.styles.fontStyle = 'bold'
        data.cell.styles.fillColor = RED_BG
      }
    },
  })

  addWatermark(doc)
  brandFooter(doc)
  doc.save('Wadjet-GRC-Followup-Tasks-Report.pdf')
}

export async function downloadFollowUpXLSX(tasks) {
  const wb = newWb()
  const { ws } = initBrandedSheet(wb, {
    sheetName: 'Follow-Up Tasks',
    title: 'Follow-Up Workspace — Remediation Action Plan',
    subtitle: 'Gap remediation & regulatory finding task register',
    columns: [
      { header: 'Task ID',      width: 14 },
      { header: 'Title',        width: 46 },
      { header: 'Severity',     width: 14 },
      { header: 'Category',     width: 22 },
      { header: 'Status',       width: 18 },
      { header: 'Owner',        width: 22 },
      { header: 'Due Date',     width: 14 },
      { header: 'SLA Breached', width: 14 },
      { header: 'Level',        width: 14 },
    ],
  })
  tasks.forEach(t => {
    const breached = t.breached
    const row = ws.addRow([t.id, t.title, t.severity || '', t.category || '', t.status, t.owner || '', t.dueDate || '', breached ? 'BREACHED' : 'On Track', t.level || ''])
    row.height = 18
    const fill = breached ? 'FFFFEAEA' : xlsxFillByValue(t.severity || t.status)
    row.eachCell(cell => Object.assign(cell, xlsxCellStyle(fill)))
    if (breached) ws.getCell(row.number, 8).font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FFB01428' } }
  })

  await saveXLSX(wb, 'Wadjet-GRC-Followup-Tasks-Report.xlsx')
}
